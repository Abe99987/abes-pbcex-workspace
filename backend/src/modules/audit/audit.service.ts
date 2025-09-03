import crypto from 'crypto';
import { logInfo, logError } from '@/utils/logger';
import { adminTerminalConfig } from '@/lib/config/admin-terminal.config';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: {
    userId: string;
    email: string;
    roles: string[];
    ipAddress?: string;
    deviceId?: string;
  };
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  hashPrevious?: string;
  hashCurrent: string;
  sequence: number;
}

export interface HashChainValidation {
  isValid: boolean;
  brokenAt?: number;
  totalEntries: number;
  validatedEntries: number;
  errors: string[];
}

/**
 * Admin Terminal Audit Service
 * Implements append-only audit log with tamper-evident hash chain
 */
export class AuditService {
  private static auditLog: AuditEntry[] = [];
  private static currentSequence = 0;
  private static readonly HASH_ALGORITHM = 'sha256';

  /**
   * Append an audit entry (tamper-evident)
   */
  static async append(
    action: string,
    actor: AuditEntry['actor'],
    resource: AuditEntry['resource'],
    details: Record<string, any> = {},
    outcome: AuditEntry['outcome'] = 'success',
    severity: AuditEntry['severity'] = 'medium'
  ): Promise<string> {
    try {
      const timestamp = new Date();
      const entryId = `audit_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get hash of previous entry
      const lastEntry = AuditService.auditLog[AuditService.auditLog.length - 1];
      const hashPrevious = lastEntry?.hashCurrent;

      // Increment sequence
      AuditService.currentSequence++;

      // Create entry data for hashing
      const entryData = {
        id: entryId,
        timestamp: timestamp.toISOString(),
        action,
        actor: {
          userId: actor.userId,
          email: actor.email,
          roles: actor.roles.sort(), // Sort for consistent hashing
          ipAddress: actor.ipAddress,
          deviceId: actor.deviceId,
        },
        resource,
        details,
        outcome,
        severity,
        hashPrevious,
        sequence: AuditService.currentSequence,
      };

      // Generate hash for this entry
      const hashCurrent = AuditService.generateHash(entryData);

      // Create the complete audit entry
      const auditEntry: AuditEntry = {
        ...entryData,
        timestamp,
        hashCurrent,
      };

      // Append to log (immutable)
      AuditService.auditLog.push(auditEntry);

      logInfo('Audit entry appended', {
        entryId,
        action,
        actor: actor.userId,
        resource: `${resource.type}:${resource.id}`,
        sequence: AuditService.currentSequence,
        hashCurrent: hashCurrent.substring(0, 16), // Log first 16 chars
      });

      return entryId;

    } catch (error) {
      logError('Failed to append audit entry', error as Error);
      throw new Error(`Audit append failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get audit entry by ID
   */
  static async getEntry(id: string): Promise<AuditEntry | null> {
    try {
      const entry = AuditService.auditLog.find(e => e.id === id);
      return entry || null;
    } catch (error) {
      logError('Failed to get audit entry', error as Error);
      return null;
    }
  }

  /**
   * Get audit entries with optional filtering
   */
  static async search(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    fromDate?: Date;
    toDate?: Date;
    outcome?: AuditEntry['outcome'];
    severity?: AuditEntry['severity'];
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditEntry[]> {
    try {
      let results = [...AuditService.auditLog]; // Create copy for filtering

      // Apply filters
      if (filters.userId) {
        results = results.filter(entry => entry.actor.userId === filters.userId);
      }

      if (filters.action) {
        results = results.filter(entry => 
          entry.action.toLowerCase().includes(filters.action!.toLowerCase())
        );
      }

      if (filters.resourceType) {
        results = results.filter(entry => entry.resource.type === filters.resourceType);
      }

      if (filters.resourceId) {
        results = results.filter(entry => entry.resource.id === filters.resourceId);
      }

      if (filters.fromDate) {
        results = results.filter(entry => entry.timestamp >= filters.fromDate!);
      }

      if (filters.toDate) {
        results = results.filter(entry => entry.timestamp <= filters.toDate!);
      }

      if (filters.outcome) {
        results = results.filter(entry => entry.outcome === filters.outcome);
      }

      if (filters.severity) {
        results = results.filter(entry => entry.severity === filters.severity);
      }

      // Sort by sequence (chronological order)
      results.sort((a, b) => a.sequence - b.sequence);

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 100;
      
      const paginatedResults = results.slice(offset, offset + limit);

      logInfo('Audit search completed', {
        totalFound: results.length,
        returned: paginatedResults.length,
        filters: Object.keys(filters).filter(k => filters[k as keyof typeof filters] !== undefined),
      });

      return paginatedResults;

    } catch (error) {
      logError('Failed to search audit entries', error as Error);
      throw new Error(`Audit search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verify hash chain integrity (tamper-evident check)
   */
  static async verifyChain(): Promise<HashChainValidation> {
    try {
      const result: HashChainValidation = {
        isValid: true,
        totalEntries: AuditService.auditLog.length,
        validatedEntries: 0,
        errors: [],
      };

      if (AuditService.auditLog.length === 0) {
        return result;
      }

      // Validate each entry's hash
      for (let i = 0; i < AuditService.auditLog.length; i++) {
        const entry = AuditService.auditLog[i]!; // Assert not undefined
        
        // Recreate entry data for hash verification
        const entryData = {
          id: entry.id,
          timestamp: entry.timestamp.toISOString(),
          action: entry.action,
          actor: {
            userId: entry.actor.userId,
            email: entry.actor.email,
            roles: entry.actor.roles.sort(),
            ipAddress: entry.actor.ipAddress,
            deviceId: entry.actor.deviceId,
          },
          resource: entry.resource,
          details: entry.details,
          outcome: entry.outcome,
          severity: entry.severity,
          hashPrevious: entry.hashPrevious,
          sequence: entry.sequence,
        };

        // Verify the hash
        const expectedHash = AuditService.generateHash(entryData);
        if (expectedHash !== entry.hashCurrent) {
          result.isValid = false;
          result.brokenAt = i;
          result.errors.push(`Hash mismatch at entry ${i} (${entry.id}): expected ${expectedHash.substring(0, 16)}, got ${entry.hashCurrent.substring(0, 16)}`);
          break;
        }

        // Verify chain linkage (except for first entry)
        if (i > 0) {
          const previousEntry = AuditService.auditLog[i - 1]!; // Assert not undefined
          if (entry.hashPrevious !== previousEntry.hashCurrent) {
            result.isValid = false;
            result.brokenAt = i;
            result.errors.push(`Chain broken at entry ${i} (${entry.id}): previous hash mismatch`);
            break;
          }
        }

        // Verify sequence integrity
        if (i === 0 && entry.sequence !== 1) {
          result.isValid = false;
          result.brokenAt = i;
          result.errors.push(`First entry has invalid sequence: ${entry.sequence} (should be 1)`);
          break;
        } else if (i > 0) {
          const previousEntry = AuditService.auditLog[i - 1]!; // Assert not undefined
          if (entry.sequence !== previousEntry.sequence + 1) {
            result.isValid = false;
            result.brokenAt = i;
            result.errors.push(`Sequence break at entry ${i}: expected ${previousEntry.sequence + 1}, got ${entry.sequence}`);
            break;
          }
        }

        result.validatedEntries++;
      }

      logInfo('Audit chain verification completed', {
        isValid: result.isValid,
        totalEntries: result.totalEntries,
        validatedEntries: result.validatedEntries,
        brokenAt: result.brokenAt,
        errorCount: result.errors.length,
      });

      return result;

    } catch (error) {
      logError('Failed to verify audit chain', error as Error);
      return {
        isValid: false,
        totalEntries: AuditService.auditLog.length,
        validatedEntries: 0,
        errors: [`Verification failed: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Get audit statistics
   */
  static getStatistics(): {
    totalEntries: number;
    currentSequence: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    entriesByOutcome: Record<string, number>;
    entriesBySeverity: Record<string, number>;
    entriesByAction: Record<string, number>;
    uniqueActors: number;
  } {
    const stats = {
      totalEntries: AuditService.auditLog.length,
      currentSequence: AuditService.currentSequence,
      oldestEntry: undefined as Date | undefined,
      newestEntry: undefined as Date | undefined,
      entriesByOutcome: {} as Record<string, number>,
      entriesBySeverity: {} as Record<string, number>,
      entriesByAction: {} as Record<string, number>,
      uniqueActors: 0,
    };

    if (AuditService.auditLog.length === 0) {
      return stats;
    }

    // Calculate statistics
    const uniqueActorIds = new Set<string>();
    
    for (const entry of AuditService.auditLog) {
      // Date range
      if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
        stats.oldestEntry = entry.timestamp;
      }
      if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
        stats.newestEntry = entry.timestamp;
      }

      // Count by outcome
      stats.entriesByOutcome[entry.outcome] = (stats.entriesByOutcome[entry.outcome] || 0) + 1;

      // Count by severity
      stats.entriesBySeverity[entry.severity] = (stats.entriesBySeverity[entry.severity] || 0) + 1;

      // Count by action
      stats.entriesByAction[entry.action] = (stats.entriesByAction[entry.action] || 0) + 1;

      // Unique actors
      uniqueActorIds.add(entry.actor.userId);
    }

    stats.uniqueActors = uniqueActorIds.size;

    return stats;
  }

  /**
   * Generate hash for entry data
   */
  private static generateHash(data: any): string {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const secret = adminTerminalConfig.security.auditHashSecret;
    const hmac = crypto.createHmac(AuditService.HASH_ALGORITHM, secret);
    hmac.update(jsonString);
    return hmac.digest('hex');
  }

  /**
   * Clear audit log (DANGEROUS - only for testing)
   */
  static clearLog(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Clear audit log only allowed in test environment');
    }
    AuditService.auditLog.length = 0;
    AuditService.currentSequence = 0;
    logInfo('Audit log cleared (test environment)');
  }

  /**
   * Get raw audit log (read-only)
   */
  static getLog(): readonly AuditEntry[] {
    return Object.freeze([...AuditService.auditLog]);
  }
}
