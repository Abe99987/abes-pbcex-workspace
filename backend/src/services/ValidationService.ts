import { CommodityConfigService } from './CommodityConfigService';
import { logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import {
  getAssetConfig,
  getNetworkConfig,
  getBankRailsConfig,
} from '@/config/money-movement';
import { MoneyMovementUtils } from '@/models/MoneyMovement';

/**
 * Centralized Validation Service
 * Handles validation for min/step/format checks across all order flows
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface OrderValidationRequest {
  symbol: string;
  amount: number;
  format?: string;
  side: 'buy' | 'sell';
  userId?: string;
  paymentMethod?: string;
  licenseVerified?: boolean;
}

export interface BalanceValidationRequest {
  userId: string;
  asset: string;
  amount: number;
}

export class ValidationService {
  /**
   * Validate order request
   */
  static async validateOrder(
    request: OrderValidationRequest
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic parameter validation
      if (!request.symbol) {
        errors.push('Symbol is required');
      }

      if (!request.amount || request.amount <= 0) {
        errors.push('Amount must be positive');
      }

      if (!['buy', 'sell'].includes(request.side)) {
        errors.push('Side must be "buy" or "sell"');
      }

      // Early return if basic validation fails
      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }

      // Get commodity configuration
      const config = await CommodityConfigService.getConfig(request.symbol);
      if (!config) {
        errors.push(`Unknown commodity: ${request.symbol}`);
        return { valid: false, errors, warnings };
      }

      if (!config.enabled) {
        errors.push(`Commodity ${request.symbol} is currently unavailable`);
        return { valid: false, errors, warnings };
      }

      // Validate format if specified
      if (request.format) {
        const isValidFormat = await CommodityConfigService.isValidFormat(
          request.symbol,
          request.format
        );
        if (!isValidFormat) {
          errors.push(
            `Format "${request.format}" is not available for ${config.displayName}`
          );
          return { valid: false, errors, warnings };
        }
      }

      // Validate amount against minimum and step size
      const amountValidation = await CommodityConfigService.validateAmount(
        request.symbol,
        request.amount,
        request.format
      );

      if (!amountValidation.valid && amountValidation.error) {
        errors.push(amountValidation.error);
      }

      // Check license requirements
      const requiresLicense = await CommodityConfigService.requiresLicense(
        request.symbol,
        request.format
      );

      if (requiresLicense && !request.licenseVerified) {
        errors.push(
          `${config.displayName} requires special licensing. Please contact support to verify your license.`
        );
      }

      // Side-specific validations
      if (request.side === 'buy') {
        // Validate payment method for buy orders
        const validPaymentMethods = ['BALANCE', 'STRIPE_CARD'];
        if (
          request.paymentMethod &&
          !validPaymentMethods.includes(request.paymentMethod)
        ) {
          errors.push('Invalid payment method');
        }
      }

      // Add warnings for large orders
      const minOrder = await CommodityConfigService.getMinimumOrder(
        request.symbol,
        request.format
      );
      if (minOrder && request.amount > minOrder * 100) {
        warnings.push(
          `Large order detected. Orders over ${minOrder * 100} ${config.unitLabel} may require additional processing time.`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logError('Order validation failed', error as Error);
      return {
        valid: false,
        errors: ['Validation service temporarily unavailable'],
      };
    }
  }

  /**
   * Validate user balance for transaction
   */
  static async validateBalance(
    request: BalanceValidationRequest
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // This is a placeholder for balance validation
      // In a real implementation, this would query the user's actual balances

      if (!request.userId) {
        errors.push('User ID is required');
      }

      if (!request.asset) {
        errors.push('Asset is required');
      }

      if (!request.amount || request.amount <= 0) {
        errors.push('Amount must be positive');
      }

      // TODO: Implement actual balance checking
      // const userBalance = await BalanceService.getBalance(request.userId, request.asset);
      // if (userBalance < request.amount) {
      //   errors.push(`Insufficient ${request.asset} balance`);
      // }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logError('Balance validation failed', error as Error);
      return {
        valid: false,
        errors: ['Balance validation temporarily unavailable'],
      };
    }
  }

  /**
   * Validate idempotency key format
   */
  static validateIdempotencyKey(key: string): ValidationResult {
    const errors: string[] = [];

    if (!key) {
      errors.push('Idempotency key is required');
      return { valid: false, errors };
    }

    // Must be at least 16 characters
    if (key.length < 16) {
      errors.push('Idempotency key must be at least 16 characters');
    }

    // Must be alphanumeric with hyphens/underscores allowed
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      errors.push(
        'Idempotency key must contain only alphanumeric characters, hyphens, and underscores'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate client ID format
   */
  static validateClientId(clientId: string): ValidationResult {
    const errors: string[] = [];

    if (!clientId) {
      errors.push('Client ID is required');
      return { valid: false, errors };
    }

    // Should be a valid UUID or similar identifier
    if (!/^[a-zA-Z0-9_-]{8,}$/.test(clientId)) {
      errors.push('Invalid client ID format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate payout method for sell/convert orders
   */
  static validatePayoutMethod(payout: string): ValidationResult {
    const errors: string[] = [];
    const validMethods = ['USD', 'USDC', 'USDT', 'TOKEN'];

    if (!payout) {
      errors.push('Payout method is required');
      return { valid: false, errors };
    }

    if (!validMethods.includes(payout)) {
      errors.push(
        `Invalid payout method. Must be one of: ${validMethods.join(', ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(
    ...results: ValidationResult[]
  ): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const result of results) {
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    };
  }

  /**
   * Throw validation error if validation fails
   */
  static throwIfInvalid(validation: ValidationResult, context?: string): void {
    if (!validation.valid) {
      const firstError = validation.errors[0] || 'Validation failed';
      const message = context ? `${context}: ${firstError}` : firstError;
      throw createError.validation(message);
    }
  }

  // ===== MONEY MOVEMENT VALIDATION METHODS =====

  /**
   * Validate internal transfer request
   */
  static validateInternalTransfer(
    toAccountNumber: string,
    asset: string,
    amount: string,
    memo?: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate account number
      if (!toAccountNumber || toAccountNumber.trim().length === 0) {
        errors.push('Recipient account number is required');
      } else if (toAccountNumber.length > 50) {
        errors.push('Account number is too long');
      }

      // Validate asset
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        errors.push('Asset not supported');
      } else if (!assetConfig.enabled) {
        errors.push('Asset is currently disabled');
      }

      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        errors.push('Amount must be positive');
      } else if (assetConfig) {
        const amountNum = parseFloat(amount);
        if (amountNum < assetConfig.minTransfer) {
          errors.push(
            `Minimum transfer amount is ${assetConfig.minTransfer} ${asset}`
          );
        }

        // Check step size
        const stepSize = assetConfig.stepSize;
        if (stepSize > 0) {
          const remainder = amountNum % stepSize;
          if (remainder > 0.00000001) {
            errors.push(`Amount must be a multiple of ${stepSize} ${asset}`);
          }
        }
      }

      // Validate memo
      if (memo && memo.length > 500) {
        errors.push('Memo is too long (maximum 500 characters)');
      }

      // Add warnings for KYC requirements
      if (assetConfig?.requiresKyc) {
        warnings.push(`${asset} transfers require KYC verification`);
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('Internal transfer validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate crypto withdrawal request
   */
  static validateCryptoWithdrawal(
    asset: string,
    network: string,
    address: string,
    amount: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate asset
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        errors.push('Asset not supported');
        return { valid: false, errors, warnings };
      }

      if (!assetConfig.enabled) {
        errors.push('Asset is currently disabled');
        return { valid: false, errors, warnings };
      }

      // Validate network
      const networkConfig = getNetworkConfig(asset, network);
      if (!networkConfig) {
        errors.push(`Network "${network}" is not supported for ${asset}`);
        return { valid: false, errors, warnings };
      }

      if (!networkConfig.enabled) {
        errors.push(`Network "${network}" is currently disabled`);
        return { valid: false, errors, warnings };
      }

      // Validate address format
      if (!address || address.trim().length === 0) {
        errors.push('Address is required');
      } else if (!MoneyMovementUtils.validateAddressFormat(address, network)) {
        errors.push(`Invalid ${network} address format`);
      }

      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        errors.push('Amount must be positive');
      } else {
        const amountNum = parseFloat(amount);
        if (amountNum < networkConfig.minWithdrawal) {
          errors.push(
            `Minimum withdrawal amount is ${networkConfig.minWithdrawal} ${asset}`
          );
        }
        if (amountNum > networkConfig.maxWithdrawal) {
          errors.push(
            `Maximum withdrawal amount is ${networkConfig.maxWithdrawal} ${asset}`
          );
        }
      }

      // Add warnings for KYC requirements
      if (assetConfig.requiresKyc) {
        warnings.push(`${asset} withdrawals require KYC verification`);
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('Crypto withdrawal validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate bank transfer request
   */
  static validateBankTransfer(
    beneficiaryId: string,
    amount: string,
    currency: string,
    rails: 'swift' | 'wise'
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate beneficiary ID
      if (
        !beneficiaryId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          beneficiaryId
        )
      ) {
        errors.push('Invalid beneficiary ID');
      }

      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        errors.push('Amount must be positive');
      }

      // Validate currency
      if (!currency || currency.length !== 3) {
        errors.push('Currency must be a 3-letter code');
      }

      // Validate rails
      const railsConfig = getBankRailsConfig(rails);
      if (!railsConfig) {
        errors.push(`Bank rails "${rails}" not supported`);
        return { valid: false, errors, warnings };
      }

      if (!railsConfig.enabled) {
        errors.push(`Bank rails "${rails}" is currently disabled`);
        return { valid: false, errors, warnings };
      }

      // Validate currency is supported by rails
      if (!railsConfig.supportedCurrencies.includes(currency.toUpperCase())) {
        errors.push(
          `Currency "${currency}" is not supported for ${rails} transfers`
        );
      }

      // Validate amount limits
      if (amount) {
        const amountNum = parseFloat(amount);
        if (amountNum < railsConfig.minAmount) {
          errors.push(
            `Minimum amount for ${rails} transfers is ${railsConfig.minAmount} ${currency}`
          );
        }
        if (amountNum > railsConfig.maxAmount) {
          errors.push(
            `Maximum amount for ${rails} transfers is ${railsConfig.maxAmount} ${currency}`
          );
        }
      }

      // Add warnings for KYC requirements
      warnings.push(
        `${rails.toUpperCase()} transfers require ${railsConfig.kycTierRequired} KYC verification`
      );

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('Bank transfer validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate payment request
   */
  static validatePaymentRequest(
    mode: 'internal_user' | 'external_link',
    target: Record<string, any>,
    asset: string,
    amount: string,
    memoOptional: boolean,
    allowPartial: boolean
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate mode
      if (!['internal_user', 'external_link'].includes(mode)) {
        errors.push('Invalid payment request mode');
      }

      // Validate target based on mode
      if (mode === 'internal_user') {
        if (!target.accountNumber) {
          errors.push(
            'Account number is required for internal payment requests'
          );
        }
        if (!target.displayName) {
          errors.push('Display name is required for internal payment requests');
        }
      } else if (mode === 'external_link') {
        if (!target.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.email)) {
          errors.push('Valid email is required for external payment requests');
        }
      }

      // Validate asset
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        errors.push('Asset not supported');
      } else if (!assetConfig.enabled) {
        errors.push('Asset is currently disabled');
      }

      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        errors.push('Amount must be positive');
      } else if (assetConfig) {
        const amountNum = parseFloat(amount);
        if (amountNum < assetConfig.minTransfer) {
          errors.push(`Minimum amount is ${assetConfig.minTransfer} ${asset}`);
        }
      }

      // Validate boolean flags
      if (typeof memoOptional !== 'boolean') {
        errors.push('Memo optional flag must be boolean');
      }
      if (typeof allowPartial !== 'boolean') {
        errors.push('Allow partial flag must be boolean');
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('Payment request validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate QR token request
   */
  static validateQRToken(
    asset: string,
    amount?: string,
    memo?: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate asset
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        errors.push('Asset not supported');
      } else if (!assetConfig.enabled) {
        errors.push('Asset is currently disabled');
      }

      // Validate amount if provided
      if (amount !== undefined) {
        if (parseFloat(amount) <= 0) {
          errors.push('Amount must be positive');
        } else if (assetConfig) {
          const amountNum = parseFloat(amount);
          if (amountNum < assetConfig.minTransfer) {
            errors.push(
              `Minimum amount is ${assetConfig.minTransfer} ${asset}`
            );
          }
        }
      }

      // Validate memo
      if (memo && memo.length > 200) {
        errors.push('Memo is too long (maximum 200 characters)');
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('QR token validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate recurring rule
   */
  static validateRecurringRule(
    kind: 'internal' | 'payment_link' | 'bank_swift',
    sourceAccountId: string,
    destinationRef: Record<string, any>,
    assetOrCurrency: string,
    amount: string,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom_cron',
    startAt: Date,
    endAt?: Date
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate kind
      if (!['internal', 'payment_link', 'bank_swift'].includes(kind)) {
        errors.push('Invalid recurring rule kind');
      }

      // Validate source account
      if (
        !sourceAccountId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          sourceAccountId
        )
      ) {
        errors.push('Invalid source account ID');
      }

      // Validate destination reference
      if (!destinationRef || typeof destinationRef !== 'object') {
        errors.push('Destination reference is required');
      }

      // Validate asset/currency
      const assetConfig = getAssetConfig(assetOrCurrency);
      if (!assetConfig) {
        errors.push('Asset/currency not supported');
      }

      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        errors.push('Amount must be positive');
      }

      // Validate frequency
      if (
        !['daily', 'weekly', 'biweekly', 'monthly', 'custom_cron'].includes(
          frequency
        )
      ) {
        errors.push('Invalid frequency');
      }

      // Validate start date
      if (!startAt || startAt < new Date()) {
        errors.push('Start date must be in the future');
      }

      // Validate end date if provided
      if (endAt && endAt <= startAt) {
        errors.push('End date must be after start date');
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('Recurring rule validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate DCA plan
   */
  static validateDCAPlan(
    asset: string,
    contributionAmount: string,
    currency: string,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
    startDate: Date,
    sourceAccountId: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate asset
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        errors.push('Asset not supported');
      } else if (!assetConfig.enabled) {
        errors.push('Asset is currently disabled');
      }

      // Validate contribution amount
      if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
        errors.push('Contribution amount must be positive');
      }

      // Validate currency
      if (!currency || currency.length !== 3) {
        errors.push('Currency must be a 3-letter code');
      }

      // Validate frequency
      if (!['daily', 'weekly', 'biweekly', 'monthly'].includes(frequency)) {
        errors.push('Invalid frequency');
      }

      // Validate start date
      if (!startDate || startDate < new Date()) {
        errors.push('Start date must be in the future');
      }

      // Validate source account
      if (
        !sourceAccountId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          sourceAccountId
        )
      ) {
        errors.push('Invalid source account ID');
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      logError('DCA plan validation failed', error as Error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }
}
