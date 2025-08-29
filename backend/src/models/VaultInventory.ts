import { z } from 'zod';

/**
 * Vault Inventory model for PBCEx platform
 * Tracks physical precious metals inventory in vaulted storage
 */

// Vault inventory interface
export interface VaultInventory {
  id: string;
  metal: 'AU' | 'AG' | 'PT' | 'PD' | 'CU';
  sku: string; // Unique product identifier (e.g., "AU-EAGLE-1OZ")
  format: 'BAR' | 'COIN' | 'SHEET' | 'COIL' | 'ROUND';
  weight: string; // Weight in troy ounces (or pounds for copper)
  purity: string; // Purity (e.g., 0.9999 for fine gold)
  vaultLocation: string; // Vault facility identifier
  qtyAvailable: number; // Available quantity for redemption
  qtyReserved: number; // Quantity reserved for pending redemptions
  unitCost: string; // Cost basis per unit
  lastRestocked: Date;
  isActive: boolean;
  metadata?: Record<string, any>; // Additional product details
  createdAt: Date;
  updatedAt: Date;
}

// Vault inventory creation interface
export interface CreateVaultInventoryInput {
  metal: VaultInventory['metal'];
  sku: string;
  format: VaultInventory['format'];
  weight: string;
  purity: string;
  vaultLocation: string;
  qtyAvailable: number;
  unitCost: string;
  metadata?: Record<string, any>;
}

