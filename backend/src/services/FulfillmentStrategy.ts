import { Order } from '@/models/Order';
import DillonGageService from '@/services/DillonGageService';
import { createError } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { env } from '@/config/env';
import { FULFILLMENT_STRATEGIES, SERVICE_TIMEOUTS } from '@/utils/constants';

/**
 * Fulfillment Strategy Service for PBCEx
 * Handles different fulfillment strategies (JM Bullion vs Brinks)
 */

export interface FulfillmentRequest {
  orderId: string;
  productCode: string;
  quantity: number;
  shippingAddress: any;
  customerInfo: {
    userId: string;
    name: string;
    email: string;
    phone: string;
  };
  paymentReference?: string;
  priority?: boolean;
}

export interface FulfillmentResponse {
  success: boolean;
  providerOrderId?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippingCarrier?: string;
  cost?: string;
  error?: string;
}

export interface FulfillmentProvider {
  name: string;
  processFulfillment(request: FulfillmentRequest): Promise<FulfillmentResponse>;
  checkOrderStatus(providerOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  }>;
  cancelOrder(providerOrderId: string): Promise<boolean>;
}

/**
 * JM Bullion fulfillment strategy
 */
class JMStrategy implements FulfillmentProvider {
  name = 'JM Bullion';

  async processFulfillment(request: FulfillmentRequest): Promise<FulfillmentResponse> {
    logInfo('Processing JM Bullion fulfillment', {
      orderId: request.orderId,
      productCode: request.productCode,
      quantity: request.quantity,
    });

    try {
      // Simulate JM Bullion API call
      const jmOrderId = `JM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response: FulfillmentResponse = {
        success: true,
        providerOrderId: jmOrderId,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        shippingCarrier: 'UPS',
        cost: '25.00',
      };

      logInfo('JM Bullion fulfillment completed', {
        orderId: request.orderId,
        providerOrderId: jmOrderId,
      });

      return response;

    } catch (error) {
      logError('JM Bullion fulfillment failed', error as Error);
      return {
        success: false,
        error: 'JM Bullion processing failed: ' + (error as Error).message,
      };
    }
  }

  async checkOrderStatus(providerOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  }> {
    logInfo('Checking JM Bullion order status', { providerOrderId });

    // Mock status check
    return {
      status: 'PROCESSING',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    logInfo('Cancelling JM Bullion order', { providerOrderId });
    
    // Mock cancellation
    return true;
  }
}

/**
 * Brinks fulfillment strategy (Memphis warehouse)
 */
class BrinksStrategy implements FulfillmentProvider {
  name = 'Brinks Memphis';

  async processFulfillment(request: FulfillmentRequest): Promise<FulfillmentResponse> {
    logInfo('Processing Brinks fulfillment', {
      orderId: request.orderId,
      productCode: request.productCode,
      quantity: request.quantity,
    });

    try {
      // Simulate Brinks API call
      const brinksOrderId = `BRINKS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response: FulfillmentResponse = {
        success: true,
        providerOrderId: brinksOrderId,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days (faster)
        shippingCarrier: 'FEDEX',
        cost: '35.00', // Higher cost but faster
      };

      logInfo('Brinks fulfillment completed', {
        orderId: request.orderId,
        providerOrderId: brinksOrderId,
      });

      return response;

    } catch (error) {
      logError('Brinks fulfillment failed', error as Error);
      return {
        success: false,
        error: 'Brinks processing failed: ' + (error as Error).message,
      };
    }
  }

