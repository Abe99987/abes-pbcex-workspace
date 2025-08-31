import { z } from 'zod';

/**
 * Redemption Request model for PBCEx platform
 * Tracks user requests to redeem synthetic assets for physical inventory
 */

// Redemption request statuses
export const REDEMPTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ALLOCATED: 'ALLOCATED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;

// Type guards for Redemption Status
export type RedemptionStatus = typeof REDEMPTION_STATUS[keyof typeof REDEMPTION_STATUS];
export function isRedemptionStatus(value: unknown): value is RedemptionStatus {
  return typeof value === 'string' && Object.values(REDEMPTION_STATUS).includes(value as RedemptionStatus);
}

// Redemption request interface
export interface RedemptionRequest {
  id: string;
  userId: string;
  asset: string; // Synthetic asset being redeemed (e.g., 'XAU-s')
  assetAmount: string; // Amount of synthetic asset being redeemed
  vaultSku: string; // SKU of vault inventory item
  requestedQty: number; // Quantity of physical items requested
  allocatedQty: number; // Quantity actually allocated
  status: typeof REDEMPTION_STATUS[keyof typeof REDEMPTION_STATUS];
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
  vaultLocation: string; // Source vault location
  estimatedValue: string; // USD value at time of request
  lockExpiresAt: Date; // When the allocation expires if not approved
  approvedBy?: string; // Admin user ID who approved
  approvedAt?: Date;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Redemption request creation interface
export interface CreateRedemptionRequestInput {
  userId: string;
  asset: string;
  assetAmount: string;
  vaultSku: string;
  requestedQty: number;
  shippingAddress: RedemptionRequest['shippingAddress'];
  estimatedValue: string;
}

// Redemption request update interface
export interface UpdateRedemptionRequestInput {
  status?: typeof REDEMPTION_STATUS[keyof typeof REDEMPTION_STATUS];
  allocatedQty?: number;
  vaultLocation?: string;
  approvedBy?: string;
  approvedAt?: Date;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

// Redemption summary for admin dashboard
export interface RedemptionSummary {
  totalRequests: number;
  pendingApproval: number;
  awaitingShipment: number;
  inTransit: number;
  completed: number;
  totalValue: string;
  averageProcessingTime: number; // in hours
}

// Database schema validation
export const redemptionRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  asset: z.string().min(1).max(20),
  assetAmount: z.string().regex(/^\d+\.?\d*$/, 'Asset amount must be a valid decimal number'),
  vaultSku: z.string().min(1).max(50),
  requestedQty: z.number().int().min(1, 'Requested quantity must be at least 1'),
  allocatedQty: z.number().int().min(0, 'Allocated quantity must be non-negative'),
  status: z.enum([
    REDEMPTION_STATUS.PENDING,
    REDEMPTION_STATUS.APPROVED,
    REDEMPTION_STATUS.ALLOCATED,
    REDEMPTION_STATUS.SHIPPED,
    REDEMPTION_STATUS.DELIVERED,
    REDEMPTION_STATUS.CANCELLED,
    REDEMPTION_STATUS.FAILED,
  ]),
  shippingAddress: z.object({
    name: z.string().min(1).max(100),
    line1: z.string().min(1).max(100),
    line2: z.string().max(100).optional(),
    city: z.string().min(1).max(50),
    state: z.string().min(2).max(50),
    postalCode: z.string().min(5).max(10),
    country: z.string().length(2),
    phone: z.string().min(10).max(20),
  }),
  vaultLocation: z.string().min(1).max(100),
  estimatedValue: z.string().regex(/^\d+\.?\d*$/, 'Estimated value must be a valid decimal number'),
  lockExpiresAt: z.date(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
  shippingCarrier: z.string().max(50).optional(),
  trackingNumber: z.string().max(100).optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  failureReason: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createRedemptionRequestInputSchema = z.object({
  userId: z.string().uuid(),
  asset: z.string().min(1).max(20),
  assetAmount: z.string().regex(/^\d+\.?\d*$/, 'Asset amount must be a valid decimal number'),
  vaultSku: z.string().min(1).max(50),
  requestedQty: z.number().int().min(1, 'Requested quantity must be at least 1'),
  shippingAddress: z.object({
    name: z.string().min(1).max(100),
    line1: z.string().min(1).max(100),
    line2: z.string().max(100).optional(),
    city: z.string().min(1).max(50),
    state: z.string().min(2).max(50),
    postalCode: z.string().min(5).max(10),
    country: z.string().length(2).default('US'),
    phone: z.string().min(10).max(20),
  }),
  estimatedValue: z.string().regex(/^\d+\.?\d*$/, 'Estimated value must be a valid decimal number'),
});

// Redemption request utility functions
export class RedemptionRequestUtils {
  /**
   * Check if redemption request can be cancelled
   */
  static canCancel(request: RedemptionRequest): boolean {
    const cancelableStatuses = [REDEMPTION_STATUS.PENDING, REDEMPTION_STATUS.APPROVED] as const;
    return cancelableStatuses.includes(request.status as typeof cancelableStatuses[number]);
  }

  /**
   * Check if redemption request can be approved
   */
  static canApprove(request: RedemptionRequest): boolean {
    return request.status === REDEMPTION_STATUS.PENDING;
  }

  /**
   * Check if redemption request can be shipped
   */
  static canShip(request: RedemptionRequest): boolean {
    const shippableStatuses = [REDEMPTION_STATUS.APPROVED, REDEMPTION_STATUS.ALLOCATED] as const;
    return shippableStatuses.includes(request.status as typeof shippableStatuses[number]);
  }

  /**
   * Check if lock is still valid
   */
  static isLockValid(request: RedemptionRequest): boolean {
    const lockValidStatuses = [REDEMPTION_STATUS.PENDING, REDEMPTION_STATUS.APPROVED] as const;
    return new Date() < request.lockExpiresAt && 
           lockValidStatuses.includes(request.status as typeof lockValidStatuses[number]);
  }

  /**
   * Calculate processing time in hours
   */
  static getProcessingTime(request: RedemptionRequest): number | null {
    if (!request.deliveredAt) return null;
    
    const start = request.createdAt.getTime();
    const end = request.deliveredAt.getTime();
    return Math.round((end - start) / (1000 * 60 * 60)); // Convert to hours
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      [REDEMPTION_STATUS.PENDING]: 'text-yellow-700 bg-yellow-100',
      [REDEMPTION_STATUS.APPROVED]: 'text-blue-700 bg-blue-100',
      [REDEMPTION_STATUS.ALLOCATED]: 'text-blue-700 bg-blue-100',
      [REDEMPTION_STATUS.SHIPPED]: 'text-purple-700 bg-purple-100',
      [REDEMPTION_STATUS.DELIVERED]: 'text-green-700 bg-green-100',
      [REDEMPTION_STATUS.CANCELLED]: 'text-slate-700 bg-slate-100',
      [REDEMPTION_STATUS.FAILED]: 'text-red-700 bg-red-100',
    };
    
    return colors[status] || 'text-slate-600 bg-slate-100';
  }

  /**
   * Get estimated delivery date
   */
  static getEstimatedDelivery(request: RedemptionRequest): Date | null {
    if (request.shippedAt) {
      // Standard shipping: 5-7 business days
      const deliveryDate = new Date(request.shippedAt);
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      return deliveryDate;
    }
    
    if (request.status === REDEMPTION_STATUS.APPROVED) {
      // Estimated 2 days to ship + 7 days delivery
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 9);
      return estimatedDate;
    }
    
    return null;
  }

