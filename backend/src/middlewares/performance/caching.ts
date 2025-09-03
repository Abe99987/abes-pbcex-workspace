import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logInfo } from '@/utils/logger';

/**
 * Admin Terminal Caching Middleware
 * Simple in-memory cache for admin endpoint responses
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  contentType?: string;
}

class AdminCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 1000; // Max cache entries

  private generateKey(req: Request): string {
    const keyData = {
      method: req.method,
      path: req.path,
      query: req.query,
      userId: req.user?.id,
      roles: req.user?.roles || [req.user?.role]
    };
    
    return createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  set(key: string, data: any, ttl: number, contentType?: string): void {
    // Simple LRU - remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      contentType
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate entries matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    };
  }
}

const adminCache = new AdminCache();

/**
 * Cache middleware factory
 * Creates caching middleware with specified TTL
 */
export function cacheResponse(ttlSeconds: number = 300) { // 5 minutes default
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = adminCache['generateKey'](req);
    const cached = adminCache.get(cacheKey);

    if (cached) {
      logInfo('Cache hit', { 
        path: req.path, 
        userId: req.user?.id,
        age: Date.now() - cached.timestamp
      });

      if (cached.contentType) {
        res.set('Content-Type', cached.contentType);
      }
      
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Age', String(Math.floor((Date.now() - cached.timestamp) / 1000)));
      
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        adminCache.set(
          cacheKey, 
          data, 
          ttlSeconds * 1000,
          res.get('Content-Type')
        );
        
        logInfo('Response cached', { 
          path: req.path, 
          userId: req.user?.id,
          ttl: ttlSeconds
        });
      }

      res.set('X-Cache', 'MISS');
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Short-term cache for frequently accessed data (1 minute)
 */
export const shortCache = cacheResponse(60);

/**
 * Medium-term cache for stable data (5 minutes)  
 */
export const mediumCache = cacheResponse(300);

/**
 * Long-term cache for static data (15 minutes)
 */
export const longCache = cacheResponse(900);

/**
 * Cache invalidation middleware
 * Clears cache entries for write operations
 */
export function invalidateCache(pattern?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Invalidate cache after successful write operations
    const originalSend = res.send;
    
    res.send = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const invalidationPattern = pattern || req.path.split('/')[3]; // Use route segment
        adminCache.invalidate(invalidationPattern);
        
        logInfo('Cache invalidated', { 
          pattern: invalidationPattern,
          method: req.method,
          path: req.path,
          userId: req.user?.id
        });
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Cache statistics endpoint helper
 */
export function getCacheStats() {
  return adminCache.getStats();
}

/**
 * Manual cache control
 */
export const CacheControl = {
  get: (key: string) => adminCache.get(key),
  set: (key: string, data: any, ttl: number) => adminCache.set(key, data, ttl),
  invalidate: (pattern?: string) => adminCache.invalidate(pattern),
  stats: () => adminCache.getStats()
};
