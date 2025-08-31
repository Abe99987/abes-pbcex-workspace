/**
 * Simple Circuit Breaker Implementation
 * Protects against cascade failures when external services are down
 */

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before trying to close circuit
  monitoringPeriod: number; // Time window for failure tracking
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
      // Try to transition to half-open
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure statistics
   */
  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }

  /**
   * Reset circuit breaker (for testing or manual intervention)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }
}

/**
 * Default circuit breaker configurations for different services
 */
export const CIRCUIT_BREAKER_CONFIGS = {
  FEDEX: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  },
  TWILIO: {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    monitoringPeriod: 180000 // 3 minutes
  },
  RESEND: {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    monitoringPeriod: 180000 // 3 minutes
  },
  COINGECKO: {
    failureThreshold: 5,
    resetTimeout: 15000, // 15 seconds (price feeds are critical)
    monitoringPeriod: 60000 // 1 minute
  }
} as const;

/**
 * Circuit breaker instances for different services
 */
export const circuitBreakers = {
  fedex: new CircuitBreaker(CIRCUIT_BREAKER_CONFIGS.FEDEX),
  twilio: new CircuitBreaker(CIRCUIT_BREAKER_CONFIGS.TWILIO),
  resend: new CircuitBreaker(CIRCUIT_BREAKER_CONFIGS.RESEND),
  coingecko: new CircuitBreaker(CIRCUIT_BREAKER_CONFIGS.COINGECKO)
};
