import Redis from 'ioredis';
import { logInfo, logError, logWarn } from '@/utils/logger';

/**
 * Redis cache manager with fallback for development
 */

class RedisManager {
  private static instance: RedisManager;
  private redis: Redis | null = null;
  private isEnabled = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl || redisUrl.includes('[YOUR_UPSTASH_TOKEN]')) {
      logWarn('Redis not configured, caching disabled');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 2000,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        logInfo('Redis connected');
        this.isEnabled = true;
      });

      this.redis.on('error', error => {
        logError('Redis error', error);
        this.isEnabled = false;
      });

      this.redis.on('close', () => {
        logWarn('Redis connection closed');
        this.isEnabled = false;
      });
    } catch (error) {
      logError('Failed to initialize Redis', error as Error);
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }

    try {
      return await this.redis.get(key);
    } catch (error) {
      logError(`Redis GET failed for key: ${key}`, error as Error);
      return null;
    }
  }

  public async set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      logError(`Redis SET failed for key: ${key}`, error as Error);
      return false;
    }
  }

  // Alias for backward compatibility
  public async setex(
    key: string,
    ttlSeconds: number,
    value: string
  ): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  public async getJson<T = unknown>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logError(`Failed to parse JSON for key: ${key}`, error as Error);
      return null;
    }
  }

  public async setJson<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      logError(`Failed to stringify JSON for key: ${key}`, error as Error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logError(`Redis DEL failed for key: ${key}`, error as Error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logError(`Redis EXISTS failed for key: ${key}`, error as Error);
      return false;
    }
  }

  public async increment(key: string, by: number = 1): Promise<number | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }

    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      logError(`Redis INCRBY failed for key: ${key}`, error as Error);
      return null;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logError(`Redis EXPIRE failed for key: ${key}`, error as Error);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.isEnabled;
  }

  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isEnabled = false;
      logInfo('Redis connection closed');
    }
  }

  public async healthCheck(): Promise<{
    status: 'ok' | 'disabled' | 'error';
    details?: string;
  }> {
    if (!this.isEnabled) {
      return { status: 'disabled', details: 'Redis not configured' };
    }

    try {
      await this.redis?.ping();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const cache = RedisManager.getInstance();

// Price cache helpers specifically for the price feed service
export class PriceCache {
  private static readonly PRICE_PREFIX = 'price:';
  private static readonly OPEN_PREFIX = 'price:open24h:';
  private static readonly TTL = 10; // 10 seconds
  private static readonly OPEN_TTL = 24 * 60 * 60; // 24 hours

  public static async getPrice(asset: string): Promise<{
    price: number;
    change24h: number;
    changePct24h: number;
    timestamp: number;
  } | null> {
    const key = `${PriceCache.PRICE_PREFIX}${asset}`;
    return await cache.getJson(key);
  }

  public static async setPrice(
    asset: string,
    price: number,
    change24h: number,
    changePct24h: number
  ): Promise<void> {
    const key = `${PriceCache.PRICE_PREFIX}${asset}`;
    const data = {
      price,
      change24h,
      changePct24h,
      timestamp: Date.now(),
    };

    await cache.setJson(key, data, PriceCache.TTL);
  }

  public static async getOpen24h(asset: string): Promise<number | null> {
    const key = `${PriceCache.OPEN_PREFIX}${asset}`;
    const data = await cache.getJson<{ price: number; timestamp: number }>(key);
    return data?.price || null;
  }

  public static async setOpen24h(asset: string, price: number): Promise<void> {
    const key = `${PriceCache.OPEN_PREFIX}${asset}`;
    const data = {
      price,
      timestamp: Date.now(),
    };

    await cache.setJson(key, data, PriceCache.OPEN_TTL);
  }

  public static async initializeOpen24h(
    asset: string,
    currentPrice: number
  ): Promise<void> {
    const existingOpen = await PriceCache.getOpen24h(asset);
    if (existingOpen === null) {
      await PriceCache.setOpen24h(asset, currentPrice);
    }
  }
}
