import { IVendorAdapter, LockPriceResult, FulfillResult, CancelResult } from './IVendorAdapter';

export class JMBullionAdapter implements IVendorAdapter {
  async lockPrice(metal: string, qty: number): Promise<LockPriceResult> {
    return {
      vendorRef: `JM-${Math.random().toString(36).slice(2, 10)}`,
      lockExpiry: new Date(Date.now() + 10 * 60 * 1000),
    };
  }

  async fulfillOrder(orderId: string): Promise<FulfillResult> {
    return { status: 'FULFILLED', vendorRef: `JM-F-${orderId.slice(0, 8)}` };
  }

  async cancelOrder(orderId: string): Promise<CancelResult> {
    return { status: 'CANCELLED' };
  }
}

export default JMBullionAdapter;