  async checkOrderStatus(providerOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  }> {
    logInfo('Checking Brinks order status', { providerOrderId });

    // Mock status check
    return {
      status: 'READY_TO_SHIP',
      trackingNumber: `1Z999AA${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    logInfo('Cancelling Brinks order', { providerOrderId });
    
    // Mock cancellation - Brinks might have stricter policies
    return false; // Simulate that Brinks doesn't allow cancellations once processed
  }
}

export class FulfillmentStrategy {
  private static strategies: Map<string, FulfillmentProvider> = new Map([
    [FULFILLMENT_STRATEGIES.JM, new JMStrategy()],
    [FULFILLMENT_STRATEGIES.BRINKS, new BrinksStrategy()],
  ]);

  /**
   * Get the active fulfillment strategy from environment
   */
  static getActiveStrategy(): FulfillmentProvider {
    const strategyName = env.FULFILLMENT_STRATEGY;
    const strategy = FulfillmentStrategy.strategies.get(strategyName);
    
    if (!strategy) {
      logError('Invalid fulfillment strategy configured', { strategy: strategyName });
      throw createError.internal(`Invalid fulfillment strategy: ${strategyName}`);
    }

    logInfo('Using fulfillment strategy', { strategy: strategy.name });
    return strategy;
  }

  /**
   * Process fulfillment using the active strategy
   */
  static async processFulfillment(request: FulfillmentRequest): Promise<FulfillmentResponse> {
    logInfo('Processing fulfillment request', {
      orderId: request.orderId,
      strategy: env.FULFILLMENT_STRATEGY,
    });

    try {
      const strategy = FulfillmentStrategy.getActiveStrategy();
      const result = await strategy.processFulfillment(request);

      if (result.success) {
        // After successful fulfillment, trigger Dillon Gage restock
        await FulfillmentStrategy.triggerRestock(request);
      }

      return result;

    } catch (error) {
      logError('Fulfillment processing failed', error as Error);
      throw error;
    }
  }

  /**
   * Check order status using the active strategy
   */
  static async checkOrderStatus(providerOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  }> {
    logInfo('Checking order status', { providerOrderId });

    try {
      const strategy = FulfillmentStrategy.getActiveStrategy();
      return await strategy.checkOrderStatus(providerOrderId);

    } catch (error) {
      logError('Order status check failed', error as Error);
      throw error;
    }
  }

  /**
   * Cancel order using the active strategy
   */
  static async cancelOrder(providerOrderId: string): Promise<boolean> {
    logInfo('Cancelling order', { providerOrderId });

    try {
      const strategy = FulfillmentStrategy.getActiveStrategy();
      return await strategy.cancelOrder(providerOrderId);

    } catch (error) {
      logError('Order cancellation failed', error as Error);
      throw error;
    }
  }

  /**
   * Get capabilities of the active strategy
   */
  static getStrategyCapabilities(): {
    name: string;
    estimatedDeliveryDays: number;
    shippingCarriers: string[];
    cancellationPolicy: string;
    averageCost: string;
  } {
    const strategy = env.FULFILLMENT_STRATEGY;
    
    const capabilities = {
      [FULFILLMENT_STRATEGIES.JM]: {
        name: 'JM Bullion',
        estimatedDeliveryDays: 5,
        shippingCarriers: ['UPS', 'FEDEX'],
        cancellationPolicy: 'Cancellation allowed within 24 hours',
        averageCost: '$25-35',
      },
      [FULFILLMENT_STRATEGIES.BRINKS]: {
        name: 'Brinks Memphis',
        estimatedDeliveryDays: 3,
        shippingCarriers: ['FEDEX'],
        cancellationPolicy: 'No cancellations once processed',
        averageCost: '$35-50',
      },
    };

    return capabilities[strategy] || capabilities[FULFILLMENT_STRATEGIES.JM];
  }

  /**
   * Compare fulfillment strategies
   */
  static compareStrategies(): Array<{
    strategy: string;
    name: string;
    deliveryDays: number;
    cost: string;
    reliability: string;
  }> {
    return [
      {
        strategy: FULFILLMENT_STRATEGIES.JM,
        name: 'JM Bullion',
        deliveryDays: 5,
        cost: 'Lower',
        reliability: 'High',
      },
      {
        strategy: FULFILLMENT_STRATEGIES.BRINKS,
        name: 'Brinks Memphis',
        deliveryDays: 3,
        cost: 'Higher',
        reliability: 'Very High',
      },
    ];
  }

  /**
   * Switch fulfillment strategy (admin function)
   */
  static async switchStrategy(newStrategy: keyof typeof FULFILLMENT_STRATEGIES): Promise<void> {
    logInfo('Switching fulfillment strategy', {
      from: env.FULFILLMENT_STRATEGY,
      to: newStrategy,
    });

    if (!FulfillmentStrategy.strategies.has(newStrategy)) {
      throw createError.validation(`Invalid strategy: ${newStrategy}`);
    }

    // In a real implementation, this would update the environment configuration
    // For now, we just log the change
    logWarn('Strategy switch requested - requires environment update', {
      newStrategy,
      currentStrategy: env.FULFILLMENT_STRATEGY,
    });
  }

  /**
   * Trigger Dillon Gage restock after fulfillment
   */
  private static async triggerRestock(request: FulfillmentRequest): Promise<void> {
    try {
      logInfo('Triggering post-fulfillment restock', {
        orderId: request.orderId,
        productCode: request.productCode,
        quantity: request.quantity,
      });

      // Extract metal from product code (assuming format like "AU-EAGLE-1OZ")
      const metal = request.productCode.split('-')[0];
      
      if (['AU', 'AG', 'PT', 'PD', 'CU'].includes(metal)) {
        await DillonGageService.restockVault(metal as any, request.quantity);
      }

    } catch (error) {
      // Don't fail the fulfillment if restock fails
      logWarn('Post-fulfillment restock failed', {
        error: (error as Error).message,
        orderId: request.orderId,
      });
    }
  }

  /**
   * Get fulfillment metrics for admin dashboard
   */
  static async getFulfillmentMetrics(): Promise<{
    strategy: string;
    totalOrders: number;
    successRate: string;
    averageDeliveryTime: number;
    averageCost: string;
  }> {
    const strategy = env.FULFILLMENT_STRATEGY;
    
    // Mock metrics - would aggregate from database
    const mockMetrics = {
      [FULFILLMENT_STRATEGIES.JM]: {
        strategy: 'JM Bullion',
        totalOrders: 1247,
        successRate: '98.5%',
        averageDeliveryTime: 4.8, // days
        averageCost: '$28.50',
      },
      [FULFILLMENT_STRATEGIES.BRINKS]: {
        strategy: 'Brinks Memphis',
        totalOrders: 856,
        successRate: '99.2%',
        averageDeliveryTime: 2.9, // days
        averageCost: '$42.75',
      },
    };

    return mockMetrics[strategy] || mockMetrics[FULFILLMENT_STRATEGIES.JM];
  }
}

export default FulfillmentStrategy;
