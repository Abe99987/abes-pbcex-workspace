import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {
  ASSETS,
  ACCOUNT_TYPES,
  USER_ROLES,
  KYC_TYPES,
  VALIDATION,
} from './constants';

/**
 * Common validation schemas for PBCEx
 */

// Basic primitive validations
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(VALIDATION.EMAIL.MAX_LENGTH, 'Email too long');

export const phoneSchema = z
  .string()
  .min(VALIDATION.PHONE.MIN_LENGTH, 'Phone number too short')
  .max(VALIDATION.PHONE.MAX_LENGTH, 'Phone number too long')
  .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format');

export const passwordSchema = z
  .string()
  .min(VALIDATION.PASSWORD.MIN_LENGTH, 'Password too short')
  .max(VALIDATION.PASSWORD.MAX_LENGTH, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/\d/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const ssnSchema = z
  .string()
  .regex(
    VALIDATION.SSN.PATTERN,
    'Invalid SSN format (use XXX-XX-XXXX or XXXXXXXXX)'
  );

export const einSchema = z
  .string()
  .regex(VALIDATION.EIN.PATTERN, 'Invalid EIN format (use XX-XXXXXXX)');

// Asset and account validations
export const assetSchema = z.enum([
  'PAXG',
  'USD',
  'USDC',
  'XAU-s',
  'XAG-s',
  'XPT-s',
  'XPD-s',
  'XCU-s',
]);
export const realAssetSchema = z.enum(['PAXG', 'USD', 'USDC']);
export const syntheticAssetSchema = z.enum([
  'XAU-s',
  'XAG-s',
  'XPT-s',
  'XPD-s',
  'XCU-s',
]);
export const accountTypeSchema = z.enum([
  ACCOUNT_TYPES.FUNDING,
  ACCOUNT_TYPES.TRADING,
]);
export const userRoleSchema = z.enum([
  USER_ROLES.USER,
  USER_ROLES.ADMIN,
  USER_ROLES.SUPPORT,
  USER_ROLES.TELLER,
]);
export const kycTypeSchema = z.enum([KYC_TYPES.PERSONAL, KYC_TYPES.BUSINESS]);

// Amount validations
export const positiveAmountSchema = z
  .number()
  .positive('Amount must be positive');
export const tradeAmountSchema = z
  .number()
  .min(0.000001, 'Trade amount too small')
  .max(1000000, 'Trade amount too large');

// Address validation schema
export const addressSchema = z.object({
  line1: z
    .string()
    .min(1, 'Address line 1 required')
    .max(100, 'Address line 1 too long'),
  line2: z.string().max(100, 'Address line 2 too long').optional(),
  city: z.string().min(1, 'City required').max(50, 'City name too long'),
  state: z.string().min(2, 'State required').max(50, 'State name too long'),
  postalCode: z
    .string()
    .min(5, 'Postal code required')
    .max(10, 'Postal code too long'),
  country: z.string().length(2, 'Country must be 2-letter code').default('US'),
});

// Personal information schema
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name required')
    .max(50, 'First name too long'),
  lastName: z
    .string()
    .min(1, 'Last name required')
    .max(50, 'Last name too long'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  ssn: ssnSchema,
  nationality: z
    .string()
    .length(2, 'Nationality must be 2-letter country code'),
  phone: phoneSchema,
  email: emailSchema,
});

// Business information schema
export const businessInfoSchema = z.object({
  legalName: z
    .string()
    .min(1, 'Legal name required')
    .max(200, 'Legal name too long'),
  dba: z.string().max(200, 'DBA too long').optional(),
  entityType: z.enum(['LLC', 'CORP', 'INC', 'LP', 'LLP', 'OTHER']),
  ein: einSchema,
  incorporationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  jurisdiction: z.string().length(2, 'Jurisdiction must be 2-letter code'),
  naicsCode: z
    .string()
    .regex(/^\d{6}$/, 'NAICS code must be 6 digits')
    .optional(),
  registeredAddress: addressSchema,
  operatingAddress: addressSchema,
});

// UBO (Ultimate Beneficial Owner) schema
export const uboSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  ownershipPercent: z
    .number()
    .min(0)
    .max(100, 'Ownership percent must be 0-100'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  address: addressSchema,
  phone: phoneSchema,
  email: emailSchema,
});

// Control person schema
export const controlPersonSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  title: z.string().min(1, 'Title required').max(50, 'Title too long'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  address: addressSchema,
  phone: phoneSchema,
  email: emailSchema,
});

