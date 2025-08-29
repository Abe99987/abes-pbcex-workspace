import { VaultInventory, VaultInventoryUtils, VaultAllocation } from '@/models/VaultInventory';
import { RedemptionRequest, CreateRedemptionRequestInput, RedemptionRequestUtils, REDEMPTION_STATUS } from '@/models/RedemptionRequest';
import { createError } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { env } from '@/config/env';
import { VAULT_LOCATIONS, REDEMPTION } from '@/utils/constants';

/**
 * Vault Custody Service for PBCEx
 * Manages physical inventory in vaulted storage and redemption allocations
 */

export interface VaultBalance {
  metal: string;
  totalAvailable: number;
  totalReserved: number;
  totalValue: string;
  locations: Array<{
    location: string;
    available: number;
    reserved: number;
  }>;
}

export interface AllocationRequest {
  userId: string;
  sku: string;
  requestedQty: number;
  shippingAddress: any;
}

export class VaultCustodyService {
  /**
   * Check if vault services are enabled
   */
  private static checkVaultEnabled(): void {
    if (!env.ENABLE_VAULT_REDEMPTION) {
      throw createError.serviceUnavailable('Vault', 'Vault redemption services are currently disabled');
    }
  }

  /**
   * Get vault inventory balances by metal
   */
  static async getVaultBalances(): Promise<VaultBalance[]> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Getting vault balances');

    try {
      // Stub implementation - would query vault_inventory table
      const mockInventory: VaultInventory[] = [
        {
          id: 'inv-1',
          metal: 'AU',
          sku: 'AU-EAGLE-1OZ',
          format: 'COIN',
          weight: '1.0000',
          purity: '0.9167',
          vaultLocation: VAULT_LOCATIONS.MAIN,
          qtyAvailable: 100,
          qtyReserved: 5,
          unitCost: '2150.00',
          lastRestocked: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'inv-2',
          metal: 'AG',
          sku: 'AG-EAGLE-1OZ',
          format: 'COIN',
          weight: '1.0000',
          purity: '0.999',
          vaultLocation: VAULT_LOCATIONS.MAIN,
          qtyAvailable: 500,
          qtyReserved: 25,
          unitCost: '32.50',
          lastRestocked: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Group by metal
      const balanceMap = new Map<string, VaultBalance>();
      
      for (const item of mockInventory) {
        if (!balanceMap.has(item.metal)) {
          balanceMap.set(item.metal, {
            metal: item.metal,
            totalAvailable: 0,
            totalReserved: 0,
            totalValue: '0',
            locations: [],
          });
        }
        
        const balance = balanceMap.get(item.metal)!;
        balance.totalAvailable += item.qtyAvailable;
        balance.totalReserved += item.qtyReserved;
        
        // Update location data
        let locationEntry = balance.locations.find(l => l.location === item.vaultLocation);
        if (!locationEntry) {
          locationEntry = { location: item.vaultLocation, available: 0, reserved: 0 };
          balance.locations.push(locationEntry);
        }
        locationEntry.available += item.qtyAvailable;
        locationEntry.reserved += item.qtyReserved;
      }

      // Calculate total values (simplified - would use real pricing)
      for (const balance of balanceMap.values()) {
        const avgPrice = balance.metal === 'AU' ? 2150 : 32.50;
        balance.totalValue = (balance.totalAvailable * avgPrice).toFixed(2);
      }

      const balances = Array.from(balanceMap.values());
      
      logInfo('Vault balances retrieved', { 
        metals: balances.map(b => b.metal),
        totalItems: balances.reduce((sum, b) => sum + b.totalAvailable, 0)
      });
      
      return balances;

    } catch (error) {
      logError('Failed to get vault balances', error as Error);
      throw error;
    }
  }

  /**
   * Get available inventory by SKU
   */
  static async getInventoryBySku(sku: string): Promise<VaultInventory | null> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Getting inventory by SKU', { sku });

    try {
      // Stub implementation - would query database
      if (sku === 'AU-EAGLE-1OZ') {
        return {
          id: 'inv-1',
          metal: 'AU',
          sku: 'AU-EAGLE-1OZ',
          format: 'COIN',
          weight: '1.0000',
          purity: '0.9167',
          vaultLocation: VAULT_LOCATIONS.MAIN,
          qtyAvailable: 100,
          qtyReserved: 5,
          unitCost: '2150.00',
          lastRestocked: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      return null;

    } catch (error) {
      logError('Failed to get inventory by SKU', error as Error);
      throw error;
    }
  }

  /**
   * Allocate inventory for a redemption order
   */
  static async allocateForOrder(request: AllocationRequest): Promise<RedemptionRequest> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Allocating inventory for order', {
      userId: request.userId,
      sku: request.sku,
      qty: request.requestedQty,
    });

