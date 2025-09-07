export interface LockPriceResult {
  vendorRef: string;
  lockExpiry: Date;
}

export interface FulfillResult {
  status: 'FULFILLED';
  vendorRef?: string;
}

export interface CancelResult {
  status: 'CANCELLED';
}

export interface IVendorAdapter {
  lockPrice(metal: string, qty: number): Promise<LockPriceResult>;
  fulfillOrder(orderId: string): Promise<FulfillResult>;
  cancelOrder(orderId: string): Promise<CancelResult>;
}


