import { Request, Response, NextFunction } from 'express';
import { cache } from '@/cache/redis';
import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Idempotency Metrics Service
 * Tracks X-Idempotency-Key usage for monitoring duplicate requests
 */

export interface IdempotencyStats {
  window5m: {
    present: number;
    dupes: number;
    unique: number;
    sampleKeys: string[];
  };
  window60m: {
    present: number;
    dupes: number;
    unique: number;
    sampleKeys: string[];
  };
  lastUpdated: string;
}

export class IdempotencyMetricsService {
  private static readonly PRESENT_5M_KEY = 'idem:present:5m';
  private static readonly PRESENT_60M_KEY = 'idem:present:60m';
  private static readonly DUPES_5M_KEY = 'idem:dupes:5m';
  private static readonly DUPES_60M_KEY = 'idem:dupes:60m';
  private static readonly KEYS_5M_PREFIX = 'idem:keys:5m';
  private static readonly KEYS_60M_PREFIX = 'idem:keys:60m';
  private static readonly SAMPLES_5M_KEY = 'idem:samples:5m';
  private static readonly SAMPLES_60M_KEY = 'idem:samples:60m';
  
  private static readonly TTL_5M = 300; // 5 minutes
  private static readonly TTL_60M = 3600; // 60 minutes
  
  // In-memory fallback when Redis unavailable
  private static inMemoryMetrics = {
    present5m: 0,
    present60m: 0,
    dupes5m: 0,
    dupes60m: 0,
    keys5m: new Set<string>(),
    keys60m: new Set<string>(),
    samples5m: [] as string[],
    samples60m: [] as string[],
    lastReset: Date.now(),
  };

  /**
   * Middleware factory for tracking idempotency key usage
   */
  static createMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const idempotencyKey = req.headers['x-idempotency-key'] as string;
        
        if (idempotencyKey) {
          await this.trackIdempotencyKey(idempotencyKey);
          res.setHeader('X-Idempotency-Observed', 'present');
          res.setHeader('X-Idempotency-Window', '5m,60m');
        } else {
          res.setHeader('X-Idempotency-Observed', 'absent');
        }
        
