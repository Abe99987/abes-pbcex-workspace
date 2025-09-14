import { z } from 'zod';

/**
 * DCA Rule Entity
 * Represents a Dollar Cost Averaging rule configuration
 */

export const DCA_CADENCE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export const DCA_ACCOUNT_SOURCE = {
  FUNDING: 'funding',
  TRADING: 'trading',
} as const;

export type DCACadence = (typeof DCA_CADENCE)[keyof typeof DCA_CADENCE];
export type DCAAccountSource =
  (typeof DCA_ACCOUNT_SOURCE)[keyof typeof DCA_ACCOUNT_SOURCE];

export interface DCARule {
  id: string;
  userId: string;
  baseSymbol: string;
  quoteSymbol: string;
  cadence: DCACadence;
  amountMinor: bigint; // Amount in minor units (e.g., cents for USD)
  currencySymbol: string;
  executionTimeUtc: string; // Time in HH:MM format
  startDate: Date;
  endDate?: Date;
  monthlyDay?: number; // Day of month (1-28) for monthly cadence
  fromAccount: DCAAccountSource;
  active: boolean;
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDCARuleInput {
  baseSymbol: string;
  quoteSymbol: string;
  cadence: DCACadence;
  amountMinor: bigint;
  currencySymbol: string;
  executionTimeUtc: string;
  startDate: Date;
  endDate?: Date;
  monthlyDay?: number; // Required when cadence=monthly, defaults to 1
  fromAccount: DCAAccountSource;
}

export interface UpdateDCARuleInput {
  baseSymbol?: string;
  quoteSymbol?: string;
  cadence?: DCACadence;
  amountMinor?: bigint;
  currencySymbol?: string;
  executionTimeUtc?: string;
  startDate?: Date;
  endDate?: Date;
  monthlyDay?: number;
  fromAccount?: DCAAccountSource;
  active?: boolean;
}

// Validation schemas
export const dcaRuleSchema = z.object({
  baseSymbol: z.string().min(1).max(10),
  quoteSymbol: z.string().min(1).max(10),
  cadence: z.enum(['daily', 'weekly', 'monthly']),
  amountMinor: z.bigint().positive(),
  currencySymbol: z.string().min(1).max(10),
  executionTimeUtc: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  startDate: z.date(),
  endDate: z.date().optional(),
  fromAccount: z.enum(['funding', 'trading']),
});

export const createDCARuleSchema = dcaRuleSchema.omit({
  // Remove fields that are auto-generated
});

export const updateDCARuleSchema = dcaRuleSchema.partial();

// Frontend compatibility interface (matches spending store)
export interface DCARuleForFrontend {
  id: string;
  status: 'active' | 'paused' | 'ended';
  nextRunAt: Date;
  schedule: {
    cadence: DCACadence;
    executionTimeUtc: string;
    startDate: Date;
    endDate?: Date;
  };
  asset: {
    baseSymbol: string;
    quoteSymbol: string;
  };
  amount: {
    value: string; // Human-readable amount
    currency: string;
  };
  sourceAccount: DCAAccountSource;
}
