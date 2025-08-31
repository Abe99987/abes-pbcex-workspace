import { Request, Response } from 'express';
import { db, findMany } from '@/db';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { TradeController } from './TradeController';
import { PriceCache } from '@/cache/redis';
import * as fastCsv from 'fast-csv';

/**
 * Database-backed trade operations
 * Extends TradeController with Postgres support and enhanced price caching
 */

interface DbTrade {
  id: string;
  user_id: string;
  ts: Date;
  pair: string;
  side: string;
  order_type: string;
  price: string;
  amount: string;
  filled: string;
  fee: string;
  fee_asset: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class TradeControllerDb {
  /**
   * GET /api/trade/history - Database version with filters
   */
  static getTradeHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      pair = '',
      side = '',
      order_type = '',
      status = '',
      date_from = '',
      date_to = '',
      limit = '50',
      offset = '0',
    } = req.query;

    if (!db.isConnected()) {
      logWarn('Database not available, falling back to in-memory');
      return TradeController.getTradeHistory(req, res, () => {});
    }

    try {
      // Build dynamic query
      let whereClause = 'WHERE user_id = $1';
      const values: unknown[] = [userId];
      let paramIndex = 2;

      if (pair) {
        whereClause += ` AND pair = $${paramIndex}`;
        values.push(pair);
        paramIndex++;
      }

      if (side) {
        whereClause += ` AND side = $${paramIndex}`;
        values.push(side);
        paramIndex++;
      }

      if (order_type) {
        whereClause += ` AND order_type = $${paramIndex}`;
        values.push(order_type);
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

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM trades ${whereClause}`;
      const countResult = await db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get aggregated KPIs
      const kpiQuery = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'FILLED') as filled_orders,
          COALESCE(SUM(CASE WHEN status = 'FILLED' THEN (filled::numeric * price::numeric) ELSE 0 END), 0) as total_volume,
          COALESCE(SUM(CASE WHEN status IN ('FILLED', 'PARTIALLY_FILLED') THEN fee::numeric ELSE 0 END), 0) as total_fees
        FROM trades ${whereClause}
      `;
      const kpiResult = await db.query(kpiQuery, values);
      const kpis = kpiResult.rows[0];

      // Get paginated results
      const dataQuery = `
        SELECT * FROM trades 
        ${whereClause}
        ORDER BY ts DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(parseInt(limit as string), parseInt(offset as string));

      const result = await db.query<DbTrade>(dataQuery, values);

      const trades = result.rows.map(trade => ({
        id: trade.id,
        timestamp: trade.ts.toISOString(),
        pair: trade.pair,
        side: trade.side,
        orderType: trade.order_type,
        price: trade.price,
        amount: trade.amount,
        filled: trade.filled,
        total: (parseFloat(trade.filled) * parseFloat(trade.price)).toFixed(2),
        fee: trade.fee,
        feeAsset: trade.fee_asset,
        status: trade.status,
        fillPercentage:
          trade.amount !== '0'
            ? (
                (parseFloat(trade.filled) / parseFloat(trade.amount)) *
                100
              ).toFixed(1)
            : '0',
      }));

      res.json({
        code: 'SUCCESS',
        data: {
          kpis: {
            totalOrders: parseInt(kpis.total_orders),
            filledOrders: parseInt(kpis.filled_orders),
            totalVolume: parseFloat(kpis.total_volume).toFixed(2),
            totalFees: parseFloat(kpis.total_fees).toFixed(2),
          },
          trades,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + trades.length < total,
        },
      });
    } catch (error) {
      logError('Database trades query failed, falling back', error as Error);
      return TradeController.getTradeHistory(req, res, () => {});
    }
  });

  /**
   * GET /api/trade/history/export.csv - CSV export
   */
  static exportTradeHistoryCsv = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user!.id;
      const { pair, side, order_type, status, date_from, date_to } = req.query;

      if (!db.isConnected()) {
        throw createError.serviceUnavailable(
          'Database export requires database connection'
        );
      }

      try {
        // Build query (same logic as getTradeHistory but without pagination)
        let whereClause = 'WHERE user_id = $1';
        const values: unknown[] = [userId];
        let paramIndex = 2;

        if (pair) {
          whereClause += ` AND pair = $${paramIndex}`;
          values.push(pair);
          paramIndex++;
        }

        if (side) {
          whereClause += ` AND side = $${paramIndex}`;
          values.push(side);
          paramIndex++;
        }

        if (order_type) {
          whereClause += ` AND order_type = $${paramIndex}`;
          values.push(order_type);
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
          pair as "Pair",
          side as "Side",
          order_type as "Order Type",
          price as "Price",
          amount as "Amount",
          filled as "Filled",
          (filled::numeric * price::numeric) as "Total Value",
          fee as "Fee",
          fee_asset as "Fee Asset",
          status as "Status",
          id as "Order ID"
        FROM trades 
        ${whereClause}
        ORDER BY ts DESC
      `;

        const result = await db.query(query, values);

        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="trade-history-${Date.now()}.csv"`
        );

        // Stream CSV data
        const csvStream = fastCsv.format({ headers: true });
        csvStream.pipe(res);

        result.rows.forEach(row => {
          csvStream.write(row);
        });

        csvStream.end();
      } catch (error) {
        logError('Trade CSV export failed', error as Error);
        throw createError.internal('Export failed');
      }
    }
  );

  /**
   * GET /api/trade/history/export.xlsx - Excel export placeholder
   */
  static exportTradeHistoryExcel = asyncHandler(
    async (req: Request, res: Response) => {
      // For now, redirect to CSV
      req.url = req.url.replace('.xlsx', '.csv');
      return TradeControllerDb.exportTradeHistoryCsv(req, res, () => {});
    }
  );

  /**
   * GET /prices - Enhanced with Redis caching
   */
  static getPrices = asyncHandler(async (req: Request, res: Response) => {
    const { asset } = req.query;

    try {
      // Try to get from cache first
      let cachedPrice = null;
      if (asset) {
        cachedPrice = await PriceCache.getPrice(asset as string);
      }

      if (cachedPrice) {
        res.json({
          code: 'SUCCESS',
          data: {
            asset,
            price: cachedPrice.price,
            change24h: cachedPrice.change24h,
            changePct24h: cachedPrice.changePct24h,
            timestamp: new Date(cachedPrice.timestamp).toISOString(),
            source: 'cache',
          },
        });
        return;
      }

      // Fall back to existing price logic
      return TradeController.getPrices(req, res, () => {});
    } catch (error) {
      logError('Enhanced price lookup failed, falling back', error as Error);
      return TradeController.getPrices(req, res, () => {});
    }
  });

  /**
   * Update price cache (internal method for PriceFeedService)
   */
  static async updatePriceCache(
    asset: string,
    currentPrice: number
  ): Promise<void> {
    try {
      // Initialize 24h open if not exists
      await PriceCache.initializeOpen24h(asset, currentPrice);

      // Get 24h open price
      const open24h = await PriceCache.getOpen24h(asset);

      if (open24h) {
        const change24h = currentPrice - open24h;
        const changePct24h = (change24h / open24h) * 100;

        // Update current price cache
        await PriceCache.setPrice(asset, currentPrice, change24h, changePct24h);

        logInfo(`Price cache updated for ${asset}`, {
          price: currentPrice,
          change24h: change24h.toFixed(2),
          changePct24h: changePct24h.toFixed(2),
        });
      }
    } catch (error) {
      logError(`Failed to update price cache for ${asset}`, error as Error);
    }
  }
}
