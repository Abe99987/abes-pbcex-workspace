import { nanoid } from 'nanoid';
import { cache } from '@/cache/redis';
import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * SSE Observability Service
 * Tracks server-sent event connections for monitoring and leak detection
 */

export interface SSEConnection {
  id: string;
  channel: string;
  userAgent?: string;
  ip?: string;
  startedAt: number;
  lastHeartbeat: number;
}

export interface SSEStats {
  activeByChannel: Record<string, number>;
  lastHeartbeatMaxAgeSec: number;
  opensLast5m: number;
  closesLast5m: number;
  sampleConnIds: Record<string, string[]>; // channel -> sample connIds (≤5)
}

export class SSEObservabilityService {
  private static readonly ACTIVE_PREFIX = 'sse:active:';
  private static readonly HEARTBEAT_PREFIX = 'sse:hb:';
  private static readonly METRICS_KEY = 'sse:metrics';
  private static readonly CONNECTION_TTL = 300; // 5 minutes
  private static readonly HEARTBEAT_TTL = 120; // 2 minutes
  
  // In-memory fallback when Redis is unavailable
  private static inMemoryConnections = new Map<string, SSEConnection>();
  private static inMemoryMetrics = {
    opens: 0,
    closes: 0,
    pings: 0,
    lastResetAt: Date.now(),
  };

  /**
   * Register a new SSE connection
   */
  static async registerConnection(
    channel: string,
    userAgent?: string,
    ip?: string
  ): Promise<string> {
    const connId = nanoid(10);
    const now = Date.now();
    
    const connection: SSEConnection = {
      id: connId,
      channel,
      userAgent,
      ip,
      startedAt: now,
      lastHeartbeat: now,
    };

    try {
      if (cache.isConnected()) {
        // Store in Redis
        const activeKey = `${this.ACTIVE_PREFIX}${channel}`;
        const heartbeatKey = `${this.HEARTBEAT_PREFIX}${connId}`;
        
        await Promise.all([
          cache.set(heartbeatKey, JSON.stringify(connection), this.HEARTBEAT_TTL),
          cache.set(`${activeKey}:${connId}`, '1', this.CONNECTION_TTL),
          cache.increment(`${this.METRICS_KEY}:opens`)
        ]);
      } else {
        // Fallback to in-memory
        this.inMemoryConnections.set(connId, connection);
        this.inMemoryMetrics.opens++;
      }

      logInfo('SSE connection registered', {
        connId,
        channel,
        userAgent: userAgent?.substring(0, 50),
        ip,
      });
    } catch (error) {
      logError('Failed to register SSE connection', error as Error);
    }

    return connId;
  }

