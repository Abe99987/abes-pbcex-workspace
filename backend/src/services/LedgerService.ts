import { db, insertOne } from '@/db';
import { JournalInput, isBalanced } from '@/models/ledger';

export class LedgerService {
  static async postJournal(journal: JournalInput): Promise<{ id: string }> {
    if (!isBalanced(journal.entries)) {
      throw new Error('Unbalanced journal entries');
    }

    if (!db.isConnected()) {
      // For now require DB for ledger writes
      throw new Error('Database not available');
    }

    return db.transaction(async client => {
      const header = await client.query(
        `INSERT INTO ledger_journal (user_id, reference, description, metadata)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [journal.userId || null, journal.reference || null, journal.description || null, journal.metadata || null]
      );

      const journalId = header.rows[0].id as string;

      const insertValues: any[] = [];
      const placeholders: string[] = [];
      journal.entries.forEach((e, idx) => {
        const base = idx * 5;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
        insertValues.push(
          journalId,
          e.accountId,
          e.asset,
          e.direction,
          e.amount
        );
      });

      await client.query(
        `INSERT INTO ledger_entries (journal_id, account_id, asset, direction, amount)
         VALUES ${placeholders.join(',')}`,
        insertValues
      );

      // Materialize balances
      await client.query(`SELECT ledger_materialize_balances()`);

      return { id: journalId };
    });
  }

  static async trialBalance(): Promise<Array<{ asset: string; difference: string }>> {
    if (!db.isConnected()) return [];
    const result = await db.query<{ asset: string; difference: string }>(
      `SELECT asset, difference::text FROM ledger_trial_balance ORDER BY asset`
    );
    return result.rows;
  }
}

export default LedgerService;