    try {
      // Get inventory item
      const inventory = await VaultCustodyService.getInventoryBySku(request.sku);
      if (!inventory) {
        throw createError.notFound(`Inventory item with SKU ${request.sku}`);
      }

      // Check availability
      const allocation = VaultInventoryUtils.reserveInventory(inventory, request.requestedQty);
      if (!allocation.success) {
        throw createError.validation(allocation.error!);
      }

      // Calculate estimated value
      const unitCost = parseFloat(inventory.unitCost);
      const estimatedValue = (request.requestedQty * unitCost).toFixed(2);

      // Create redemption request
      const redemptionInput: CreateRedemptionRequestInput = {
        userId: request.userId,
        asset: `X${inventory.metal}-s`, // Map metal to synthetic asset
        assetAmount: request.requestedQty.toString(),
        vaultSku: request.sku,
        requestedQty: request.requestedQty,
        shippingAddress: request.shippingAddress,
        estimatedValue,
      };

      // Create redemption request (stub - would insert to database)
      const redemptionRequest: RedemptionRequest = {
        id: 'redemption_' + Math.random().toString(36).substr(2, 9),
        ...redemptionInput,
        ...RedemptionRequestUtils.getDefaultValues(),
        vaultLocation: inventory.vaultLocation,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RedemptionRequest;

      // TODO: In real implementation:
      // 1. Start database transaction
      // 2. Update inventory (increase qty_reserved, decrease qty_available)
      // 3. Insert redemption request
      // 4. Insert vault audit log entry
      // 5. Commit transaction

      logInfo('Inventory allocated successfully', {
        redemptionId: redemptionRequest.id,
        allocatedQty: allocation.allocation!.allocatedQty,
        remainingQty: allocation.allocation!.remainingQty,
      });

      return redemptionRequest;

    } catch (error) {
      logError('Failed to allocate inventory for order', error as Error);
      throw error;
    }
  }

  /**
   * Mark a redemption request as shipped
   */
  static async markShipped(
    requestId: string,
    trackingNumber: string,
    shippingCarrier: string = 'FEDEX'
  ): Promise<void> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Marking redemption as shipped', { 
      requestId, 
      trackingNumber, 
      shippingCarrier 
    });

    try {
      // Stub implementation - would update database
      // TODO: In real implementation:
      // 1. Find redemption request
      // 2. Validate it's in APPROVED or ALLOCATED status
      // 3. Update status to SHIPPED
      // 4. Set tracking_number, shipping_carrier, shipped_at
      // 5. Update inventory (convert reserved to shipped/sold)
      // 6. Send notification to user

      logInfo('Redemption marked as shipped', { requestId, trackingNumber });

    } catch (error) {
      logError('Failed to mark redemption as shipped', error as Error);
      throw error;
    }
  }

  /**
   * Cancel a redemption request and release allocated inventory
   */
  static async cancelRedemption(requestId: string, reason: string): Promise<void> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Cancelling redemption request', { requestId, reason });

    try {
      // Stub implementation - would update database
      // TODO: In real implementation:
      // 1. Find redemption request
      // 2. Validate it can be cancelled
      // 3. Release reserved inventory back to available
      // 4. Update redemption status to CANCELLED
      // 5. Record audit log entry
      // 6. Send notification to user

      logInfo('Redemption cancelled successfully', { requestId });

    } catch (error) {
      logError('Failed to cancel redemption request', error as Error);
      throw error;
    }
  }

  /**
   * Get redemption requests by user
   */
  static async getUserRedemptions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ requests: RedemptionRequest[]; total: number }> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Getting user redemption requests', { userId, limit, offset });

    try {
      // Stub implementation - would query database
      const mockRequests: RedemptionRequest[] = [];
      
      return {
        requests: mockRequests,
        total: 0,
      };

    } catch (error) {
      logError('Failed to get user redemption requests', error as Error);
      throw error;
    }
  }

  /**
   * Get redemption request by ID
   */
  static async getRedemptionById(requestId: string): Promise<RedemptionRequest | null> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Getting redemption by ID', { requestId });

    try {
      // Stub implementation - would query database
      return null;

    } catch (error) {
      logError('Failed to get redemption by ID', error as Error);
      throw error;
    }
  }

  /**
   * Get vault inventory summary for admin dashboard
   */
  static async getInventorySummary(): Promise<{
    totalItems: number;
    totalValue: string;
    lowStockItems: number;
    recentRestocks: number;
  }> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Getting inventory summary');

    try {
      // Stub implementation - would aggregate from database
      const summary = {
        totalItems: 1875,
        totalValue: '4250000.00',
        lowStockItems: 5,
        recentRestocks: 3,
      };

      return summary;

    } catch (error) {
      logError('Failed to get inventory summary', error as Error);
      throw error;
    }
  }

  /**
   * Restock vault inventory
   */
  static async restockInventory(
    sku: string,
    additionalQty: number,
    unitCost?: string
  ): Promise<void> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Restocking vault inventory', { sku, additionalQty, unitCost });

    try {
      // Stub implementation - would update database
      // TODO: In real implementation:
      // 1. Find inventory item by SKU
      // 2. Update qty_available
      // 3. Update unit_cost if provided
      // 4. Update last_restocked timestamp
      // 5. Create audit log entry

      logInfo('Inventory restocked successfully', { sku, additionalQty });

    } catch (error) {
      logError('Failed to restock inventory', error as Error);
      throw error;
    }
  }

  /**
   * Get low stock items that need restocking
   */
  static async getLowStockItems(threshold: number = 10): Promise<VaultInventory[]> {
    VaultCustodyService.checkVaultEnabled();
    
    logInfo('Getting low stock items', { threshold });

    try {
      // Stub implementation - would query database
      const lowStockItems: VaultInventory[] = [];
      
      return lowStockItems;

    } catch (error) {
      logError('Failed to get low stock items', error as Error);
      throw error;
    }
  }
}

export default VaultCustodyService;
