import { Router, RequestHandler } from 'express';
import {
  TransfersController,
  transfersMiddleware,
} from '@/controllers/TransfersController';
import {
  CryptoController,
  cryptoMiddleware,
} from '@/controllers/CryptoController';
import {
  BeneficiariesController,
  beneficiariesMiddleware,
} from '@/controllers/BeneficiariesController';
import { QRController, qrMiddleware } from '@/controllers/QRController';
import {
  PaymentRequestsController,
  paymentRequestsMiddleware,
} from '@/controllers/PaymentRequestsController';
import {
  RecurringController,
  recurringMiddleware,
} from '@/controllers/RecurringController';
import {
  CardFundingController,
  cardFundingMiddleware,
} from '@/controllers/CardFundingController';
import { DCAController, dcaMiddleware } from '@/controllers/DCAController';

// Helper function to cast middleware to Express RequestHandler
const asRequestHandler = (middleware: any): RequestHandler =>
  middleware as RequestHandler;

const router = Router();

// ============================================================================
// TRANSFERS ROUTES
// ============================================================================

// Internal transfers
router.post(
  '/transfers/internal',
  ...transfersMiddleware.internalTransfer.map(asRequestHandler),
  TransfersController.createInternalTransfer
);

router.get(
  '/transfers/internal/:id',
  ...transfersMiddleware.readOnly.map(asRequestHandler),
  TransfersController.getInternalTransferStatus
);

// Bank transfers
router.post(
  '/transfers/bank',
  ...transfersMiddleware.bankTransfer.map(asRequestHandler),
  TransfersController.createBankTransfer
);

router.get(
  '/transfers/bank/:id',
  ...transfersMiddleware.readOnly.map(asRequestHandler),
  TransfersController.getBankTransferStatus
);

router.post(
  '/transfers/bank/estimate-fees',
  ...transfersMiddleware.readOnly.map(asRequestHandler),
  TransfersController.estimateBankFees
);

// Transfer history
router.get(
  '/transfers/history',
  ...transfersMiddleware.readOnly.map(asRequestHandler),
  TransfersController.getTransferHistory
);

// ============================================================================
// CRYPTO ROUTES
// ============================================================================

// Crypto networks and assets
router.get(
  '/crypto/networks',
  ...cryptoMiddleware.publicRead.map(asRequestHandler),
  CryptoController.getSupportedNetworks
);

router.get(
  '/crypto/assets',
  ...cryptoMiddleware.publicRead.map(asRequestHandler),
  CryptoController.getSupportedAssets
);

// Crypto withdrawals
router.post(
  '/crypto/withdrawals',
  ...cryptoMiddleware.write.map(asRequestHandler),
  CryptoController.createCryptoWithdrawal
);

router.get(
  '/crypto/withdrawals/:id',
  ...cryptoMiddleware.read.map(asRequestHandler),
  CryptoController.getCryptoWithdrawalStatus
);

router.post(
  '/crypto/withdrawals/:id/cancel',
  ...cryptoMiddleware.write.map(asRequestHandler),
  CryptoController.cancelCryptoWithdrawal
);

router.get(
  '/crypto/withdrawals',
  ...cryptoMiddleware.read.map(asRequestHandler),
  CryptoController.getCryptoWithdrawalHistory
);

router.post(
  '/crypto/withdrawals/estimate-fee',
  ...cryptoMiddleware.read.map(asRequestHandler),
  CryptoController.estimateCryptoFee
);

// ============================================================================
// BENEFICIARIES ROUTES
// ============================================================================

router.post(
  '/beneficiaries',
  ...beneficiariesMiddleware.write.map(asRequestHandler),
  BeneficiariesController.createBeneficiary
);

router.get(
  '/beneficiaries',
  ...beneficiariesMiddleware.read.map(asRequestHandler),
  BeneficiariesController.getBeneficiaries
);

router.get(
  '/beneficiaries/:id',
  ...beneficiariesMiddleware.read.map(asRequestHandler),
  BeneficiariesController.getBeneficiary
);

router.put(
  '/beneficiaries/:id',
  ...beneficiariesMiddleware.write.map(asRequestHandler),
  BeneficiariesController.updateBeneficiary
);

router.delete(
  '/beneficiaries/:id',
  ...beneficiariesMiddleware.write.map(asRequestHandler),
  BeneficiariesController.deleteBeneficiary
);

// ============================================================================
// QR ROUTES
// ============================================================================

// QR token creation
router.post(
  '/qr/pay',
  ...qrMiddleware.write.map(asRequestHandler),
  QRController.createPayToken
);

router.post(
  '/qr/receive',
  ...qrMiddleware.write.map(asRequestHandler),
  QRController.createReceiveToken
);

// QR token access (public)
router.get(
  '/qr/:token',
  ...qrMiddleware.publicRead.map(asRequestHandler),
  QRController.getQRToken
);

// QR token management
router.post(
  '/qr/:token/use',
  ...qrMiddleware.write.map(asRequestHandler),
  QRController.useQRToken
);

router.post(
  '/qr/:token/cancel',
  ...qrMiddleware.write.map(asRequestHandler),
  QRController.cancelQRToken
);

router.get(
  '/qr/history',
  ...qrMiddleware.read.map(asRequestHandler),
  QRController.getQRHistory
);

router.get(
  '/qr/stats',
  ...qrMiddleware.read.map(asRequestHandler),
  QRController.getQRStats
);

// ============================================================================
// PAYMENT REQUESTS ROUTES
// ============================================================================

// Payment request management
router.post(
  '/payment-requests',
  ...paymentRequestsMiddleware.write.map(asRequestHandler),
  PaymentRequestsController.createPaymentRequest
);

