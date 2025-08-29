import { z } from 'zod';
import { ORDER_STATUS, PRODUCT_CATEGORIES } from '@/utils/constants';

/**
 * Order model for PBCEx shop/fulfillment system
 * Handles physical precious metals orders
 */

export interface Order {
  id: string;
  userId: string;
  productCode: string;
  productName: string;
  productCategory: typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES];
  metal: 'AU' | 'AG' | 'PT' | 'PD' | 'CU';
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  lockedPrice: string;
  lockExpiresAt: Date;
  status: typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
  paymentMethod: 'BALANCE' | 'STRIPE_CARD';
  paymentReference?: string;
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
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shipping: {
    carrier: 'FEDEX' | 'UPS' | 'USPS';
    service: 'STANDARD' | 'EXPEDITED' | 'OVERNIGHT';
    cost: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  specialInstructions?: string;
  fulfillmentProvider: 'JM_BULLION' | 'DILLON_GAGE';
  providerOrderId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  userId: string;
  productCode: string;
  quantity: number;
  lockedPrice: string;
  lockExpiresAt: Date;
  paymentMethod: 'BALANCE' | 'STRIPE_CARD';
  shippingAddress: Order['shippingAddress'];
  billingAddress?: Order['billingAddress'];
  specialInstructions?: string;
}

// Order utility functions
export class OrderUtils {
  static isLockValid(order: Order): boolean {
    return new Date() < order.lockExpiresAt && order.status === ORDER_STATUS.QUOTE_LOCKED;
  }

  static calculateTotal(unitPrice: string, quantity: number, shippingCost: string = '0'): string {
    const unit = parseFloat(unitPrice);
    const shipping = parseFloat(shippingCost);
    return ((unit * quantity) + shipping).toFixed(2);
  }

  static canCancel(order: Order): boolean {
    return [ORDER_STATUS.QUOTE_LOCKED, ORDER_STATUS.PAYMENT_PENDING].includes(order.status);
  }

  static requiresPayment(order: Order): boolean {
    return [ORDER_STATUS.QUOTE_LOCKED, ORDER_STATUS.PAYMENT_PENDING].includes(order.status);
  }

  static isShippable(order: Order): boolean {
    return order.status === ORDER_STATUS.PAYMENT_CONFIRMED;
  }
}

export const ORDER_TABLE_SQL = `
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_category VARCHAR(20) NOT NULL CHECK (product_category IN ('COINS', 'BARS', 'ROUNDS', 'JEWELRY')),
  metal VARCHAR(2) NOT NULL CHECK (metal IN ('AU', 'AG', 'PT', 'PD', 'CU')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
  locked_price DECIMAL(10,2) NOT NULL CHECK (locked_price > 0),
  lock_expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUOTE_LOCKED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('BALANCE', 'STRIPE_CARD')),
  payment_reference VARCHAR(100),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  shipping JSONB NOT NULL,
  special_instructions TEXT,
  fulfillment_provider VARCHAR(20) NOT NULL CHECK (fulfillment_provider IN ('JM_BULLION', 'DILLON_GAGE')),
  provider_order_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_metal ON orders(metal);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_lock_expires ON orders(lock_expires_at) WHERE status = 'QUOTE_LOCKED';
`;
