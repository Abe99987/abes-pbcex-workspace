import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { FedexController } from '@/controllers/FedexController';
import { env } from '@/config/env';
import { z } from 'zod';

const router = Router();

// Rate limiting for shipping endpoints (more restrictive than general API)
const shippingLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs, // 15 minutes
  max: 50, // Allow 50 shipping operations per 15 minutes
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many shipping requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development for testing
  skip: (req) => {
    return env.NODE_ENV === 'development' && req.headers['x-admin-bypass'] === 'true';
  },
});

// More restrictive rate limiting for label generation
const labelLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Allow 10 label creations per 5 minutes
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many label requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const addressSchema = z.object({
  streetLines: z.array(z.string().min(1).max(35)).min(1).max(3),
  city: z.string().min(1).max(35),
  stateOrProvinceCode: z.string().min(2).max(3),
  postalCode: z.string().min(3).max(10),
  countryCode: z.string().length(2),
  residential: z.boolean().optional(),
});

const contactSchema = z.object({
  personName: z.string().min(1).max(70),
  companyName: z.string().min(1).max(35).optional(),
  phoneNumber: z.string().min(10).max(20),
  emailAddress: z.string().email().max(80).optional(),
});

const partySchema = z.object({
  address: addressSchema,
  contact: contactSchema,
});

const weightSchema = z.object({
  value: z.number().min(0.1).max(150),
  units: z.enum(['LB', 'KG']),
});

const dimensionsSchema = z.object({
  length: z.number().min(0.1).max(108),
  width: z.number().min(0.1).max(108),
  height: z.number().min(0.1).max(108),
  units: z.enum(['IN', 'CM']),
});

const declaredValueSchema = z.object({
  amount: z.number().min(0).max(99999),
  currency: z.string().length(3).default('USD'),
});

const packageSchema = z.object({
  weight: weightSchema,
  dimensions: dimensionsSchema.optional(),
  declaredValue: declaredValueSchema.optional(),
  customerReference: z.string().max(30).optional(),
});

const ratesRequestSchema = z.object({
  shipperAddress: addressSchema,
  recipientAddress: addressSchema,
  packages: z.array(packageSchema).min(1).max(99),
  shipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceTypes: z.array(z.enum([
    'FEDEX_GROUND',
    'GROUND_HOME_DELIVERY',
    'FEDEX_EXPRESS_SAVER',
    'FEDEX_2_DAY',
    'FEDEX_2_DAY_AM',
    'STANDARD_OVERNIGHT',
    'PRIORITY_OVERNIGHT',
    'FIRST_OVERNIGHT'
  ])).optional(),
});

const availabilityRequestSchema = z.object({
  shipperAddress: addressSchema,
  recipientAddress: addressSchema,
  packages: z.array(packageSchema.omit({ customerReference: true, declaredValue: true })).min(1).max(99),
  shipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const shipmentRequestSchema = z.object({
  shipper: partySchema,
  recipient: partySchema,
  packages: z.array(packageSchema).min(1).max(99),
  serviceType: z.enum([
    'FEDEX_GROUND',
    'GROUND_HOME_DELIVERY',
    'FEDEX_EXPRESS_SAVER',
    'FEDEX_2_DAY',
    'FEDEX_2_DAY_AM',
    'STANDARD_OVERNIGHT',
    'PRIORITY_OVERNIGHT',
    'FIRST_OVERNIGHT'
  ]),
  packagingType: z.enum([
    'FEDEX_ENVELOPE',
    'FEDEX_BOX',
    'FEDEX_SMALL_BOX',
    'FEDEX_MEDIUM_BOX',
    'FEDEX_LARGE_BOX',
    'FEDEX_EXTRA_LARGE_BOX',
    'YOUR_PACKAGING'
  ]).optional(),
  labelImageType: z.enum(['PDF', 'PNG']).optional(),
  shipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Routes

/**
 * GET /api/fedex/health
 * Get FedEx service health status
 * Public endpoint for monitoring
 */
router.get('/health', FedexController.getHealthStatus);

/**
 * POST /api/fedex/rates
 * Get shipping rates for packages
 * Rate limited and input validated
 */
router.post(
  '/rates',
  shippingLimiter,
  validateBody(ratesRequestSchema),
  FedexController.getRates
);

/**
 * POST /api/fedex/availability
 * Check service availability for route and packages
 * Rate limited and input validated
 */
router.post(
  '/availability',
  shippingLimiter,
  validateBody(availabilityRequestSchema),
  FedexController.getServiceAvailability
);

/**
 * POST /api/fedex/ship/label
 * Create shipment and generate shipping label
 * More restrictive rate limiting due to cost/complexity
 */
router.post(
  '/ship/label',
  labelLimiter,
  validateBody(shipmentRequestSchema),
  FedexController.createShipmentLabel
);

export default router;
