import { RedemptionRequest } from '@/models/RedemptionRequest';
import VaultCustodyService, { AllocationRequest } from '@/services/VaultCustodyService';
import { createError } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { env } from '@/config/env';
import { REDEMPTION, VAULT_FORMATS } from '@/utils/constants';

/**
 * Redemption Service for PBCEx
 * Handles requests to redeem synthetic assets for physical inventory
 */

export interface RedemptionRequestInput {
  userId: string;
  asset: string; // Synthetic asset (e.g., 'XAU-s', 'XAG-s')
  amount: string; // Amount of synthetic asset to redeem
  format: keyof typeof VAULT_FORMATS; // Desired physical format
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  preferences?: {
    vaultLocation?: string;
    priority?: boolean;
    insuranceRequired?: boolean;
  };
}

export interface RedemptionQuote {
  asset: string;
  amount: string;
  format: string;
  estimatedValue: string;
  availableSkus: Array<{
    sku: string;
    name: string;
    weight: string;
    purity: string;
    unitCost: string;
    qtyAvailable: number;
  }>;
  redemptionFee: string;
  shippingCost: string;
  totalCost: string;
  expiresAt: Date;
  minRedemptionValue: string;
}

export class RedemptionService {
  /**
   * Check if vault redemption is enabled
   */
  private static checkRedemptionEnabled(): void {
    if (!env.ENABLE_VAULT_REDEMPTION) {
      throw createError.serviceUnavailable('Vault redemption services are not implemented');
    }
  }

  /**
   * Get redemption quote for synthetic asset
   */
  static async getRedemptionQuote(
    asset: string,
    amount: string,
    format: keyof typeof VAULT_FORMATS
  ): Promise<RedemptionQuote> {
    RedemptionService.checkRedemptionEnabled();
    
    logInfo('Getting redemption quote', { asset, amount, format });

    try {
      // Validate asset is synthetic
      if (!asset.endsWith('-s')) {
        throw createError.validation('Only synthetic assets can be redeemed for physical inventory');
      }

      const requestedAmount = parseFloat(amount);
      if (requestedAmount <= 0) {
        throw createError.validation('Redemption amount must be positive');
      }

      // Map synthetic asset to metal
      const metal = RedemptionService.mapSyntheticToMetal(asset);
      
      // Get available vault inventory (stub - would query actual inventory)
      const mockSkus = RedemptionService.getMockAvailableSkus(metal, format);
      
      if (mockSkus.length === 0) {
        throw createError.validation(`No ${format.toLowerCase()} inventory available for ${asset}`);
      }

      // Calculate estimated value and costs
      const baseValue = requestedAmount * parseFloat(mockSkus[0]?.unitCost || '0');
      const redemptionFeeRate = 0.01; // 1% redemption fee
      const redemptionFee = (baseValue * redemptionFeeRate).toFixed(2);
      const shippingCost = RedemptionService.calculateShippingCost(baseValue);
      const totalCost = (baseValue + parseFloat(redemptionFee) + parseFloat(shippingCost)).toFixed(2);

      // Check minimum redemption value
      if (baseValue < REDEMPTION.MIN_REDEMPTION_VALUE) {
        throw createError.validation(`Minimum redemption value is $${REDEMPTION.MIN_REDEMPTION_VALUE}`);
      }

      if (baseValue > REDEMPTION.MAX_REDEMPTION_VALUE) {
        throw createError.validation(`Maximum redemption value is $${REDEMPTION.MAX_REDEMPTION_VALUE}`);
      }

      const quote: RedemptionQuote = {
        asset,
        amount,
        format,
        estimatedValue: baseValue.toFixed(2),
        availableSkus: mockSkus,
        redemptionFee,
        shippingCost,
        totalCost,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        minRedemptionValue: REDEMPTION.MIN_REDEMPTION_VALUE.toString(),
      };

      logInfo('Redemption quote generated', {
        asset,
        estimatedValue: quote.estimatedValue,
        totalCost: quote.totalCost,
      });

      return quote;

    } catch (error) {
      logError('Failed to get redemption quote', error as Error);
      throw error;
    }
  }

