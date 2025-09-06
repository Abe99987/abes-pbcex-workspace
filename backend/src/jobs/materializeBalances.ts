import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';

/**
 * Re-materialize ledger balances deterministically from ledger_entries
 */
export async function materializeBalances(): Promise<{ updated: number }> {
  try {
    await db.query(`
      DELETE FROM ledger_balances;
      INSERT INTO ledger_balances (account_id, asset, balance, updated_at)
      SELECT account_id,
             asset,
             ROUND(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END)::numeric, 8) AS balance,
             NOW()
      FROM ledger_entries
      GROUP BY account_id, asset;
    `);
    const res = await db.query('SELECT COUNT(*) as c FROM ledger_balances');
    const updated = parseInt(res.rows[0].c || '0', 10);
    logInfo('materializeBalances completed', { updated });
    return { updated };
  } catch (error) {
    logError('materializeBalances failed', error as Error);
    throw error;
  }
}

export default materializeBalances;