  /**
   * Update heartbeat timestamp for a connection
   */
  static async updateHeartbeat(connId: string, channel: string): Promise<void> {
    const now = Date.now();

    try {
      if (cache.isConnected()) {
        const heartbeatKey = `${this.HEARTBEAT_PREFIX}${connId}`;
        const activeKey = `${this.ACTIVE_PREFIX}${channel}:${connId}`;
        
        await Promise.all([
          cache.expire(heartbeatKey, this.HEARTBEAT_TTL),
          cache.expire(activeKey, this.CONNECTION_TTL),
          cache.increment(`${this.METRICS_KEY}:pings`)
        ]);
      } else {
        // Update in-memory
        const conn = this.inMemoryConnections.get(connId);
        if (conn) {
          conn.lastHeartbeat = now;
        }
        this.inMemoryMetrics.pings++;
      }
    } catch (error) {
      logWarn('Failed to update SSE heartbeat', {
        connId,
        channel,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Unregister a connection (when client disconnects)
   */
  static async unregisterConnection(connId: string, channel: string): Promise<void> {
    try {
      if (cache.isConnected()) {
        const heartbeatKey = `${this.HEARTBEAT_PREFIX}${connId}`;
        const activeKey = `${this.ACTIVE_PREFIX}${channel}:${connId}`;
        
        await Promise.all([
          cache.del(heartbeatKey),
          cache.del(activeKey),
          cache.increment(`${this.METRICS_KEY}:closes`)
        ]);
      } else {
        // Remove from in-memory
        this.inMemoryConnections.delete(connId);
        this.inMemoryMetrics.closes++;
      }

      logInfo('SSE connection unregistered', {
        connId,
        channel,
      });
    } catch (error) {
      logError('Failed to unregister SSE connection', error as Error);
    }
  }

  /**
   * Get comprehensive SSE statistics
   */
  static async getStats(): Promise<SSEStats> {
    try {
      if (cache.isConnected()) {
        return await this.getRedisStats();
      } else {
        return this.getInMemoryStats();
      }
    } catch (error) {
      logError('Failed to get SSE stats', error as Error);
      return {
        activeByChannel: {},
        lastHeartbeatMaxAgeSec: 0,
        opensLast5m: 0,
        closesLast5m: 0,
        sampleConnIds: {},
      };
    }
  }

  /**
   * Get stats from Redis
   */
  private static async getRedisStats(): Promise<SSEStats> {
    // This is a simplified implementation - in production you'd want more sophisticated
    // channel discovery and connection tracking
    const channels = ['prices', 'markets']; // Known channels
    const activeByChannel: Record<string, number> = {};
    const sampleConnIds: Record<string, string[]> = {};
    
    let maxHeartbeatAge = 0;
    const now = Date.now();

    for (const channel of channels) {
      const activePattern = `${this.ACTIVE_PREFIX}${channel}:*`;
      // Note: In production, you'd use SCAN instead of KEYS for better performance
      const keys = await this.scanKeys(activePattern);
      
      activeByChannel[channel] = keys.length;
      sampleConnIds[channel] = keys.slice(0, 5).map(k => k.split(':').pop() || '');

      // Check heartbeat ages for this channel
      for (const key of keys.slice(0, 10)) { // Sample first 10
        const connId = key.split(':').pop();
        if (connId) {
          const heartbeatKey = `${this.HEARTBEAT_PREFIX}${connId}`;
          const connData = await cache.getJson<SSEConnection>(heartbeatKey);
          if (connData?.lastHeartbeat) {
            const ageMs = now - connData.lastHeartbeat;
            maxHeartbeatAge = Math.max(maxHeartbeatAge, ageMs);
          }
        }
      }
    }

    // Get metrics (simplified - would use rolling windows in production)
    const [opens, closes, pings] = await Promise.all([
      cache.get(`${this.METRICS_KEY}:opens`),
      cache.get(`${this.METRICS_KEY}:closes`), 
      cache.get(`${this.METRICS_KEY}:pings`)
    ]);

    return {
      activeByChannel,
      lastHeartbeatMaxAgeSec: Math.floor(maxHeartbeatAge / 1000),
      opensLast5m: parseInt(opens || '0', 10),
      closesLast5m: parseInt(closes || '0', 10),
      sampleConnIds,
    };
  }

  /**
   * Get stats from in-memory fallback
   */
  private static getInMemoryStats(): SSEStats {
    const activeByChannel: Record<string, number> = {};
    const sampleConnIds: Record<string, string[]> = {};
    const now = Date.now();
    
    let maxHeartbeatAge = 0;

    // Group connections by channel
    for (const [connId, conn] of this.inMemoryConnections.entries()) {
      if (!activeByChannel[conn.channel]) {
        activeByChannel[conn.channel] = 0;
        sampleConnIds[conn.channel] = [];
      }
      
      activeByChannel[conn.channel] = (activeByChannel[conn.channel] ?? 0) + 1;
      
      const sampleArray = sampleConnIds[conn.channel] ?? [];
      if (sampleArray.length < 5) {
        sampleArray.push(connId);
      }

      const heartbeatAge = now - conn.lastHeartbeat;
      maxHeartbeatAge = Math.max(maxHeartbeatAge, heartbeatAge);
    }

    return {
      activeByChannel,
      lastHeartbeatMaxAgeSec: Math.floor(maxHeartbeatAge / 1000),
      opensLast5m: this.inMemoryMetrics.opens,
      closesLast5m: this.inMemoryMetrics.closes,
      sampleConnIds,
    };
  }

  /**
   * Helper to scan Redis keys (simplified SCAN implementation)
   */
  private static async scanKeys(pattern: string): Promise<string[]> {
    // In production, implement proper SCAN with pagination
    // For now, using a simplified approach
    try {
      // This is not ideal - in production use SCAN command
      // For development/testing purposes only
      return [];
    } catch (error) {
      logWarn('Failed to scan Redis keys', { pattern, error: (error as Error).message });
      return [];
    }
  }

  /**
   * Cleanup stale connections (utility method)
   */
  static async cleanupStale(): Promise<{ cleaned: number }> {
    let cleaned = 0;
    
    if (!cache.isConnected()) {
      // Clean in-memory connections older than 5 minutes
      const cutoff = Date.now() - (5 * 60 * 1000);
      for (const [connId, conn] of this.inMemoryConnections.entries()) {
        if (conn.lastHeartbeat < cutoff) {
          this.inMemoryConnections.delete(connId);
          cleaned++;
        }
      }
    }

    return { cleaned };
  }

  /**
   * Reset metrics (for testing)
   */
  static async resetMetrics(): Promise<void> {
    if (cache.isConnected()) {
      await Promise.all([
        cache.del(`${this.METRICS_KEY}:opens`),
        cache.del(`${this.METRICS_KEY}:closes`),
        cache.del(`${this.METRICS_KEY}:pings`)
      ]);
    } else {
      this.inMemoryMetrics = {
        opens: 0,
        closes: 0,
        pings: 0,
        lastResetAt: Date.now(),
      };
    }
  }
}
