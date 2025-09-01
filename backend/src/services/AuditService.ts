import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AuditOperation {
  userId: string;
  operation: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an operation to the audit trail
   */
  static async logOperation(audit: AuditOperation): Promise<void> {
    try {
      const auditId = uuidv4();

      const query = `
        INSERT INTO money_movement_audit (
          id, user_id, operation, resource_type, resource_id, changes, ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;

      await db.query(query, [
        auditId,
        audit.userId,
        audit.operation,
        audit.resourceType,
        audit.resourceId,
        audit.changes ? JSON.stringify(audit.changes) : null,
        audit.ipAddress || null,
        audit.userAgent || null,
      ]);

      logInfo('Audit log created', {
        auditId,
        userId: audit.userId,
        operation: audit.operation,
        resourceType: audit.resourceType,
        resourceId: audit.resourceId,
      });
    } catch (error) {
      logError('Error creating audit log', {
        error: error as Error,
        userId: audit.userId,
        operation: audit.operation,
        resourceType: audit.resourceType,
        resourceId: audit.resourceId,
      });
      // Don't throw - audit failures should not block the main operation
    }
  }

  /**
   * Get audit trail for a user
   */
  static async getUserAuditTrail(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, operation, resource_type, resource_id, changes, ip_address, user_agent, created_at
        FROM money_movement_audit
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(row => ({
        ...row,
        changes: row.changes ? JSON.parse(row.changes) : null,
      }));
    } catch (error) {
      logError('Error getting user audit trail', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Get audit trail for a specific resource
   */
  static async getResourceAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, user_id, operation, changes, ip_address, user_agent, created_at
        FROM money_movement_audit
        WHERE resource_type = $1 AND resource_id = $2
        ORDER BY created_at DESC
        LIMIT $3
      `;

      const result = await db.query(query, [resourceType, resourceId, limit]);

      return result.rows.map(row => ({
        ...row,
        changes: row.changes ? JSON.parse(row.changes) : null,
      }));
    } catch (error) {
      logError('Error getting resource audit trail', {
        error: error as Error,
        resourceType,
        resourceId,
      });
      return [];
    }
  }

  /**
   * Get audit trail by operation type
   */
  static async getOperationAuditTrail(
    operation: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, user_id, resource_type, resource_id, changes, ip_address, user_agent, created_at
        FROM money_movement_audit
        WHERE operation = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [operation, limit, offset]);

      return result.rows.map(row => ({
        ...row,
        changes: row.changes ? JSON.parse(row.changes) : null,
      }));
    } catch (error) {
      logError('Error getting operation audit trail', {
        error: error as Error,
        operation,
      });
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(): Promise<{
    total: number;
    byOperation: Record<string, number>;
    byResourceType: Record<string, number>;
    recentActivity: number;
  }> {
    try {
      const statsQuery = `
        SELECT COUNT(*) as total
        FROM money_movement_audit
      `;

      const operationQuery = `
        SELECT operation, COUNT(*) as count
        FROM money_movement_audit
        GROUP BY operation
        ORDER BY count DESC
      `;

      const resourceQuery = `
        SELECT resource_type, COUNT(*) as count
        FROM money_movement_audit
        GROUP BY resource_type
        ORDER BY count DESC
      `;

      const recentQuery = `
        SELECT COUNT(*) as count
        FROM money_movement_audit
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `;

      const [statsResult, operationResult, resourceResult, recentResult] =
        await Promise.all([
          db.query(statsQuery),
          db.query(operationQuery),
          db.query(resourceQuery),
          db.query(recentQuery),
        ]);

      const byOperation: Record<string, number> = {};
      operationResult.rows.forEach(row => {
        byOperation[row.operation] = parseInt(row.count);
      });

      const byResourceType: Record<string, number> = {};
      resourceResult.rows.forEach(row => {
        byResourceType[row.resource_type] = parseInt(row.count);
      });

      return {
        total: parseInt(statsResult.rows[0].total),
        byOperation,
        byResourceType,
        recentActivity: parseInt(recentResult.rows[0].count),
      };
    } catch (error) {
      logError('Error getting audit stats', error as Error);
      return {
        total: 0,
        byOperation: {},
        byResourceType: {},
        recentActivity: 0,
      };
    }
  }

  /**
   * Clean up old audit logs
   */
  static async cleanupOldAuditLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const query = `
        DELETE FROM money_movement_audit
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      `;

      const result = await db.query(query);
      logInfo('Old audit logs cleaned up', { deletedCount: result.rowCount });
    } catch (error) {
      logError('Error cleaning up old audit logs', error as Error);
    }
  }

  /**
   * Export audit trail for compliance
   */
  static async exportAuditTrail(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<any[]> {
    try {
      let query = `
        SELECT 
          id, user_id, operation, resource_type, resource_id, changes, ip_address, user_agent, created_at
        FROM money_movement_audit
        WHERE created_at >= $1 AND created_at <= $2
      `;

      const params: any[] = [startDate, endDate];

      if (userId) {
        query += ' AND user_id = $3';
        params.push(userId);
      }

      query += ' ORDER BY created_at ASC';

      const result = await db.query(query, params);

      return result.rows.map(row => ({
        ...row,
        changes: row.changes ? JSON.parse(row.changes) : null,
      }));
    } catch (error) {
      logError('Error exporting audit trail', {
        error: error as Error,
        startDate,
        endDate,
        userId,
      });
      return [];
    }
  }
}