  /**
   * Request redemption of synthetic asset for physical delivery
   */
  static async requestRedemption(input: RedemptionRequestInput): Promise<RedemptionRequest> {
    RedemptionService.checkRedemptionEnabled();
    
    logInfo('Processing redemption request', {
      userId: input.userId,
      asset: input.asset,
      amount: input.amount,
      format: input.format,
    });

    try {
      // Validate input
      RedemptionService.validateRedemptionInput(input);

      // Get redemption quote to validate availability
      const quote = await RedemptionService.getRedemptionQuote(
        input.asset,
        input.amount,
        input.format
      );

      // Select best available SKU (first one for now)
      const selectedSku = quote.availableSkus[0];
      if (!selectedSku) {
        throw createError.validation('No suitable inventory available for redemption');
      }

      // Calculate quantity needed
      const requestedValue = parseFloat(input.amount);
      const unitValue = parseFloat(selectedSku.unitCost);
      const requestedQty = Math.floor(requestedValue / unitValue);

      if (requestedQty === 0) {
        throw createError.validation('Redemption amount too small for available inventory');
      }

      if (requestedQty > selectedSku.qtyAvailable) {
        throw createError.validation(`Only ${selectedSku.qtyAvailable} items available, requested ${requestedQty}`);
      }

      // TODO: Check user balance has sufficient synthetic asset amount
      // const balance = await BalanceService.getBalance(input.userId, input.asset);
      // if (!balance || parseFloat(balance.amount) < parseFloat(input.amount)) {
      //   throw createError.validation('Insufficient balance for redemption');
      // }

      // Allocate inventory
      const allocationRequest: AllocationRequest = {
        userId: input.userId,
        sku: selectedSku.sku,
        requestedQty,
        shippingAddress: input.shippingAddress,
      };

      const redemptionRequest = await VaultCustodyService.allocateForOrder(allocationRequest);

      // TODO: In real implementation:
      // 1. Lock user's synthetic asset balance
      // 2. Create pending balance change record
      // 3. Set timer for automatic expiration
      // 4. Send confirmation notification

      logInfo('Redemption request created successfully', {
        redemptionId: redemptionRequest.id,
        userId: input.userId,
        sku: selectedSku.sku,
        qty: requestedQty,
      });

      return redemptionRequest;

    } catch (error) {
      logError('Failed to process redemption request', error as Error);
      throw error;
    }
  }

  /**
   * Get redemption status by ID
   */
  static async getRedemptionStatus(requestId: string): Promise<RedemptionRequest> {
    RedemptionService.checkRedemptionEnabled();
    
    logInfo('Getting redemption status', { requestId });

    try {
      const redemption = await VaultCustodyService.getRedemptionById(requestId);
      
      if (!redemption) {
        throw createError.notFound(`Redemption request ${requestId}`);
      }

      return redemption;

    } catch (error) {
      logError('Failed to get redemption status', error as Error);
      throw error;
    }
  }

  /**
   * Cancel a redemption request
   */
  static async cancelRedemption(
    requestId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    RedemptionService.checkRedemptionEnabled();
    
    logInfo('Cancelling redemption request', { requestId, userId, reason });

    try {
      const redemption = await VaultCustodyService.getRedemptionById(requestId);
      
      if (!redemption) {
        throw createError.notFound(`Redemption request ${requestId}`);
      }

      if (redemption.userId !== userId) {
        throw createError.authorization('Cannot cancel another user\'s redemption');
      }

      // Check if cancellation is allowed
      const canCancel = ['PENDING', 'APPROVED'].includes(redemption.status);
      if (!canCancel) {
        throw createError.validation('Redemption cannot be cancelled in current status');
      }

      await VaultCustodyService.cancelRedemption(requestId, reason || 'User cancellation');

      logInfo('Redemption cancelled successfully', { requestId, userId });

    } catch (error) {
      logError('Failed to cancel redemption request', error as Error);
      throw error;
    }
  }

