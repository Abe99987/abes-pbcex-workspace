import { Request, Response } from 'express';
import { asyncHandler, createError } from '@/middlewares/errorMiddleware';
import LedgerService from '@/services/LedgerService';
import { journalSchema } from '@/models/ledger';

export class LedgerController {
  static postJournal = asyncHandler(async (req: Request, res: Response) => {
    const parsed = journalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError.badRequest(parsed.error.message);
    }
    const result = await LedgerService.postJournal(parsed.data);
    res.status(201).json({ success: true, data: result });
  });

  static getTrialBalance = asyncHandler(async (req: Request, res: Response) => {
    const rows = await LedgerService.trialBalance();
    res.json({ success: true, data: rows });
  });
}

export default LedgerController;


