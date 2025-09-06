import { Request, Response } from 'express';
import { asyncHandler, createError } from '@/middlewares/errorMiddleware';
import LedgerService from '@/services/LedgerService';
import { PricesService } from '@/services/PricesService';
import { db, findMany } from '@/db';
import { truncate8, add as decAdd } from '@/lib/decimal';
import { env } from '@/config/env';

type AuthedRequest<T> = Request & { user: { id: string }; body: T } & { requestId?: string };

interface TradeBody {
  symbol: string; // e.g., 'PAXG' <-> 'XAU-s' pairs initially
  qty: string;    // decimal string
  slippage?: number; // percentage in decimal, e.g., 0.005 = 0.5%
  request_id: string; // idempotency key
}

export class TradesController {
  /**
   * POST /api/trades/buy
   * User buys `symbol` using PAXG (for synthetics, 1:1 with PAXG)
   */
  static buy = asyncHandler(async (req: AuthedRequest<TradeBody>, res: Response) => {
    const { symbol, qty, slippage = 0.005, request_id } = req.body;
    const userId = req.user.id;

    if (!['XAU-s', 'PAXG'].includes(symbol)) {
      throw createError.badRequest('Unsupported symbol');
    }
    if (!/^[0-9]+(\.[0-9]+)?$/.test(qty) || parseFloat(qty) <= 0) {
      throw createError.badRequest('Invalid qty');
    }
    if (!request_id || request_id.length < 8) {
      throw createError.badRequest('Missing request_id');
    }

    // Idempotency: if a journal with this reference exists, return exact original receipt
    if (db.isConnected()) {
      const existing = await db.query<{ id: string; ts: Date; metadata: any }>(
        `SELECT id, ts, metadata FROM ledger_journal WHERE reference = $1 LIMIT 1`,
        [request_id]
      );
      const row = existing.rows[0];
      if (row) {
        const m = row.metadata || {};
        // Conflict check: differing payloads with same request_id
        if (
          (m.side && m.side !== 'BUY') ||
          (m.symbol && m.symbol !== symbol) ||
          (m.qty && m.qty !== qty)
        ) {
          return res.status(409).json({
            success: false,
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Conflicting payload for existing request_id',
          });
        }
        return res.status(200).json({
          success: true,
          data: {
            journal_id: row.id,
            request_id,
            symbol: m.symbol ?? symbol,
            qty: m.qty ?? qty,
            price: m.price_usd,
            fee: m.fee,
            spread_bps: m.spread_bps ?? 0,
            ts: (row.ts || new Date()).toISOString(),
            price_source: m.source ?? 'PricesService',
            side: 'BUY',
            synthetic_symbol: m.synthetic_symbol,
            receipt_v: m.receipt_v ?? 'v1',
          },
        });
      }
    }

    // Lookup user's FUNDING and TRADING accounts
    const accounts = await findMany<{ id: string; type: string }>('accounts', { user_id: userId });
    const funding = accounts.find(a => a.type === 'FUNDING');
    const trading = accounts.find(a => a.type === 'TRADING');
    if (!funding || !trading) throw createError.notFound('Account');

    const amount = truncate8(qty); // buy `symbol` amount (scale 8)

    // Price snapshots for slippage comparison
    const prevSnap = await PricesService.getTicker('PAXG');
    const priceSnap = await PricesService.getTicker('PAXG');
    if (!priceSnap.success || !priceSnap.data) {
      throw createError.serviceUnavailable('PricesService', 'Price unavailable');
    }
    // Slippage: compare execution vs previous snapshot when available
    if (slippage !== undefined && prevSnap.success && prevSnap.data) {
      const prev = prevSnap.data.usd;
      const exec = priceSnap.data.usd;
      const rel = Math.abs(exec - prev) / (prev || exec || 1);
      if (rel > slippage) {
        return res.status(409).json({
          success: false,
          code: 'SLIPPAGE_EXCEEDED',
          message: 'Price slippage exceeds maximum tolerance',
        });
      }
    }

    // Fee: 0.5% of qty (in sold asset). For buy, we sell PAXG to receive XAU-s 1:1.
    const feeBps = env.FEE_BPS ?? 50;
    const feeRate = feeBps / 10000;
    const computedFee = truncate8((parseFloat(amount) * feeRate).toString());
    const fee = truncate8(
      (
        Math.max(parseFloat(computedFee), parseFloat(env.FEE_MIN_PAXG || '0'))
      ).toString()
    );

    // Ledger legs (balanced):
    // CREDIT funding PAXG by (qty + fee)  [user gives up PAXG]
    //   - fee goes to admin/trading account PAXG as DEBIT fee
    // DEBIT trading PAXG by qty          [ledger stores synthetics as PAXG]
    // NOTE: We represent XAU-s in UI; ledger uses PAXG for synthetic backing

    // Check balance from ledger_balances
    if (!db.isConnected()) throw createError.serviceUnavailable('Database required');
    const balRes = await db.query<{ balance: string }>(
      `SELECT balance::text FROM ledger_balances WHERE account_id = $1 AND asset = 'PAXG'`,
      [funding.id]
    );
    const have = parseFloat(balRes.rows[0]?.balance || '0');
    const needStr = decAdd(amount, fee);
    const need = parseFloat(needStr);
    if (have < need) throw createError.badRequest('Insufficient balance');

    // Determine platform fee account: use admin TRADING account as fee sink
    const adminAccountRes = await db.query<{ id: string }>(
      `SELECT id FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@pbcex.com') AND type = 'TRADING' LIMIT 1`
    );
    const feeAccountId = adminAccountRes.rows[0]?.id || trading.id; // fallback to trading

    const journal = {
      userId,
      reference: request_id,
      description: `BUY ${symbol} ${qty}`,
      metadata: {
        side: 'BUY',
        symbol,
        qty,
        slippage,
        price_usd: priceSnap.data.usd,
        fee_rate: feeRate,
        source: 'PricesService',
        fee,
        synthetic_symbol: symbol === 'XAU-s' ? 'XAU-s' : undefined,
        spread_bps: 0,
        request_id,
        receipt_v: 'v1',
      },
      entries: [
        { accountId: funding.id, asset: 'PAXG', direction: 'CREDIT' as const, amount: truncate8(need.toString()) },
        { accountId: trading.id, asset: 'PAXG', direction: 'DEBIT' as const, amount: amount },
        { accountId: feeAccountId, asset: 'PAXG', direction: 'DEBIT' as const, amount: fee },
      ],
    };

    const result = await LedgerService.postJournal(journal);

    const receipt = {
      symbol,
      qty: amount,
      price: priceSnap.data.usd,
      fee,
      ts: new Date().toISOString(),
      price_source: 'PricesService',
      spread_bps: prevSnap.success && prevSnap.data
        ? Math.round(((priceSnap.data.usd - prevSnap.data.usd) / (prevSnap.data.usd || 1)) * 10000)
        : 0,
      request_id,
      journal_id: result.id,
      side: 'BUY',
      synthetic_symbol: symbol === 'XAU-s' ? 'XAU-s' : undefined,
      receipt_v: 'v1',
    };

    return res.status(201).json({ success: true, data: receipt });
  });

