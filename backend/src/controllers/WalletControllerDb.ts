import { Request, Response } from 'express';
import { db, findMany, findOne } from '@/db';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { WalletController } from './WalletController';
import { createObjectCsvWriter } from 'csv-writer';
import * as fastCsv from 'fast-csv';
import LedgerService from '@/services/LedgerService';
import { PricesService } from '@/services/PricesService';

/**
 * Database-backed wallet operations
 * Extends WalletController with Postgres support and CSV export
 */

interface DbBalance {
  id: number;
  account_id: string;
  asset: string;
  amount: string;
  usd_value: string;
  updated_at: Date;
}

interface DbTransaction {
  id: string;
  user_id: string;
  account_id: string;
  ts: Date;
  asset: string;
  amount: string;
  usd_value: string;
  type: string;
  status: string;
  fee_usd: string;
  reference: string;
  description: string;
  created_at: Date;
}

interface DbAccount {
  id: string;
  user_id: string;
  type: string;
  label: string;
  created_at: Date;
  updated_at: Date;
}

export class WalletControllerDb {
  /**
   * GET /api/wallet/balances - Database version
   */
  static getBalances = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    if (!db.isConnected()) {
      logWarn('Database not available, falling back to in-memory');
      return WalletController.getBalances(req, res, () => {});
    }

