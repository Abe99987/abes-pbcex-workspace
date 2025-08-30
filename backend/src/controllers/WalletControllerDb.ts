import { Request, Response } from 'express';
import { db, findMany, findOne } from '@/db';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { WalletController } from './WalletController';
import { createObjectCsvWriter } from 'csv-writer';
import * as fastCsv from 'fast-csv';

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
      return WalletController.getBalances(req, res);
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
        return WalletController.getBalances(req, res);
      }

      // Get balances for each account
      const fundingBalances = await findMany<DbBalance>('balances', {
        account_id: fundingAccount.id,
      });
      const tradingBalances = await findMany<DbBalance>('balances', {
        account_id: tradingAccount.id,
      });

      // Format response to match existing API
      const formatBalances = (balances: DbBalance[]) =>
        balances.map(balance => ({
          asset: balance.asset,
          amount: balance.amount,
          lockedAmount: '0.00', // Not implemented yet
          availableAmount: balance.amount,
          usdValue: balance.usd_value,
        }));

      const fundingFormatted = formatBalances(fundingBalances);
      const tradingFormatted = formatBalances(tradingBalances);

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
      return WalletController.getBalances(req, res);
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
      return WalletController.getTransactions(req, res);
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
      return WalletController.getTransactions(req, res);
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
      return WalletControllerDb.exportTransactionsCsv(req, res);
    }
  );
}
