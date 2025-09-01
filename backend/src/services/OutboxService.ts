import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, any>;
}

export class OutboxService {
  /**
   * Emit a domain event to the outbox
   */
  static async emitEvent(
    eventType: string,
    payload: Record<string, any>,
    aggregateId?: string,
    aggregateType?: string
  ): Promise<void> {
    try {
      const eventId = uuidv4();
      const event: DomainEvent = {
        eventType,
        aggregateId: aggregateId || payload.id || eventId,
        aggregateType: aggregateType || this.inferAggregateType(eventType),
        payload,
      };

      const query = `
        INSERT INTO outbox_events (
          id, event_type, aggregate_id, aggregate_type, payload, delivered, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;

      await db.query(query, [
        eventId,
        event.eventType,
        event.aggregateId,
        event.aggregateType,
        JSON.stringify(event.payload),
        false,
      ]);

      logInfo('Domain event emitted', {
        eventId,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
      });
    } catch (error) {
      logError('Error emitting domain event', {
        error: error as Error,
        eventType,
        aggregateId,
        aggregateType,
      });
      // Don't throw - events should not block the main operation
    }
  }

  /**
   * Get undelivered events
   */
  static async getUndeliveredEvents(limit: number = 100): Promise<any[]> {
    try {
      const query = `
        SELECT id, event_type, aggregate_id, aggregate_type, payload, created_at
        FROM outbox_events
        WHERE delivered = false
        ORDER BY created_at ASC
        LIMIT $1
      `;

      const result = await db.query(query, [limit]);
      return result.rows.map(row => ({
        ...row,
        payload:
          typeof row.payload === 'string'
            ? JSON.parse(row.payload)
            : row.payload,
      }));
    } catch (error) {
      logError('Error getting undelivered events', error as Error);
      return [];
    }
  }

  /**
   * Mark event as delivered
   */
  static async markAsDelivered(eventId: string): Promise<void> {
    try {
      const query = `
        UPDATE outbox_events
        SET delivered = true, delivered_at = NOW()
        WHERE id = $1
      `;

      await db.query(query, [eventId]);
      logInfo('Event marked as delivered', { eventId });
    } catch (error) {
      logError('Error marking event as delivered', {
        error: error as Error,
        eventId,
      });
    }
  }

  /**
   * Clean up old delivered events
   */
  static async cleanupOldEvents(daysToKeep: number = 30): Promise<void> {
    try {
      const query = `
        DELETE FROM outbox_events
        WHERE delivered = true
        AND delivered_at < NOW() - INTERVAL '${daysToKeep} days'
      `;

      const result = await db.query(query);
      logInfo('Old events cleaned up', { deletedCount: result.rowCount });
    } catch (error) {
      logError('Error cleaning up old events', error as Error);
    }
  }

  /**
   * Infer aggregate type from event type
   */
  private static inferAggregateType(eventType: string): string {
    const parts = eventType.split('.');
    if (parts.length >= 2) {
      return parts[1] || ''; // e.g., "transfer.internal.created" -> "internal"
    }
    return 'unknown';
  }

  /**
   * Get event statistics
   */
  static async getEventStats(): Promise<{
    total: number;
    delivered: number;
    undelivered: number;
    byType: Record<string, number>;
  }> {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN delivered = true THEN 1 END) as delivered,
          COUNT(CASE WHEN delivered = false THEN 1 END) as undelivered
        FROM outbox_events
      `;

      const typeQuery = `
        SELECT event_type, COUNT(*) as count
        FROM outbox_events
        GROUP BY event_type
        ORDER BY count DESC
      `;

      const [statsResult, typeResult] = await Promise.all([
        db.query(statsQuery),
        db.query(typeQuery),
      ]);

      const stats = statsResult.rows[0];
      const byType: Record<string, number> = {};

      typeResult.rows.forEach(row => {
        byType[row.event_type] = parseInt(row.count);
      });

      return {
        total: parseInt(stats.total),
        delivered: parseInt(stats.delivered),
        undelivered: parseInt(stats.undelivered),
        byType,
      };
    } catch (error) {
      logError('Error getting event stats', error as Error);
      return {
        total: 0,
        delivered: 0,
        undelivered: 0,
        byType: {},
      };
    }
  }
}