  // Private helper methods

  private static mapSyntheticToMetal(asset: string): string {
    const metalMap: Record<string, string> = {
      'XAU-s': 'AU',
      'XAG-s': 'AG',
      'XPT-s': 'PT',
      'XPD-s': 'PD',
      'XCU-s': 'CU',
    };

    const metal = metalMap[asset];
    if (!metal) {
      throw createError.validation(`Unsupported asset for redemption: ${asset}`);
    }

    return metal;
  }

  private static getMockAvailableSkus(
    metal: string,
    format: keyof typeof VAULT_FORMATS
  ): RedemptionQuote['availableSkus'] {
    // Mock data - would query actual vault inventory
    const mockInventory: Record<string, Record<string, any[]>> = {
      'AU': {
        'COIN': [
          { sku: 'AU-EAGLE-1OZ', name: 'American Gold Eagle - 1 oz', weight: '1.0000', purity: '0.9167', unitCost: '2150.00', qtyAvailable: 100 },
          { sku: 'AU-MAPLE-1OZ', name: 'Canadian Gold Maple - 1 oz', weight: '1.0000', purity: '0.9999', unitCost: '2145.00', qtyAvailable: 50 },
        ],
        'BAR': [
          { sku: 'AU-BAR-1OZ', name: 'PAMP Suisse Gold Bar - 1 oz', weight: '1.0000', purity: '0.9999', unitCost: '2140.00', qtyAvailable: 200 },
        ],
      },
      'AG': {
        'COIN': [
          { sku: 'AG-EAGLE-1OZ', name: 'American Silver Eagle - 1 oz', weight: '1.0000', purity: '0.999', unitCost: '32.50', qtyAvailable: 500 },
        ],
        'BAR': [
          { sku: 'AG-BAR-10OZ', name: 'Sunshine Silver Bar - 10 oz', weight: '10.0000', purity: '0.999', unitCost: '320.00', qtyAvailable: 100 },
        ],
      },
    };

    return mockInventory[metal]?.[format] || [];
  }

  private static calculateShippingCost(value: number): string {
    // Progressive shipping cost based on value
    if (value < 1000) return '25.00';
    if (value < 5000) return '35.00';
    if (value < 10000) return '50.00';
    if (value < 25000) return '75.00';
    return '100.00'; // High-value shipments
  }

  private static validateRedemptionInput(input: RedemptionRequestInput): void {
    if (!input.userId) {
      throw createError.validation('User ID is required');
    }

    if (!input.asset || !input.asset.endsWith('-s')) {
      throw createError.validation('Valid synthetic asset is required');
    }

    const amount = parseFloat(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw createError.validation('Valid redemption amount is required');
    }

    if (!Object.keys(VAULT_FORMATS).includes(input.format)) {
      throw createError.validation('Valid format is required');
    }

    if (!input.shippingAddress.name || !input.shippingAddress.line1) {
      throw createError.validation('Complete shipping address is required');
    }

    if (!input.shippingAddress.phone) {
      throw createError.validation('Phone number is required for redemption');
    }
  }

  /**
   * Get user's redemption history
   */
  static async getUserRedemptions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ requests: RedemptionRequest[]; total: number }> {
    RedemptionService.checkRedemptionEnabled();
    
    return await VaultCustodyService.getUserRedemptions(userId, limit, offset);
  }

  /**
   * Get redemption statistics for admin dashboard
   */
  static async getRedemptionStats(): Promise<{
    totalRequests: number;
    pendingApproval: number;
    totalValue: string;
    averageProcessingTime: number;
  }> {
    RedemptionService.checkRedemptionEnabled();
    
    logInfo('Getting redemption statistics');

    try {
      // Stub implementation - would aggregate from database
      const stats = {
        totalRequests: 145,
        pendingApproval: 8,
        totalValue: '325000.00',
        averageProcessingTime: 72, // hours
      };

      return stats;

    } catch (error) {
      logError('Failed to get redemption statistics', error as Error);
      throw error;
    }
  }
}

export default RedemptionService;