  /**
   * Format shipping address
   */
  static formatShippingAddress(address: RedemptionRequest['shippingAddress']): string {
    const parts = [
      address.name,
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postalCode}`,
    ].filter(Boolean);

    if (address.country && address.country !== 'US') {
      parts.push(address.country);
    }

    return parts.join('\n');
  }

  /**
   * Generate redemption reference number
   */
  static generateReferenceNumber(request: RedemptionRequest): string {
    const prefix = 'RED';
    const timestamp = request.createdAt.getTime().toString(36).toUpperCase();
    const shortId = request.id.substring(0, 8).toUpperCase();
    return `${prefix}-${timestamp}-${shortId}`;
  }

  /**
   * Validate redemption request data
   */
  static validate(request: Partial<RedemptionRequest>): RedemptionRequest {
    return redemptionRequestSchema.parse(request);
  }

  /**
   * Validate create redemption request input
   */
  static validateCreateInput(input: any): CreateRedemptionRequestInput {
    return createRedemptionRequestInputSchema.parse(input);
  }

  /**
   * Generate default values for creation
   */
  static getDefaultValues(): Partial<RedemptionRequest> {
    return {
      allocatedQty: 0,
      status: REDEMPTION_STATUS.PENDING,
      vaultLocation: 'VAULT-MAIN',
      lockExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate redemption statistics
   */
  static calculateSummary(requests: RedemptionRequest[]): RedemptionSummary {
    const totalRequests = requests.length;
    const pendingApproval = requests.filter(r => r.status === REDEMPTION_STATUS.PENDING).length;
    const shipmentStatuses = [REDEMPTION_STATUS.APPROVED, REDEMPTION_STATUS.ALLOCATED] as const;
    const awaitingShipment = requests.filter(r => 
      shipmentStatuses.includes(r.status as typeof shipmentStatuses[number])
    ).length;
    const inTransit = requests.filter(r => r.status === REDEMPTION_STATUS.SHIPPED).length;
    const completed = requests.filter(r => r.status === REDEMPTION_STATUS.DELIVERED).length;

    const totalValue = requests.reduce((sum, request) => {
      return sum + parseFloat(request.estimatedValue);
    }, 0).toFixed(2);

    const completedRequests = requests.filter(r => r.deliveredAt);
    const averageProcessingTime = completedRequests.length > 0
      ? Math.round(
          completedRequests.reduce((sum, request) => {
            return sum + (RedemptionRequestUtils.getProcessingTime(request) || 0);
          }, 0) / completedRequests.length
        )
      : 0;

    return {
      totalRequests,
      pendingApproval,
      awaitingShipment,
      inTransit,
      completed,
      totalValue,
      averageProcessingTime,
    };
  }
}

// SQL table definition (for reference/migration)
export const REDEMPTION_REQUEST_TABLE_SQL = `
CREATE TABLE redemption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  asset_amount DECIMAL(20,8) NOT NULL CHECK (asset_amount > 0),
  vault_sku VARCHAR(50) NOT NULL,
  requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
  allocated_qty INTEGER NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ALLOCATED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED')),
  shipping_address JSONB NOT NULL,
  vault_location VARCHAR(100) NOT NULL,
  estimated_value DECIMAL(10,2) NOT NULL CHECK (estimated_value > 0),
  lock_expires_at TIMESTAMPTZ NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  shipping_carrier VARCHAR(50),
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Business rules
  CHECK ((status != 'APPROVED') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK ((status != 'SHIPPED') OR (shipping_carrier IS NOT NULL AND tracking_number IS NOT NULL AND shipped_at IS NOT NULL)),
  CHECK ((status != 'DELIVERED') OR (delivered_at IS NOT NULL)),
  CHECK ((status != 'FAILED') OR (failure_reason IS NOT NULL))
);

-- Indexes
CREATE INDEX idx_redemption_requests_user_id ON redemption_requests(user_id);
CREATE INDEX idx_redemption_requests_status ON redemption_requests(status);
CREATE INDEX idx_redemption_requests_vault_sku ON redemption_requests(vault_sku);
CREATE INDEX idx_redemption_requests_vault_location ON redemption_requests(vault_location);
CREATE INDEX idx_redemption_requests_created_at ON redemption_requests(created_at);
CREATE INDEX idx_redemption_requests_lock_expires ON redemption_requests(lock_expires_at) WHERE status IN ('PENDING', 'APPROVED');
CREATE INDEX idx_redemption_requests_tracking ON redemption_requests(tracking_number) WHERE tracking_number IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_redemption_requests_user_status_created ON redemption_requests(user_id, status, created_at);
CREATE INDEX idx_redemption_requests_status_created ON redemption_requests(status, created_at);

-- Updated at trigger
CREATE TRIGGER trigger_redemption_requests_updated_at
  BEFORE UPDATE ON redemption_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
`;
