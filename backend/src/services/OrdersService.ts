import { v4 as uuidv4 } from 'uuid';
import type { IVendorAdapter } from '@/vendors/IVendorAdapter';
import { JMBullionAdapter } from '@/vendors/JMBullionAdapter';

export type OrderState =
  | 'CREATED'
  | 'PRICE_LOCKED'
  | 'PAID'
  | 'CANCELLED'
  | 'FULFILLED';

export interface OrderRecord {
  id: string;
  metal: string;
  qty: number;
  state: OrderState;
  lockExpiry: Date | null;
  vendorRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderResult {
  order_id: string;
  metal: string;
  qty: number;
  state: OrderState;
  lock_expiry: string | null;
  vendor_ref: string | null;
}

/**
 * Simple in-memory OrdersService for Phase-1.
 * Provides creation with immediate PRICE_LOCKED state and 10-minute expiry.
 */
class OrdersServiceImpl {
  private readonly ordersById: Map<string, OrderRecord> = new Map();
  private vendor: IVendorAdapter = new JMBullionAdapter();

  async createOrder(params: { metal: string; qty: number }): Promise<CreateOrderResult> {
    const now = new Date();
    const id = uuidv4();
    const locked = await this.vendor.lockPrice(params.metal, params.qty);

    const record: OrderRecord = {
      id,
      metal: params.metal,
      qty: params.qty,
      state: 'PRICE_LOCKED',
      lockExpiry: locked.lockExpiry,
      vendorRef: locked.vendorRef,
      createdAt: now,
      updatedAt: now,
    };

    this.ordersById.set(id, record);

    return {
      order_id: id,
      metal: record.metal,
      qty: record.qty,
      state: record.state,
      lock_expiry: record.lockExpiry?.toISOString() ?? null,
      vendor_ref: record.vendorRef,
    };
  }

  /** For tests */
  clearStore(): void {
    this.ordersById.clear();
  }

  findById(id: string): OrderRecord | undefined {
    return this.ordersById.get(id);
  }

  relockOrder(
    id: string
  ): { ok: true; result: CreateOrderResult } | { ok: false; reason: string } {
    const record = this.ordersById.get(id);
    if (!record) return { ok: false, reason: 'NOT_FOUND' };

    const now = new Date();
    if (record.state === 'CANCELLED' || record.state === 'FULFILLED' || record.state === 'PAID') {
      return { ok: false, reason: 'INVALID_STATE' };
    }
    if (record.lockExpiry && record.lockExpiry.getTime() > now.getTime()) {
      return { ok: false, reason: 'NOT_EXPIRED' };
    }

    record.lockExpiry = new Date(now.getTime() + 10 * 60 * 1000);
    record.state = 'PRICE_LOCKED';
    record.updatedAt = now;
    this.ordersById.set(id, record);

    return {
      ok: true,
      result: {
        order_id: record.id,
        metal: record.metal,
        qty: record.qty,
        state: record.state,
        lock_expiry: record.lockExpiry?.toISOString() ?? null,
        vendor_ref: record.vendorRef,
      },
    };
  }

  cancelOrder(
    id: string
  ): { ok: true; result: CreateOrderResult } | { ok: false; reason: string } {
    const record = this.ordersById.get(id);
    if (!record) return { ok: false, reason: 'NOT_FOUND' };

    if (record.state === 'PAID' || record.state === 'FULFILLED') {
      return { ok: false, reason: 'ALREADY_FINALIZED' };
    }

    record.state = 'CANCELLED';
    record.updatedAt = new Date();
    this.ordersById.set(id, record);

    return {
      ok: true,
      result: {
        order_id: record.id,
        metal: record.metal,
        qty: record.qty,
        state: record.state,
        lock_expiry: record.lockExpiry?.toISOString() ?? null,
        vendor_ref: record.vendorRef,
      },
    };
  }

  /** Test-only helper to force expiry */
  expireLockForTest(id: string): void {
    const record = this.ordersById.get(id);
    if (record) {
      record.lockExpiry = new Date(Date.now() - 1000);
      this.ordersById.set(id, record);
    }
  }
}

export const OrdersService = new OrdersServiceImpl();
export default OrdersService;

