import { z } from 'zod';

export const ledgerEntrySchema = z.object({
  accountId: z.string().uuid(),
  asset: z.string().min(1).max(20),
  direction: z.enum(['DEBIT', 'CREDIT']),
  amount: z.string().regex(/^\d+\.?\d*$/, 'Invalid amount'),
});

export const journalSchema = z.object({
  userId: z.string().uuid().optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  entries: z.array(ledgerEntrySchema).min(2),
});

export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>;
export type JournalInput = z.infer<typeof journalSchema>;

export function isBalanced(entries: LedgerEntryInput[]): boolean {
  const byAsset: Record<string, { debit: number; credit: number }> = {};
  for (const e of entries) {
    const asset = e.asset;
    if (!byAsset[asset]) byAsset[asset] = { debit: 0, credit: 0 };
    const amt = parseFloat(e.amount);
    if (e.direction === 'DEBIT') byAsset[asset].debit += amt;
    else byAsset[asset].credit += amt;
  }
  return Object.values(byAsset).every(v => Math.abs(v.debit - v.credit) < 1e-8);
}