    try {
      // Get user accounts
      const accounts = await findMany<DbAccount>('accounts', {
        user_id: userId,
      });
      const fundingAccount = accounts.find(a => a.type === 'FUNDING');
      const tradingAccount = accounts.find(a => a.type === 'TRADING');

      if (!fundingAccount || !tradingAccount) {
        logWarn('User accounts not found in DB, falling back to in-memory');
        return WalletController.getBalances(req, res, () => {});
      }

      // Prefer ledger_balances if available
      let fundingBalances: Array<{ asset: string; amount: string }> = [];
      let tradingBalances: Array<{ asset: string; amount: string }> = [];
      try {
        const q = `SELECT account_id, asset, balance::text AS amount FROM ledger_balances WHERE account_id = $1`;
        const fb = await db.query<{ account_id: string; asset: string; amount: string }>(q, [fundingAccount.id]);
        const tb = await db.query<{ account_id: string; asset: string; amount: string }>(q, [tradingAccount.id]);
        fundingBalances = fb.rows.map(r => ({ asset: r.asset, amount: r.amount }));
        tradingBalances = tb.rows.map(r => ({ asset: r.asset, amount: r.amount }));
      } catch {
        // Fallback to balances table
        const fb = await findMany<DbBalance>('balances', { account_id: fundingAccount.id });
        const tb = await findMany<DbBalance>('balances', { account_id: tradingAccount.id });
        fundingBalances = fb.map(b => ({ asset: b.asset, amount: b.amount }));
        tradingBalances = tb.map(b => ({ asset: b.asset, amount: b.amount }));
      }

      // Fetch prices for USD valuation (PAXG drives XAU-s)
      const paxgPrice = await PricesService.getTicker('PAXG');
      const usdPerPaxg = paxgPrice.success && paxgPrice.data ? paxgPrice.data.usd : 0;

      const priceOf = (asset: string): number => {
        if (asset === 'PAXG' || asset === 'XAU-s') return usdPerPaxg;
        if (asset === 'USD') return 1;
        return 0;
      };

      const formatBalances = (rows: Array<{ asset: string; amount: string }>, renameXauSynthetic: boolean) =>
        rows.map(row => {
          const asset = renameXauSynthetic && row.asset === 'PAXG' ? 'XAU-s' : row.asset;
          const usd = (parseFloat(row.amount || '0') * priceOf(asset)).toFixed(2);
          return {
            asset,
            amount: row.amount,
            lockedAmount: '0.00',
            availableAmount: row.amount,
            usdValue: usd,
          };
        });

      const fundingFormatted = formatBalances(fundingBalances, false);
      const tradingFormatted = formatBalances(tradingBalances, true);

      const fundingTotal = fundingFormatted
        .reduce((sum, b) => sum + parseFloat(b.usdValue), 0)
        .toFixed(2);

      const tradingTotal = tradingFormatted
        .reduce((sum, b) => sum + parseFloat(b.usdValue), 0)
        .toFixed(2);

      res.json({
        code: 'SUCCESS',
        data: {
          funding: {
            id: fundingAccount.id,
            type: 'FUNDING',
            name: fundingAccount.label,
            balances: fundingFormatted,
            totalUsdValue: fundingTotal,
          },
          trading: {
            id: tradingAccount.id,
            type: 'TRADING',
            name: tradingAccount.label,
            balances: tradingFormatted,
            totalUsdValue: tradingTotal,
          },
          combined: {
            totalUsdValue: (
              parseFloat(fundingTotal) + parseFloat(tradingTotal)
            ).toFixed(2),
          },
        },
      });
    } catch (error) {
      logError('Database balances query failed, falling back', error as Error);
      return WalletController.getBalances(req, res, () => {});
    }
  });

  /**
   * GET /api/wallet/transactions - Database version with filters
   */
  static getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      q = '',
      asset = '',
      type = '',
      status = '',
      date_from = '',
      date_to = '',
      limit = '50',
      offset = '0',
    } = req.query;

    if (!db.isConnected()) {
      logWarn('Database not available, falling back to in-memory');
      return WalletController.getTransactions(req, res, () => {});
    }

    try {
      // Build dynamic query
      let whereClause = 'WHERE user_id = $1';
      const values: unknown[] = [userId];
      let paramIndex = 2;

      if (asset) {
        whereClause += ` AND asset = $${paramIndex}`;
        values.push(asset);
        paramIndex++;
      }

      if (type) {
        whereClause += ` AND type = $${paramIndex}`;
        values.push(type);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      if (date_from) {
        whereClause += ` AND ts >= $${paramIndex}`;
        values.push(new Date(date_from as string));
        paramIndex++;
      }

      if (date_to) {
        whereClause += ` AND ts <= $${paramIndex}`;
        values.push(new Date(date_to as string));
        paramIndex++;
      }

      if (q) {
        whereClause += ` AND (reference ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        values.push(`%${q}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM transactions ${whereClause}`;
      const countResult = await db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const dataQuery = `
        SELECT * FROM transactions 
        ${whereClause}
        ORDER BY ts DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(parseInt(limit as string), parseInt(offset as string));

      const result = await db.query<DbTransaction>(dataQuery, values);

      const transactions = result.rows.map(tx => ({
        id: tx.id,
        timestamp: tx.ts.toISOString(),
        asset: tx.asset,
        amount: tx.amount,
        usdValue: tx.usd_value,
        type: tx.type,
        status: tx.status,
        fee: tx.fee_usd,
        reference: tx.reference,
        description: tx.description,
      }));

      res.json({
        code: 'SUCCESS',
        data: {
          transactions,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + transactions.length < total,
        },
      });
    } catch (error) {
      logError(
        'Database transactions query failed, falling back',
        error as Error
      );
      return WalletController.getTransactions(req, res, () => {});
    }
  });

  /**
   * GET /api/wallet/transactions/export.csv - CSV export
   */
  static exportTransactionsCsv = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user!.id;
      const { asset, type, status, date_from, date_to } = req.query;

      if (!db.isConnected()) {
        throw createError.serviceUnavailable(
          'Database export requires database connection'
        );
      }

      try {
        // Build query (same logic as getTransactions but without pagination)
        let whereClause = 'WHERE user_id = $1';
        const values: unknown[] = [userId];
        let paramIndex = 2;

        if (asset) {
          whereClause += ` AND asset = $${paramIndex}`;
          values.push(asset);
          paramIndex++;
        }

        if (type) {
          whereClause += ` AND type = $${paramIndex}`;
          values.push(type);
          paramIndex++;
        }

        if (status) {
          whereClause += ` AND status = $${paramIndex}`;
          values.push(status);
          paramIndex++;
        }

        if (date_from) {
          whereClause += ` AND ts >= $${paramIndex}`;
          values.push(new Date(date_from as string));
          paramIndex++;
        }

        if (date_to) {
          whereClause += ` AND ts <= $${paramIndex}`;
          values.push(new Date(date_to as string));
          paramIndex++;
        }

        const query = `
        SELECT 
          ts as "Date/Time",
          asset as "Asset",
          amount as "Amount",
          usd_value as "USD Value",
          type as "Type",
          status as "Status",
          fee_usd as "Fee (USD)",
          reference as "Reference",
          description as "Description"
        FROM transactions 
        ${whereClause}
        ORDER BY ts DESC
      `;

        const result = await db.query(query, values);

        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="transactions-${Date.now()}.csv"`
        );

        // Stream CSV data
        const csvStream = fastCsv.format({ headers: true });
        csvStream.pipe(res);

        result.rows.forEach(row => {
          csvStream.write(row);
        });

        csvStream.end();
      } catch (error) {
        logError('CSV export failed', error as Error);
        throw createError.internal('Export failed');
      }
    }
  );

  /**
   * GET /api/wallet/transactions/export.xlsx - Excel export placeholder
   */
  static exportTransactionsExcel = asyncHandler(
    async (req: Request, res: Response) => {
      // For now, redirect to CSV
      req.url = req.url.replace('.xlsx', '.csv');
      return WalletControllerDb.exportTransactionsCsv(req, res, () => {});
    }
  );

  /**
   * POST /api/wallet/transfer - Database-backed via ledger journal
   */
  static transfer = asyncHandler(async (req: Request, res: Response) => {
    const { from, to, asset, amount } = req.body as { from: 'FUNDING'|'TRADING'; to: 'FUNDING'|'TRADING'; asset: string; amount: string };
    const userId = req.user!.id;

    if (!db.isConnected()) {
      throw createError.serviceUnavailable('Database not available');
    }

    if (!['FUNDING','TRADING'].includes(from) || !['FUNDING','TRADING'].includes(to) || from === to) {
      throw createError.badRequest('Invalid transfer direction');
    }

    // Only PAXG <-> XAU-s supported (1:1). Represent as PAXG in ledger with UI rename for trading.
    if (!['PAXG','XAU-s'].includes(asset)) {
      throw createError.badRequest('Only PAXG/XAU-s supported');
    }

    // Lookup accounts
    const accounts = await findMany<DbAccount>('accounts', { user_id: userId });
    const source = accounts.find(a => a.type === from)!;
    const target = accounts.find(a => a.type === to)!;
    if (!source || !target) throw createError.notFound('Account');

    const amt = parseFloat(amount);
    if (!(amt > 0)) throw createError.badRequest('Amount must be > 0');

    // Check source balance from ledger_balances
    const balRes = await db.query<{ balance: string }>(
      `SELECT balance::text FROM ledger_balances WHERE account_id = $1 AND asset = 'PAXG'`,
      [source.id]
    );
    const have = parseFloat(balRes.rows[0]?.balance || '0');
    if (have < amt) throw createError.badRequest('Insufficient balance');

    // Journal: CREDIT source PAXG, DEBIT target PAXG
    const journal = {
      userId,
      reference: `WALLET-XFER-${Date.now()}`,
      description: `${from}->${to} ${amount} ${asset}`,
      entries: [
        { accountId: source.id, asset: 'PAXG', direction: 'CREDIT' as const, amount: amount },
        { accountId: target.id, asset: 'PAXG', direction: 'DEBIT' as const, amount: amount },
      ],
    };

    const result = await LedgerService.postJournal(journal);

    res.status(201).json({
      code: 'SUCCESS',
      data: {
        journalId: result.id,
        from,
        to,
        asset,
        amount,
        conversionRate: '1.0000',
        completedAt: new Date().toISOString(),
      },
    });
  });
}