// Vault inventory update interface
export interface UpdateVaultInventoryInput {
  qtyAvailable?: number;
  qtyReserved?: number;
  unitCost?: string;
  lastRestocked?: Date;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Vault allocation result
export interface VaultAllocation {
  inventoryId: string;
  sku: string;
  allocatedQty: number;
  remainingQty: number;
}

// Database schema validation
export const vaultInventorySchema = z.object({
  id: z.string().uuid(),
  metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']),
  sku: z.string().min(1).max(50),
  format: z.enum(['BAR', 'COIN', 'SHEET', 'COIL', 'ROUND']),
  weight: z.string().regex(/^\d+\.?\d*$/, 'Weight must be a valid decimal number'),
  purity: z.string().regex(/^0\.\d+$|^1\.0+$/, 'Purity must be between 0.0 and 1.0'),
  vaultLocation: z.string().min(1).max(100),
  qtyAvailable: z.number().int().min(0, 'Available quantity must be non-negative'),
  qtyReserved: z.number().int().min(0, 'Reserved quantity must be non-negative'),
  unitCost: z.string().regex(/^\d+\.?\d*$/, 'Unit cost must be a valid decimal number'),
  lastRestocked: z.date(),
  isActive: z.boolean(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createVaultInventoryInputSchema = z.object({
  metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']),
  sku: z.string().min(1).max(50),
  format: z.enum(['BAR', 'COIN', 'SHEET', 'COIL', 'ROUND']),
  weight: z.string().regex(/^\d+\.?\d*$/, 'Weight must be a valid decimal number'),
  purity: z.string().regex(/^0\.\d+$|^1\.0+$/, 'Purity must be between 0.0 and 1.0'),
  vaultLocation: z.string().min(1).max(100),
  qtyAvailable: z.number().int().min(0, 'Available quantity must be non-negative'),
  unitCost: z.string().regex(/^\d+\.?\d*$/, 'Unit cost must be a valid decimal number'),
  metadata: z.record(z.any()).optional(),
});

export const updateVaultInventoryInputSchema = z.object({
  qtyAvailable: z.number().int().min(0, 'Available quantity must be non-negative').optional(),
  qtyReserved: z.number().int().min(0, 'Reserved quantity must be non-negative').optional(),
  unitCost: z.string().regex(/^\d+\.?\d*$/, 'Unit cost must be a valid decimal number').optional(),
  lastRestocked: z.date().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Vault inventory utility functions
export class VaultInventoryUtils {
  /**
   * Get display name for inventory item
   */
  static getDisplayName(item: VaultInventory): string {
    const metalNames = {
      'AU': 'Gold',
      'AG': 'Silver',
      'PT': 'Platinum',
      'PD': 'Palladium',
      'CU': 'Copper',
    };
    
    return `${metalNames[item.metal]} ${item.format.toLowerCase()} - ${item.weight} oz`;
  }

  /**
   * Calculate total available value
   */
  static calculateInventoryValue(item: VaultInventory): string {
    const qty = item.qtyAvailable;
    const cost = parseFloat(item.unitCost);
    return (qty * cost).toFixed(2);
  }

  /**
   * Check if sufficient inventory available for allocation
   */
  static canAllocate(item: VaultInventory, requestedQty: number): boolean {
    return item.isActive && (item.qtyAvailable >= requestedQty);
  }

  /**
   * Reserve inventory for redemption
   */
  static reserveInventory(item: VaultInventory, qty: number): {
    success: boolean;
    error?: string;
    allocation?: VaultAllocation;
  } {
    if (!VaultInventoryUtils.canAllocate(item, qty)) {
      return {
        success: false,
        error: `Insufficient inventory. Available: ${item.qtyAvailable}, Requested: ${qty}`,
      };
    }

    return {
      success: true,
      allocation: {
        inventoryId: item.id,
        sku: item.sku,
        allocatedQty: qty,
        remainingQty: item.qtyAvailable - qty,
      },
    };
  }

  /**
   * Get inventory status color for UI
   */
  static getInventoryStatusColor(item: VaultInventory): string {
    if (!item.isActive) return 'text-red-600 bg-red-100';
    
    const availableRatio = item.qtyAvailable / (item.qtyAvailable + item.qtyReserved);
    
    if (availableRatio > 0.7) return 'text-green-600 bg-green-100';
    if (availableRatio > 0.3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }

  /**
   * Get recommended restock quantity
   */
  static getRecommendedRestockQty(item: VaultInventory): number {
    const totalQty = item.qtyAvailable + item.qtyReserved;
    const minStockLevel = Math.max(10, totalQty * 0.2); // 20% of total or minimum 10
    
    return Math.max(0, minStockLevel - item.qtyAvailable);
  }

  /**
   * Validate vault inventory data
   */
  static validate(inventory: Partial<VaultInventory>): VaultInventory {
    return vaultInventorySchema.parse(inventory);
  }

  /**
   * Validate create vault inventory input
   */
  static validateCreateInput(input: any): CreateVaultInventoryInput {
    return createVaultInventoryInputSchema.parse(input);
  }

  /**
   * Validate update vault inventory input
   */
  static validateUpdateInput(input: any): UpdateVaultInventoryInput {
    return updateVaultInventoryInputSchema.parse(input);
  }

  /**
   * Generate default values for creation
   */
  static getDefaultValues(): Partial<VaultInventory> {
    return {
      qtyReserved: 0,
      lastRestocked: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate SKU from product details
   */
  static generateSku(metal: string, format: string, weight: string): string {
    const cleanWeight = weight.replace('.', '');
    return `${metal}-${format}-${cleanWeight}OZ`;
  }

  /**
   * Filter inventory by criteria
   */
  static filterInventory(
    inventory: VaultInventory[],
    criteria: {
      metal?: string;
      format?: string;
      vaultLocation?: string;
      minQty?: number;
      activeOnly?: boolean;
    }
  ): VaultInventory[] {
    return inventory.filter(item => {
      if (criteria.metal && item.metal !== criteria.metal) return false;
      if (criteria.format && item.format !== criteria.format) return false;
      if (criteria.vaultLocation && item.vaultLocation !== criteria.vaultLocation) return false;
      if (criteria.minQty && item.qtyAvailable < criteria.minQty) return false;
      if (criteria.activeOnly && !item.isActive) return false;
      return true;
    });
  }
}

// SQL table definition (for reference/migration)
export const VAULT_INVENTORY_TABLE_SQL = `
CREATE TABLE vault_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal VARCHAR(2) NOT NULL CHECK (metal IN ('AU', 'AG', 'PT', 'PD', 'CU')),
  sku VARCHAR(50) UNIQUE NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('BAR', 'COIN', 'SHEET', 'COIL', 'ROUND')),
  weight DECIMAL(10,4) NOT NULL CHECK (weight > 0),
  purity DECIMAL(6,4) NOT NULL CHECK (purity > 0 AND purity <= 1),
  vault_location VARCHAR(100) NOT NULL,
  qty_available INTEGER NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
  qty_reserved INTEGER NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost > 0),
  last_restocked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vault_inventory_metal ON vault_inventory(metal);
CREATE INDEX idx_vault_inventory_sku ON vault_inventory(sku);
CREATE INDEX idx_vault_inventory_format ON vault_inventory(format);
CREATE INDEX idx_vault_inventory_vault_location ON vault_inventory(vault_location);
CREATE INDEX idx_vault_inventory_available ON vault_inventory(qty_available) WHERE is_active = TRUE;
CREATE INDEX idx_vault_inventory_active ON vault_inventory(is_active);

-- Updated at trigger
CREATE TRIGGER trigger_vault_inventory_updated_at
  BEFORE UPDATE ON vault_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
`;