  /**
   * POST /api/trades/sell
   * User sells `symbol` to receive PAXG
   */
  static sell = asyncHandler(async (req: AuthedRequest<TradeBody>, res: Response) => {
    const { symbol, qty, slippage = 0.005, request_id } = req.body;
    const userId = req.user.id;

    if (!['XAU-s', 'PAXG'].includes(symbol)) {
      throw createError.badRequest('Unsupported symbol');
    }
    if (!/^[0-9]+(\.[0-9]+)?$/.test(qty) || parseFloat(qty) <= 0) {
      throw createError.badRequest('Invalid qty');
    }
    if (!request_id || request_id.length < 8) {
      throw createError.badRequest('Missing request_id');
    }

    if (db.isConnected()) {
      const existing = await db.query<{ id: string; ts: Date; metadata: any }>(
        `SELECT id, ts, metadata FROM ledger_journal WHERE reference = $1 LIMIT 1`,
        [request_id]
      );
      const row = existing.rows[0];
      if (row) {
        const m = row.metadata || {};
        if (
          (m.side && m.side !== 'SELL') ||
          (m.symbol && m.symbol !== symbol) ||
          (m.qty && m.qty !== qty)
        ) {
          return res.status(409).json({
            success: false,
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Conflicting payload for existing request_id',
          });
        }
        return res.status(200).json({
          success: true,
          data: {
            journal_id: row.id,
            request_id,
            symbol: m.symbol ?? symbol,
            qty: m.qty ?? qty,
            price: m.price_usd,
            fee: m.fee,
            spread_bps: m.spread_bps ?? 0,
            ts: (row.ts || new Date()).toISOString(),
            price_source: m.source ?? 'PricesService',
            side: 'SELL',
            synthetic_symbol: m.synthetic_symbol,
            receipt_v: m.receipt_v ?? 'v1',
          },
        });
      }
    }

    const accounts = await findMany<{ id: string; type: string }>('accounts', { user_id: userId });
    const funding = accounts.find(a => a.type === 'FUNDING');
    const trading = accounts.find(a => a.type === 'TRADING');
    if (!funding || !trading) throw createError.notFound('Account');

    const prevSnap = await PricesService.getTicker('PAXG');
    const priceSnap = await PricesService.getTicker('PAXG');
    if (!priceSnap.success || !priceSnap.data) {
      throw createError.serviceUnavailable('PricesService', 'Price unavailable');
    }
    if (slippage !== undefined && prevSnap.success && prevSnap.data) {
      const prev = prevSnap.data.usd;
      const exec = priceSnap.data.usd;
      const rel = Math.abs(exec - prev) / (prev || exec || 1);
      if (rel > slippage) {
        return res.status(409).json({
          success: false,
          code: 'SLIPPAGE_EXCEEDED',
          message: 'Price slippage exceeds maximum tolerance',
        });
      }
    }

    const feeBps = env.FEE_BPS ?? 50;
    const amount = truncate8(qty);
    const feeRate = feeBps / 10000;
    const computedFee = truncate8((parseFloat(amount) * feeRate).toString());
    const fee = truncate8(
      (
        Math.max(parseFloat(computedFee), parseFloat(env.FEE_MIN_PAXG || '0'))
      ).toString()
    );

    if (!db.isConnected()) throw createError.serviceUnavailable('Database required');
    // Check synthetic balance (represented as PAXG in ledger under TRADING account)
    const balRes = await db.query<{ balance: string }>(
      `SELECT balance::text FROM ledger_balances WHERE account_id = $1 AND asset = 'PAXG'`,
      [trading.id]
    );
    const have = parseFloat(balRes.rows[0]?.balance || '0');
    const need = parseFloat(amount);
    if (have < need) throw createError.badRequest('Insufficient balance');

    const adminAccountRes = await db.query<{ id: string }>(
      `SELECT id FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@pbcex.com') AND type = 'TRADING' LIMIT 1`
    );
    const feeAccountId = adminAccountRes.rows[0]?.id || trading.id;

    // SELL: CREDIT trading PAXG by qty; DEBIT funding PAXG by (qty - fee); CREDIT fee to fee account
    // To keep entries balanced with two directions, we implement as:
    // CREDIT trading qty; DEBIT funding qty; CREDIT funding fee; DEBIT feeAccount fee
    const journal = {
      userId,
      reference: request_id,
      description: `SELL ${symbol} ${qty}`,
      metadata: {
        side: 'SELL',
        symbol,
        qty,
        slippage,
        price_usd: priceSnap.data.usd,
        fee_rate: feeRate,
        source: 'PricesService',
        fee,
        synthetic_symbol: symbol === 'XAU-s' ? 'XAU-s' : undefined,
        spread_bps: 0,
        request_id,
        receipt_v: 'v1',
      },
      entries: [
        { accountId: trading.id, asset: 'PAXG', direction: 'CREDIT' as const, amount: amount },
        { accountId: funding.id, asset: 'PAXG', direction: 'DEBIT' as const, amount: amount },
        { accountId: funding.id, asset: 'PAXG', direction: 'CREDIT' as const, amount: fee },
        { accountId: feeAccountId, asset: 'PAXG', direction: 'DEBIT' as const, amount: fee },
      ],
    };

    const result = await LedgerService.postJournal(journal);

    const receipt = {
      symbol,
      qty: amount,
      price: priceSnap.data.usd,
      fee,
      ts: new Date().toISOString(),
      price_source: 'PricesService',
      spread_bps: prevSnap.success && prevSnap.data
        ? Math.round(((priceSnap.data.usd - prevSnap.data.usd) / (prevSnap.data.usd || 1)) * 10000)
        : 0,
      request_id,
      journal_id: result.id,
      side: 'SELL',
      synthetic_symbol: symbol === 'XAU-s' ? 'XAU-s' : undefined,
      receipt_v: 'v1',
    };

    return res.status(201).json({ success: true, data: receipt });
  });
}

export default TradesController;