router.get(
  '/payment-requests',
  ...paymentRequestsMiddleware.read.map(asRequestHandler),
  PaymentRequestsController.getPaymentRequests
);

router.get(
  '/payment-requests/:id',
  ...paymentRequestsMiddleware.read.map(asRequestHandler),
  PaymentRequestsController.getPaymentRequest
);

router.post(
  '/payment-requests/:id/cancel',
  ...paymentRequestsMiddleware.write.map(asRequestHandler),
  PaymentRequestsController.cancelPaymentRequest
);

router.post(
  '/payment-requests/:id/pay',
  ...paymentRequestsMiddleware.write.map(asRequestHandler),
  PaymentRequestsController.payPaymentRequest
);

// Public payment request access
router.get(
  '/payment-requests/link/:token',
  ...paymentRequestsMiddleware.publicRead.map(asRequestHandler),
  PaymentRequestsController.getPaymentRequestByToken
);

router.get(
  '/payment-requests/stats',
  ...paymentRequestsMiddleware.read.map(asRequestHandler),
  PaymentRequestsController.getPaymentRequestStats
);

// ============================================================================
// RECURRING ROUTES
// ============================================================================

// Recurring rules management
router.post(
  '/recurring/rules',
  ...recurringMiddleware.write.map(asRequestHandler),
  RecurringController.createRecurringRule
);

router.get(
  '/recurring/rules',
  ...recurringMiddleware.read.map(asRequestHandler),
  RecurringController.getRecurringRules
);

router.get(
  '/recurring/rules/:id',
  ...recurringMiddleware.read.map(asRequestHandler),
  RecurringController.getRecurringRule
);

router.put(
  '/recurring/rules/:id',
  ...recurringMiddleware.write.map(asRequestHandler),
  RecurringController.updateRecurringRule
);

router.post(
  '/recurring/rules/:id/duplicate',
  ...recurringMiddleware.write.map(asRequestHandler),
  RecurringController.duplicateRecurringRule
);

router.delete(
  '/recurring/rules/:id',
  ...recurringMiddleware.write.map(asRequestHandler),
  RecurringController.deleteRecurringRule
);

router.post(
  '/recurring/rules/:id/toggle',
  ...recurringMiddleware.write.map(asRequestHandler),
  RecurringController.toggleRecurringRule
);

router.get(
  '/recurring/rules/:id/history',
  ...recurringMiddleware.read.map(asRequestHandler),
  RecurringController.getRecurringRuleHistory
);

router.get(
  '/recurring/rules/stats',
  ...recurringMiddleware.read.map(asRequestHandler),
  RecurringController.getRecurringRulesStats
);

// ============================================================================
// CARD FUNDING ROUTES
// ============================================================================

// Card funding preferences
router.get(
  '/cards/funding',
  ...cardFundingMiddleware.read.map(asRequestHandler),
  CardFundingController.getAllCardFundingPreferences
);

router.get(
  '/cards/funding/assets',
  ...cardFundingMiddleware.read.map(asRequestHandler),
  CardFundingController.getAvailableAssets
);

router.get(
  '/cards/:cardRef/funding',
  ...cardFundingMiddleware.read.map(asRequestHandler),
  CardFundingController.getCardFundingPreferences
);

router.put(
  '/cards/:cardRef/funding/eligibility',
  ...cardFundingMiddleware.write.map(asRequestHandler),
  CardFundingController.setEligibleAssets
);

router.put(
  '/cards/:cardRef/funding/selected',
  ...cardFundingMiddleware.write.map(asRequestHandler),
  CardFundingController.setSelectedAsset
);

router.delete(
  '/cards/:cardRef/funding/selected',
  ...cardFundingMiddleware.write.map(asRequestHandler),
  CardFundingController.clearSelectedAsset
);

router.get(
  '/cards/:cardRef/funding/stats',
  ...cardFundingMiddleware.read.map(asRequestHandler),
  CardFundingController.getCardFundingStats
);

// ============================================================================
// DCA ROUTES
// ============================================================================

// DCA plans management
router.post(
  '/dca/plans',
  ...dcaMiddleware.write.map(asRequestHandler),
  DCAController.createDCAPlan
);

router.get(
  '/dca/plans',
  ...dcaMiddleware.read.map(asRequestHandler),
  DCAController.getDCAPlans
);

router.get(
  '/dca/plans/:id',
  ...dcaMiddleware.read.map(asRequestHandler),
  DCAController.getDCAPlan
);

router.put(
  '/dca/plans/:id',
  ...dcaMiddleware.write.map(asRequestHandler),
  DCAController.updateDCAPlan
);

router.post(
  '/dca/plans/:id/pause',
  ...dcaMiddleware.write.map(asRequestHandler),
  DCAController.pauseDCAPlan
);

router.post(
  '/dca/plans/:id/resume',
  ...dcaMiddleware.write.map(asRequestHandler),
  DCAController.resumeDCAPlan
);

router.delete(
  '/dca/plans/:id',
  ...dcaMiddleware.write.map(asRequestHandler),
  DCAController.deleteDCAPlan
);

router.get(
  '/dca/plans/:id/history',
  ...dcaMiddleware.read.map(asRequestHandler),
  DCAController.getDCAPlanHistory
);

// DCA backtesting
router.post(
  '/dca/backtest',
  ...dcaMiddleware.write.map(asRequestHandler),
  DCAController.runDCABacktest
);

// DCA assets and stats
router.get(
  '/dca/assets',
  ...dcaMiddleware.read.map(asRequestHandler),
  DCAController.getAvailableAssets
);

router.get(
  '/dca/stats',
  ...dcaMiddleware.read.map(asRequestHandler),
  DCAController.getDCAStats
);

export default router;