// Document upload schema
export const documentSchema = z.object({
  type: z.enum([
    'ID_FRONT',
    'ID_BACK',
    'SELFIE',
    'PROOF_OF_ADDRESS',
    'ARTICLES_OF_INCORP',
    'GOOD_STANDING',
    'BYLAWS',
    'BOARD_RESOLUTION',
    'W9',
  ]),
  filename: z.string().min(1, 'Filename required'),
  mimeType: z.string().min(1, 'MIME type required'),
  size: z.number().max(5 * 1024 * 1024, 'File too large (max 5MB)'),
  url: z.string().url('Invalid file URL').optional(),
});

// License information schema
export const licenseSchema = z.object({
  type: z.enum([
    'RESALE',
    'PRECIOUS_METALS_DEALER',
    'IMPORT_EXPORT',
    'BONDED_WAREHOUSE',
  ]),
  licenseNumber: z
    .string()
    .min(1, 'License number required')
    .max(50, 'License number too long'),
  state: z.string().length(2, 'State must be 2-letter code'),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  isActive: z.boolean().default(true),
});

// KYC submission schemas
export const personalKycSchema = z.object({
  personal: personalInfoSchema,
  address: addressSchema,
  documents: z.object({
    idType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'STATE_ID']),
    idFront: documentSchema,
    idBack: documentSchema.optional(),
    selfie: documentSchema,
    proofOfAddress: documentSchema.optional(),
  }),
  consent: z.object({
    tosAccepted: z
      .boolean()
      .refine(val => val === true, 'Terms of service must be accepted'),
    marketingOptIn: z.boolean().default(false),
  }),
});

export const businessKycSchema = z.object({
  company: businessInfoSchema,
  documents: z.object({
    articlesOfIncorporation: documentSchema,
    goodStanding: documentSchema,
    bylawsOrOperatingAgreement: documentSchema,
    boardResolution: documentSchema,
    w9: documentSchema,
  }),
  ownership: z.object({
    controlPerson: controlPersonSchema,
    ubos: z.array(uboSchema).min(1, 'At least one UBO required'),
  }),
  licenses: z.array(licenseSchema).default([]),
  contacts: z.object({
    complianceOfficer: z.object({
      name: z.string().min(1, 'Name required'),
      email: emailSchema,
      phone: phoneSchema,
    }),
    financeContact: z.object({
      name: z.string().min(1, 'Name required'),
      email: emailSchema,
      phone: phoneSchema,
    }),
  }),
  shippingProfile: z.object({
    defaultRecipient: z.string().min(1, 'Default recipient required'),
    phone: phoneSchema,
    residential: z.boolean().default(false),
    deliveryNotes: z.string().max(500, 'Delivery notes too long').optional(),
  }),
  consent: z.object({
    tosAccepted: z
      .boolean()
      .refine(val => val === true, 'Terms of service must be accepted'),
    marketingOptIn: z.boolean().default(false),
  }),
});

// Trading schemas
export const tradeOrderSchema = z
  .object({
    fromAsset: assetSchema,
    toAsset: assetSchema,
    amount: tradeAmountSchema,
    orderType: z.enum(['MARKET']).default('MARKET'), // Only market orders for now
  })
  .refine(data => data.fromAsset !== data.toAsset, {
    message: 'Cannot trade same asset',
  });

// Shop schemas
export const productQuerySchema = z.object({
  metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']).optional(),
  category: z.enum(['COINS', 'BARS', 'ROUNDS', 'JEWELRY']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const lockQuoteSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const checkoutSchema = z.object({
  quoteId: z.string().uuid('Invalid quote ID'),
  paymentMethod: z.enum(['BALANCE', 'STRIPE_CARD']),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  specialInstructions: z
    .string()
    .max(500, 'Special instructions too long')
    .optional(),
});

// Wallet operation schemas
export const transferSchema = z
  .object({
    fromAccount: accountTypeSchema,
    toAccount: accountTypeSchema,
    asset: assetSchema,
    amount: positiveAmountSchema,
  })
  .refine(data => data.fromAccount !== data.toAccount, {
    message: 'Cannot transfer to same account type',
  });

export const depositSchema = z.object({
  asset: realAssetSchema,
  amount: positiveAmountSchema,
  paymentMethod: z.enum(['BANK_TRANSFER', 'CRYPTO', 'WIRE']),
});

export const withdrawalSchema = z.object({
  asset: realAssetSchema,
  amount: positiveAmountSchema,
  destination: z.object({
    type: z.enum(['BANK_ACCOUNT', 'CRYPTO_ADDRESS']),
    details: z.record(z.string()), // Flexible for different destination types
  }),
});

/**
 * Request validation middleware helper
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}
