import { JMBullionAdapter } from '@/vendors/JMBullionAdapter';
import { DillonGageAdapter } from '@/vendors/DillonGageAdapter';

describe('Vendor Adapters', () => {
  it('JM adapter stubs return lock, fulfill, cancel', async () => {
    const jm = new JMBullionAdapter();
    const lock = await jm.lockPrice('GOLD', 1);
    expect(lock.vendorRef).toMatch(/^JM-/);
    expect(lock.lockExpiry.getTime()).toBeGreaterThan(Date.now());
    const f = await jm.fulfillOrder('order-1');
    expect(f.status).toBe('FULFILLED');
    const c = await jm.cancelOrder('order-1');
    expect(c.status).toBe('CANCELLED');
  });

  it('Dillon adapter stubs return lock, fulfill, cancel', async () => {
    const dg = new DillonGageAdapter();
    const lock = await dg.lockPrice('SILVER', 2);
    expect(lock.vendorRef).toMatch(/^DG-/);
    expect(lock.lockExpiry.getTime()).toBeGreaterThan(Date.now());
    const f = await dg.fulfillOrder('order-2');
    expect(f.status).toBe('FULFILLED');
    const c = await dg.cancelOrder('order-2');
    expect(c.status).toBe('CANCELLED');
  });
});


