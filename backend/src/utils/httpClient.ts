/**
 * HTTP Client Utilities with Timeouts, Retries, and Circuit Breaker
 * Provides consistent configuration for external API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CircuitBreaker, circuitBreakers } from './circuitBreaker';
import { logInfo, logWarn, logError } from './logger';

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  circuitBreaker?: CircuitBreaker;
  serviceName?: string;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  backoffFactor: number;
  maxRetryDelay: number;
}

/**
 * Default configurations for different services
 */
export const HTTP_CLIENT_CONFIGS = {
  FEDEX: {
    timeout: 3000,
    retries: 2,
    retryDelay: 1000,
    circuitBreaker: circuitBreakers.fedex,
    serviceName: 'FedEx'
  },
  TWILIO: {
    timeout: 3000,
    retries: 2,
    retryDelay: 500,
    circuitBreaker: circuitBreakers.twilio,
    serviceName: 'Twilio'
  },
  RESEND: {
    timeout: 3000,
    retries: 2,
    retryDelay: 500,
    circuitBreaker: circuitBreakers.resend,
    serviceName: 'Resend'
  },
  COINGECKO: {
    timeout: 3000,
    retries: 3,
    retryDelay: 200,
    circuitBreaker: circuitBreakers.coingecko,
    serviceName: 'CoinGecko'
  }
} as const;

/**
 * Create configured HTTP client with retries and circuit breaker
 */
export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const {
    baseURL,
    timeout = 3000,
    retries = 2,
    retryDelay = 1000,
    circuitBreaker,
    serviceName = 'External API'
  } = options;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'User-Agent': 'PBCEx/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor for logging and correlation IDs
  client.interceptors.request.use(
    (config) => {
      const correlationId = Math.random().toString(36).substr(2, 9);
      config.metadata = { 
        correlationId, 
        startTime: Date.now(),
        serviceName: serviceName 
      };

      logInfo(`${serviceName} HTTP request`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        correlationId
      });

      return config;
    },
    (error) => {
      logError(`${serviceName} request setup error`, error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and retry logic
  client.interceptors.response.use(
    (response) => {
      const metadata = response.config.metadata || {};
      const { correlationId, startTime, serviceName: service } = metadata;
      const duration = startTime ? Date.now() - startTime : 0;

      logInfo(`${service} HTTP response`, {
        status: response.status,
        correlationId,
        duration
      });

      return response;
    },
    async (error) => {
      const config = error.config;
      const { correlationId, startTime, serviceName: service } = config?.metadata || {};
      const duration = startTime ? Date.now() - startTime : 0;

      logError(`${service} HTTP error`, {
        status: error.response?.status,
        message: error.message,
        correlationId,
        duration
      });

      // Retry logic with exponential backoff
      if (shouldRetry(error, config, retries)) {
        const retryCount = (config.__retryCount || 0) + 1;
        config.__retryCount = retryCount;

        const delay = calculateRetryDelay(retryCount, retryDelay);
        
        logWarn(`${service} retrying request`, {
          attempt: retryCount,
          maxRetries: retries,
          delay,
          correlationId
        });

        await sleep(delay);
        return client.request(config);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Execute HTTP request with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  circuitBreaker: CircuitBreaker | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (!circuitBreaker) {
    return fn();
  }

  return circuitBreaker.execute(fn);
}

/**
 * Determine if request should be retried
 */
function shouldRetry(error: any, config: any, maxRetries: number): boolean {
  if (!config || (config.__retryCount || 0) >= maxRetries) {
    return false;
  }

  // Retry on network errors or 5xx responses
  const isNetworkError = !error.response;
  const isRetryableStatus = error.response?.status >= 500;
  const isTimeout = error.code === 'ECONNABORTED';

  return isNetworkError || isRetryableStatus || isTimeout;
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
function calculateRetryDelay(retryCount: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  const maxDelay = 10000; // Cap at 10 seconds
  
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pre-configured HTTP clients for different services
 */
export const httpClients = {
  fedex: createHttpClient(HTTP_CLIENT_CONFIGS.FEDEX),
  twilio: createHttpClient(HTTP_CLIENT_CONFIGS.TWILIO),
  resend: createHttpClient(HTTP_CLIENT_CONFIGS.RESEND),
  coingecko: createHttpClient(HTTP_CLIENT_CONFIGS.COINGECKO)
};

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      correlationId: string;
      startTime: number;
      serviceName?: string;
    };
    __retryCount?: number;
  }
}
