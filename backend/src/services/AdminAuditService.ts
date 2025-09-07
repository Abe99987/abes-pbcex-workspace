export interface AdminAuditEvent {
  timestampIso: string;
  route: string;
  method: string;
  userId: string;
  role: string;
  action: string;
  status: number;
}

/**
 * Simple in-memory ring buffer for admin audit events.
 * Stores only non-PII operational metadata for recent write operations.
 */
class AdminAuditServiceImpl {
  private readonly capacity: number;
  private readonly events: AdminAuditEvent[];
  private nextIndex: number;
  private size: number;

  constructor(capacity: number = 500) {
    this.capacity = capacity;
    this.events = new Array<AdminAuditEvent>(capacity);
    this.nextIndex = 0;
    this.size = 0;
  }

  recordEvent(event: AdminAuditEvent): void {
    this.events[this.nextIndex] = event;
    this.nextIndex = (this.nextIndex + 1) % this.capacity;
    if (this.size < this.capacity) this.size += 1;
  }

  getRecentEvents(limit: number = 50): AdminAuditEvent[] {
    const count = Math.min(limit, this.size);
    const result: AdminAuditEvent[] = [];
    for (let i = 0; i < count; i++) {
      const idx = (this.nextIndex - 1 - i + this.capacity) % this.capacity;
      const evt = this.events[idx];
      if (evt) result.push(evt);
    }
    return result;
  }

  clear(): void {
    this.nextIndex = 0;
    this.size = 0;
  }
}

export const AdminAuditService = new AdminAuditServiceImpl(1000);

export default AdminAuditService;