        next();
      } catch (error) {
        logWarn('Idempotency metrics tracking failed', {
          error: (error as Error).message,
          path: req.path,
        });
        // Don't block request on metrics failure
        next();
      }
    };
  }

  /**
   * Track idempotency key usage in both time windows
   */
  private static async trackIdempotencyKey(key: string): Promise<void> {
    try {
      if (cache.isConnected()) {
        await this.trackInRedis(key);
      } else {
        this.trackInMemory(key);
      }
    } catch (error) {
      logError('Failed to track idempotency key', {
        error: error as Error,
        key: key.substring(0, 8) + '...', // Truncate for privacy
      });
    }
  }

  /**
   * Track metrics in Redis
   */
  private static async trackInRedis(key: string): Promise<void> {
    const now = Date.now();
    
    // Track in both 5m and 60m windows
    await Promise.all([
      // Increment present counters
      cache.increment(this.PRESENT_5M_KEY),
      cache.increment(this.PRESENT_60M_KEY),
      
      // Set TTLs if keys are new
      cache.expire(this.PRESENT_5M_KEY, this.TTL_5M),
      cache.expire(this.PRESENT_60M_KEY, this.TTL_60M),
      
      // Check for duplicates and track
      this.trackDuplicatesInRedis(key),
      
      // Store sample keys for debugging
      this.storeSampleKey(key, this.SAMPLES_5M_KEY, this.TTL_5M),
      this.storeSampleKey(key, this.SAMPLES_60M_KEY, this.TTL_60M),
    ]);
  }

  /**
   * Check for duplicate keys and increment counters
   */
  private static async trackDuplicatesInRedis(key: string): Promise<void> {
    // Use individual keys to track uniqueness per window
    const key5m = `${this.KEYS_5M_PREFIX}:${key}`;
    const key60m = `${this.KEYS_60M_PREFIX}:${key}`;
    
    const [exists5m, exists60m] = await Promise.all([
      cache.exists(key5m),
      cache.exists(key60m),
    ]);
    
    // Set keys with TTL if they don't exist, increment dupes if they do
    const promises = [];
    
    if (exists5m) {
      promises.push(cache.increment(this.DUPES_5M_KEY));
    } else {
      promises.push(cache.set(key5m, '1', this.TTL_5M));
    }
    
    if (exists60m) {
      promises.push(cache.increment(this.DUPES_60M_KEY));
    } else {
      promises.push(cache.set(key60m, '1', this.TTL_60M));
    }
    
    await Promise.all(promises);
  }

  /**
   * Store sample keys for debugging (keep latest 5)
   */
  private static async storeSampleKey(key: string, listKey: string, ttl: number): Promise<void> {
    try {
      // Simple list storage - keep latest 5 keys
      const existingSamples = await cache.getJson<string[]>(listKey) || [];
      const updatedSamples = [key, ...existingSamples.filter(k => k !== key)].slice(0, 5);
      await cache.setJson(listKey, updatedSamples, ttl);
    } catch (error) {
      // Non-critical - don't fail the request
      logWarn('Failed to store sample key', { error: (error as Error).message });
    }
  }

  /**
   * Track metrics in memory (fallback)
   */
  private static trackInMemory(key: string): void {
    const now = Date.now();
    
    // Reset counters if they're too old (simple TTL simulation)
    if (now - this.inMemoryMetrics.lastReset > this.TTL_5M * 1000) {
      this.inMemoryMetrics.present5m = 0;
      this.inMemoryMetrics.dupes5m = 0;
      this.inMemoryMetrics.keys5m.clear();
      this.inMemoryMetrics.samples5m = [];
    }
    
    if (now - this.inMemoryMetrics.lastReset > this.TTL_60M * 1000) {
      this.inMemoryMetrics.present60m = 0;
      this.inMemoryMetrics.dupes60m = 0;
      this.inMemoryMetrics.keys60m.clear();
      this.inMemoryMetrics.samples60m = [];
      this.inMemoryMetrics.lastReset = now;
    }
    
    // Track present
    this.inMemoryMetrics.present5m++;
    this.inMemoryMetrics.present60m++;
    
    // Track duplicates
    if (this.inMemoryMetrics.keys5m.has(key)) {
      this.inMemoryMetrics.dupes5m++;
    } else {
      this.inMemoryMetrics.keys5m.add(key);
    }
    
    if (this.inMemoryMetrics.keys60m.has(key)) {
      this.inMemoryMetrics.dupes60m++;
    } else {
      this.inMemoryMetrics.keys60m.add(key);
    }
    
    // Store samples (keep latest 5)
    this.inMemoryMetrics.samples5m = [key, ...this.inMemoryMetrics.samples5m.filter(k => k !== key)].slice(0, 5);
    this.inMemoryMetrics.samples60m = [key, ...this.inMemoryMetrics.samples60m.filter(k => k !== key)].slice(0, 5);
  }

  /**
   * Get comprehensive idempotency statistics
   */
  static async getStats(): Promise<IdempotencyStats> {
    try {
      if (cache.isConnected()) {
        return await this.getRedisStats();
      } else {
        return this.getInMemoryStats();
      }
    } catch (error) {
      logError('Failed to get idempotency stats', error as Error);
      return {
        window5m: { present: 0, dupes: 0, unique: 0, sampleKeys: [] },
        window60m: { present: 0, dupes: 0, unique: 0, sampleKeys: [] },
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get stats from Redis
   */
  private static async getRedisStats(): Promise<IdempotencyStats> {
    const [
      present5m,
      present60m,
      dupes5m,
      dupes60m,
      samples5m,
      samples60m
    ] = await Promise.all([
      cache.get(this.PRESENT_5M_KEY).then(v => parseInt(v || '0', 10)),
      cache.get(this.PRESENT_60M_KEY).then(v => parseInt(v || '0', 10)),
      cache.get(this.DUPES_5M_KEY).then(v => parseInt(v || '0', 10)),
      cache.get(this.DUPES_60M_KEY).then(v => parseInt(v || '0', 10)),
      cache.getJson<string[]>(this.SAMPLES_5M_KEY).then(v => v || []),
      cache.getJson<string[]>(this.SAMPLES_60M_KEY).then(v => v || []),
    ]);

    return {
      window5m: {
        present: present5m,
        dupes: dupes5m,
        unique: Math.max(0, present5m - dupes5m),
        sampleKeys: samples5m,
      },
      window60m: {
        present: present60m,
        dupes: dupes60m,
        unique: Math.max(0, present60m - dupes60m),
        sampleKeys: samples60m,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get stats from in-memory fallback
   */
  private static getInMemoryStats(): IdempotencyStats {
    return {
      window5m: {
        present: this.inMemoryMetrics.present5m,
        dupes: this.inMemoryMetrics.dupes5m,
        unique: Math.max(0, this.inMemoryMetrics.present5m - this.inMemoryMetrics.dupes5m),
        sampleKeys: [...this.inMemoryMetrics.samples5m],
      },
      window60m: {
        present: this.inMemoryMetrics.present60m,
        dupes: this.inMemoryMetrics.dupes60m,
        unique: Math.max(0, this.inMemoryMetrics.present60m - this.inMemoryMetrics.dupes60m),
        sampleKeys: [...this.inMemoryMetrics.samples60m],
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  static async resetMetrics(): Promise<void> {
    try {
      if (cache.isConnected()) {
        await Promise.all([
          cache.del(this.PRESENT_5M_KEY),
          cache.del(this.PRESENT_60M_KEY),
          cache.del(this.DUPES_5M_KEY),
          cache.del(this.DUPES_60M_KEY),
          cache.del(this.SAMPLES_5M_KEY),
          cache.del(this.SAMPLES_60M_KEY),
        ]);
      }
      
      // Reset in-memory metrics
      this.inMemoryMetrics = {
        present5m: 0,
        present60m: 0,
        dupes5m: 0,
        dupes60m: 0,
        keys5m: new Set<string>(),
        keys60m: new Set<string>(),
        samples5m: [],
        samples60m: [],
        lastReset: Date.now(),
      };
      
      logInfo('Idempotency metrics reset');
    } catch (error) {
      logError('Failed to reset idempotency metrics', error as Error);
    }
  }
}
