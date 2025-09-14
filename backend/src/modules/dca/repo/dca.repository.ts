import { db } from '@/db';
import {
  DCARule,
  CreateDCARuleInput,
  UpdateDCARuleInput,
} from '../entities/dca-rule.entity';
import { ScheduleService } from '../services/schedule.service';
import { logError, logInfo } from '@/utils/logger';

/**
 * DCA Repository
 * Handles database operations for DCA rules
 */
export class DCARepository {
  /**
   * Create a new DCA rule
   */
  static async create(
    rule: CreateDCARuleInput & { userId: string }
  ): Promise<DCARule> {
    try {
      const query = `
        INSERT INTO dca_rules (
          user_id, base_symbol, quote_symbol, cadence, amount_minor, 
          currency_symbol, execution_time_utc, start_date, end_date, monthly_day,
          from_account, active, next_run_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING *
      `;

      // Set monthly_day default to 1 if monthly cadence and not provided
      const monthlyDay =
        rule.cadence === 'monthly' ? (rule as any).monthlyDay || 1 : null;

      const nextRunAt = ScheduleService.computeNextRunAt(
        rule.cadence,
        rule.startDate,
        rule.executionTimeUtc,
        monthlyDay
      );

      const values = [
        rule.userId,
        rule.baseSymbol,
        rule.quoteSymbol,
        rule.cadence,
        rule.amountMinor.toString(),
        rule.currencySymbol,
        rule.executionTimeUtc,
        rule.startDate,
        rule.endDate || null,
        monthlyDay,
        rule.fromAccount,
        true, // active by default
        nextRunAt,
      ];

      const result = await db.query(query, values);
      const row = result.rows[0];

      return DCARepository.mapRowToRule(row);
    } catch (error) {
      logError('Failed to create DCA rule', error as Error);
      throw error;
    }
  }

  /**
   * Get DCA rule by ID and user ID
   */
  static async findById(id: string, userId: string): Promise<DCARule | null> {
    try {
      const query = `
        SELECT * FROM dca_rules 
        WHERE id = $1 AND user_id = $2 AND active = true
      `;

      const result = await db.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return DCARepository.mapRowToRule(result.rows[0]);
    } catch (error) {
      logError('Failed to find DCA rule by ID', error as Error);
      throw error;
    }
  }

  /**
   * Get all DCA rules for a user
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    status?: 'active' | 'paused' | 'ended'
  ): Promise<{ rules: DCARule[]; total: number }> {
    try {
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        if (status === 'active') {
          whereClause +=
            ' AND active = true AND (end_date IS NULL OR end_date > NOW())';
        } else if (status === 'paused') {
          whereClause += ' AND active = false';
        } else if (status === 'ended') {
          whereClause +=
            ' AND active = true AND end_date IS NOT NULL AND end_date <= NOW()';
        }
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM dca_rules ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get rules with pagination
      const query = `
        SELECT * FROM dca_rules 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const result = await db.query(query, params);

      const rules = result.rows.map(row => DCARepository.mapRowToRule(row));

      return { rules, total };
    } catch (error) {
      logError('Failed to find DCA rules by user ID', error as Error);
      throw error;
    }
  }

  /**
   * Update DCA rule
   */
  static async update(
    id: string,
    userId: string,
    updates: UpdateDCARuleInput
  ): Promise<DCARule | null> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'amountMinor') {
            updateFields.push(`amount_minor = $${paramIndex}`);
            values.push(value.toString());
          } else if (key === 'startDate' || key === 'endDate') {
            updateFields.push(
              `${key === 'startDate' ? 'start_date' : 'end_date'} = $${paramIndex}`
            );
            values.push(value);
          } else if (key === 'executionTimeUtc') {
            updateFields.push(`execution_time_utc = $${paramIndex}`);
            values.push(value);
          } else if (key === 'fromAccount') {
            updateFields.push(`from_account = $${paramIndex}`);
            values.push(value);
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        // No updates to make, return existing rule
        return DCARepository.findById(id, userId);
      }

      // Add updated_at
      updateFields.push(`updated_at = NOW()`);

      // Recalculate next_run_at if relevant fields changed
      if (updates.cadence || updates.executionTimeUtc || updates.startDate) {
        // We need to get the current rule to calculate next_run_at
        const currentRule = await DCARepository.findById(id, userId);
        if (currentRule) {
          const nextRunAt = ScheduleService.computeNextRunAt(
            updates.cadence || currentRule.cadence,
            updates.startDate || currentRule.startDate,
            updates.executionTimeUtc || currentRule.executionTimeUtc,
            updates.monthlyDay || currentRule.monthlyDay
          );
          updateFields.push(`next_run_at = $${paramIndex}`);
          values.push(nextRunAt);
          paramIndex++;
        }
      }

      values.push(id, userId);
      paramIndex += 2;

      const query = `
        UPDATE dca_rules 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return DCARepository.mapRowToRule(result.rows[0]);
    } catch (error) {
      logError('Failed to update DCA rule', error as Error);
      throw error;
    }
  }

  /**
   * Soft delete DCA rule (set active = false)
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE dca_rules 
        SET active = false, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await db.query(query, [id, userId]);

      return result.rows.length > 0;
    } catch (error) {
      logError('Failed to delete DCA rule', error as Error);
      throw error;
    }
  }

  /**
   * Get rules that need to be executed (next_run_at <= now)
   */
  static async getRulesToExecute(): Promise<DCARule[]> {
    try {
      const query = `
        SELECT * FROM dca_rules 
        WHERE active = true 
        AND next_run_at <= NOW()
        AND (end_date IS NULL OR end_date > NOW())
        ORDER BY next_run_at ASC
      `;

      const result = await db.query(query);

      return result.rows.map(row => DCARepository.mapRowToRule(row));
    } catch (error) {
      logError('Failed to get rules to execute', error as Error);
      throw error;
    }
  }

  /**
   * Update next_run_at for a rule
   */
  static async updateNextRunAt(id: string, nextRunAt: Date): Promise<void> {
    try {
      const query = `
        UPDATE dca_rules 
        SET next_run_at = $1, updated_at = NOW()
        WHERE id = $2
      `;

      await db.query(query, [nextRunAt, id]);
    } catch (error) {
      logError('Failed to update next_run_at', error as Error);
      throw error;
    }
  }

  /**
   * Map database row to DCARule entity
   */
  private static mapRowToRule(row: any): DCARule {
    return {
      id: row.id,
      userId: row.user_id,
      baseSymbol: row.base_symbol,
      quoteSymbol: row.quote_symbol,
      cadence: row.cadence,
      amountMinor: BigInt(row.amount_minor),
      currencySymbol: row.currency_symbol,
      executionTimeUtc: row.execution_time_utc,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      monthlyDay: row.monthly_day || undefined,
      fromAccount: row.from_account,
      active: row.active,
      nextRunAt: new Date(row.next_run_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
