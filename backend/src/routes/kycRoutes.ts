import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody } from '@/utils/validators';
import { personalKycSchema, businessKycSchema } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { KycController } from '@/controllers/KycController';
import { z } from 'zod';

const router = Router();

// Rate limiting for KYC submissions
const kycLimiter = rateLimit({
  windowMs: RATE_LIMITS.KYC.windowMs,
  max: RATE_LIMITS.KYC.max,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many KYC submissions, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All KYC routes require authentication
router.use(authenticate);

/**
 * POST /api/kyc/submit
 * Submit personal KYC information
 */
router.post('/submit',
  kycLimiter,
  validateBody(personalKycSchema),
  KycController.submitPersonalKyc
);

/**
 * POST /api/kyc/kyb/submit  
 * Submit business KYB information
 */
router.post('/kyb/submit',
  kycLimiter,
  validateBody(businessKycSchema),
  KycController.submitBusinessKyb
);

/**
 * GET /api/kyc/status
 * Get KYC status for current user
 */
router.get('/status',
  KycController.getKycStatus
);

/**
 * GET /api/kyc/documents/:recordId
 * Get uploaded documents for a KYC record
 */
router.get('/documents/:recordId',
  KycController.getDocuments
);

/**
 * POST /api/kyc/resubmit/:recordId
 * Resubmit KYC after rejection
 */
router.post('/resubmit/:recordId',
  validateBody(z.object({
    // Allow partial updates to submission data
    personal: z.object({}).passthrough().optional(),
    documents: z.array(z.object({}).passthrough()).optional(),
  })),
  KycController.resubmitKyc
);

export default router;