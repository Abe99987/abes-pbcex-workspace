import { z } from 'zod';
import { DCACadence, DCAAccountSource } from '../entities/dca-rule.entity';

/**
 * DCA DTOs for API requests and responses
 */

// Create DCA Rule DTO
export const createDCARuleDto = z.object({
  baseSymbol: z
    .string()
    .min(1, 'Base symbol is required')
    .max(10, 'Base symbol too long')
    .regex(/^[A-Z0-9]+$/, 'Base symbol must be uppercase alphanumeric'),
  quoteSymbol: z
    .string()
    .min(1, 'Quote symbol is required')
    .max(10, 'Quote symbol too long')
    .regex(/^[A-Z0-9]+$/, 'Quote symbol must be uppercase alphanumeric'),
  cadence: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Cadence must be daily, weekly, or monthly' }),
  }),
  amount: z
    .string()
    .regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0, 'Amount must be positive'),
  currencySymbol: z
    .string()
    .min(1, 'Currency symbol is required')
    .max(10, 'Currency symbol too long')
    .regex(/^[A-Z]+$/, 'Currency symbol must be uppercase letters'),
  executionTimeUtc: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Execution time must be in HH:MM format'
    )
    .default('14:00'), // Default 10:00 ET (14:00 UTC)
  startDate: z
    .string()
    .datetime('Start date must be a valid ISO datetime')
    .transform(val => new Date(val)),
  endDate: z
    .string()
    .datetime('End date must be a valid ISO datetime')
    .transform(val => new Date(val))
    .optional(),
  fromAccount: z.enum(['funding', 'trading'], {
    errorMap: () => ({ message: 'From account must be funding or trading' }),
  }),
  monthlyDay: z
    .number()
    .int('Monthly day must be an integer')
    .min(1, 'Monthly day must be between 1 and 28')
    .max(28, 'Monthly day must be between 1 and 28')
    .optional(),
  active: z.boolean().optional(),
});

// Update DCA Rule DTO
export const updateDCARuleDto = createDCARuleDto.partial();

// Backtest DTO
export const backtestDto = z.object({
  baseSymbol: z
    .string()
    .min(1, 'Base symbol is required')
    .max(10, 'Base symbol too long')
    .regex(/^[A-Z0-9]+$/, 'Base symbol must be uppercase alphanumeric'),
  quoteSymbol: z
    .string()
    .min(1, 'Quote symbol is required')
    .max(10, 'Quote symbol too long')
    .regex(/^[A-Z0-9]+$/, 'Quote symbol must be uppercase alphanumeric'),
  amount: z
    .string()
    .regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0, 'Amount must be positive'),
  cadence: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Cadence must be daily, weekly, or monthly' }),
  }),
  startDate: z
    .string()
    .datetime('Start date must be a valid ISO datetime')
    .transform(val => new Date(val)),
  endDate: z
    .string()
    .datetime('End date must be a valid ISO datetime')
    .transform(val => new Date(val)),
  executionTimeUtc: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Execution time must be in HH:MM format'
    ),
});

// Response DTOs
export interface DCARuleResponse {
  id: string;
  baseSymbol: string;
  quoteSymbol: string;
  cadence: DCACadence;
  amount: string;
  currencySymbol: string;
  executionTimeUtc: string;
  startDate: string;
  endDate?: string;
  monthlyDay?: number;
  fromAccount: DCAAccountSource;
  active: boolean;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DCARuleListResponse {
  rules: DCARuleResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface BacktestResponse {
  inputs: {
    baseSymbol: string;
    quoteSymbol: string;
    amount: number;
    cadence: DCACadence;
    startDate: string;
    endDate: string;
    executionTimeUtc: string;
  };
  periods: number;
  fills: Array<{
    date: string;
    price: number;
    units: number;
    cost: number;
    cumUnits: number;
    cumCost: number;
    value: number;
  }>;
  totals: {
    invested: number;
    units: number;
    avgCost: number;
    endValue: number;
    pnlAbs: number;
    pnlPct: number;
  };
  series: Array<{
    date: string;
    price: number;
    units: number;
    cost: number;
    cumUnits: number;
    cumCost: number;
    value: number;
  }>;
}

// Error DTOs
export interface DCAErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Type exports
export type CreateDCARuleRequest = z.infer<typeof createDCARuleDto>;
export type UpdateDCARuleRequest = z.infer<typeof updateDCARuleDto>;
export type BacktestRequest = z.infer<typeof backtestDto>;
