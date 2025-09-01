import { z } from 'zod';

/**
 * Money Movement Data Models
 * Models for internal transfers, crypto withdrawals, bank transfers, etc.
 */

// Beneficiary model
export interface Beneficiary {
  id: string;
  userId: string;
  type: 'internal_user' | 'bank_swift' | 'email_link';
  displayName: string;
  details: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Request model
export interface PaymentRequest {
  id: string;
  userId: string;
  mode: 'internal_user' | 'external_link';
  target: Record<string, any>;
  asset: string;
  amount: string;
  memoOptional: boolean;
  allowPartial: boolean;
  expiresAt?: Date;
  status: 'draft' | 'active' | 'expired' | 'paid' | 'cancelled';
  linkToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Internal Transfer model
export interface InternalTransfer {
  id: string;
  fromUserId: string;
  toInternalAccountNumber: string;
  asset: string;
  amount: string;
  memo?: string;
  status: 'pending' | 'completed' | 'rejected';
  audit?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Crypto Withdrawal model
export interface CryptoWithdrawal {
  id: string;
  userId: string;
  asset: string;
  network: string;
  address: string;
  amount: string;
  feeEstimate: string;
  status: 'pending' | 'queued' | 'broadcast' | 'failed' | 'cancelled';
  audit?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Bank Transfer model
export interface BankTransfer {
  id: string;
  userId: string;
  beneficiaryId: string;
  amount: string;
  currency: string;
  purposeCode?: string;
  status: 'draft' | 'pending' | 'submitted' | 'failed' | 'cancelled';
  rails: 'swift' | 'wise';
  audit?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Bill Pay Payee model
export interface BillPayPayee {
  id: string;
  userId: string;
  name: string;
  reference?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bill Pay Bill model
export interface BillPayBill {
  id: string;
  userId: string;
  payeeId: string;
  amount: string;
  currency: string;
  scheduledAt: Date;
  frequency?: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Recurring Rule model
export interface RecurringRule {
  id: string;
  userId: string;
  kind: 'internal' | 'payment_link' | 'bank_swift';
  sourceAccountId: string;
  destinationRef: Record<string, any>;
  assetOrCurrency: string;
  amount: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom_cron';
  startAt: Date;
  endAt?: Date;
  onFailure: 'skip' | 'retry';
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// QR Token model
export interface QRToken {
  id: string;
  userId: string;
  direction: 'pay' | 'receive';
  payload: Record<string, any>;
  expiresAt: Date;
  status: 'active' | 'expired' | 'used';
  createdAt: Date;
}

// Card Funding Preference model
export interface CardFundingPreference {
  id: string;
  userId: string;
  cardRef: string;
  eligibleAssets: string[];
  selectedAsset?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DCA Plan model
export interface DCAPlan {
  id: string;
  userId: string;
  asset: string;
  contributionAmount: string;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  timeOfDay?: string;
  startDate: Date;
  endCondition: 'never' | 'until_date' | 'occurrences';
  endValue?: Record<string, any>;
  sourceAccountId: string;
  status: 'active' | 'paused' | 'ended';
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DCA Backtest model
export interface DCABacktest {
  id: string;
  userId: string;
  params: Record<string, any>;
  results: Record<string, any>;
  createdAt: Date;
}

// Audit Log model
export interface MoneyMovementAudit {
  id: string;
  userId: string;
  operation: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Outbox Event model
export interface OutboxEvent {
  id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, any>;
  delivered: boolean;
  createdAt: Date;
  deliveredAt?: Date;
}

// Idempotency Key model
export interface IdempotencyKey {
  id: string;
  userId: string;
  idempotencyKey: string;
  route: string;
  requestHash: string;
  response: Record<string, any>;
  createdAt: Date;
}

// Validation schemas
export const beneficiarySchema = z.object({
  type: z.enum(['internal_user', 'bank_swift', 'email_link']),
  displayName: z.string().min(1).max(200),
  details: z.record(z.any()),
});

export const internalTransferSchema = z.object({
  toAccountNumber: z.string().min(1).max(50),
  optionalIdentifier: z.string().optional(),
  asset: z.string().min(1).max(10),
  amount: z.string().regex(/^\d+\.?\d*$/),
  memo: z.string().optional(),
});

export const cryptoWithdrawalSchema = z.object({
  asset: z.string().min(1).max(10),
  network: z.string().min(1).max(50),
  address: z.string().min(1).max(255),
  amount: z.string().regex(/^\d+\.?\d*$/),
});

export const bankTransferSchema = z.object({
  beneficiaryId: z.string().uuid(),
  amount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string().length(3),
  purposeCode: z.string().optional(),
  rails: z.enum(['swift', 'wise']),
});

export const paymentRequestSchema = z.object({
  mode: z.enum(['internal_user', 'external_link']),
  target: z.record(z.any()),
  asset: z.string().min(1).max(10),
  amount: z.string().regex(/^\d+\.?\d*$/),
  memoOptional: z.boolean().default(false),
  allowPartial: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const qrTokenSchema = z.object({
  asset: z.string().min(1).max(10),
  amount: z
    .string()
    .regex(/^\d+\.?\d*$/)
    .optional(),
  memo: z.string().optional(),
});

export const recurringRuleSchema = z.object({
  kind: z.enum(['internal', 'payment_link', 'bank_swift']),
  sourceAccountId: z.string().uuid(),
  destinationRef: z.record(z.any()),
  assetOrCurrency: z.string().min(1).max(10),
  amount: z.string().regex(/^\d+\.?\d*$/),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom_cron']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  onFailure: z.enum(['skip', 'retry']).default('skip'),
});

export const dcaPlanSchema = z.object({
  asset: z.string().min(1).max(10),
  contributionAmount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string().length(3),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  timeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endCondition: z.enum(['never', 'until_date', 'occurrences']).default('never'),
  endValue: z.record(z.any()).optional(),
  sourceAccountId: z.string().uuid(),
});

export const dcaBacktestSchema = z.object({
  asset: z.string().min(1).max(10),
  contribution: z.string().regex(/^\d+\.?\d*$/),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Database table creation SQL
export const MONEY_MOVEMENT_TABLES_SQL = `
-- This SQL is already included in the migration file
-- See src/db/migrations/005_money_movement.sql
`;

// Utility functions
export class MoneyMovementUtils {
  static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }

  static maskAddress(address: string): string {
    if (address.length <= 8) return address;
    return address.slice(0, 6) + '...' + address.slice(-6);
  }

  static hashForCorrelation(data: string): string {
    // Simple hash for correlation - in production, use proper crypto hash
    return Buffer.from(data).toString('base64').slice(0, 16);
  }

  static validateAmount(amount: string, asset: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }

  static validateAddressFormat(address: string, network: string): boolean {
    // Basic validation - in production, use proper network-specific validation
    if (network === 'ethereum') {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    if (network === 'bitcoin') {
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(
        address
      );
    }
    return address.length > 0;
  }

  static generateLinkToken(): string {
    return Math.random().toString(36).substr(2, 15);
  }

  static calculateNextRunAt(frequency: string, lastRunAt: Date): Date {
    const next = new Date(lastRunAt);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }
}
