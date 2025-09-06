import { Router } from 'express';
import { validateBody } from '@/utils/validators';
import { LedgerController } from '@/controllers/LedgerController';
import { journalSchema } from '@/models/ledger';

const router = Router();

router.post('/ledger/journal', validateBody(journalSchema), LedgerController.postJournal);
router.get('/ledger/trial-balance', LedgerController.getTrialBalance);

export default router;


