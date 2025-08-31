/**
 * Feature Flags / Experiments Configuration
 * Config-driven feature toggles for safe rollouts and A/B testing
 */

export interface ExperimentConfig {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  audiences?: string[];
  description?: string;
}

export interface ExperimentDefinition {
  name: string;
  description: string;
  defaultEnabled: boolean;
  validValues?: string[];
}

/**
 * Minimal feature flags implementation
 * Reads from EXPERIMENTS_JSON environment variable
 */
export class FeatureFlags {
  private config: ExperimentConfig[];
  private static instance: FeatureFlags | null = null;

  constructor(configJson?: string) {
    try {
      this.config = configJson ? JSON.parse(configJson) : [];
    } catch (error) {
      console.warn('Failed to parse EXPERIMENTS_JSON, using empty config:', error);
      this.config = [];
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(configJson?: string): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags(configJson);
    }
    return FeatureFlags.instance;
  }

  /**
   * Check if experiment/flag is enabled
   */
  isEnabled(flagName: string, userId?: string): boolean {
    const experiment = this.config.find(e => e.name === flagName);
    
    if (!experiment) {
      // Return default for known experiments, false for unknown
      const definition = EXPERIMENT_DEFINITIONS.find(d => d.name === flagName);
      return definition?.defaultEnabled ?? false;
    }

    if (!experiment.enabled) {
      return false;
    }

    // Simple rollout percentage (could be enhanced with consistent hashing)
    if (experiment.rolloutPercentage !== undefined) {
      const hash = userId ? simpleHash(userId) : Math.random();
      return (hash * 100) < experiment.rolloutPercentage;
    }

    // Audience targeting (if specified)
    if (experiment.audiences && userId) {
      return experiment.audiences.includes(userId);
    }

    return experiment.enabled;
  }

  /**
   * Get experiment value (for multi-value experiments)
   */
  getValue(flagName: string, defaultValue: string = 'default', userId?: string): string {
    if (!this.isEnabled(flagName, userId)) {
      return defaultValue;
    }

    const experiment = this.config.find(e => e.name === flagName);
    return (experiment as any)?.value || defaultValue;
  }

  /**
   * Get all active experiments for debugging
   */
  getActiveExperiments(): string[] {
    return this.config
      .filter(e => e.enabled)
      .map(e => e.name);
  }

  /**
   * Reset singleton (for testing)
   */
  static reset(): void {
    FeatureFlags.instance = null;
  }
}

/**
 * Simple hash function for consistent rollouts
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / Math.pow(2, 31);
}

/**
 * Experiment definitions with defaults
 * All experiments default to OFF for safety
 */
export const EXPERIMENT_DEFINITIONS: ExperimentDefinition[] = [
  {
    name: 'price_cache_strategy_redis_vs_memory',
    description: 'Test Redis vs in-memory caching for price data',
    defaultEnabled: false,
    validValues: ['redis', 'memory']
  },
  {
    name: 'bundle_splitting_route_based',
    description: 'Enable route-based code splitting for frontend bundle',
    defaultEnabled: false
  },
  {
    name: 'fedex_integration_mode',
    description: 'FedEx integration mode (sandbox/production/mock)',
    defaultEnabled: false,
    validValues: ['sandbox', 'production', 'mock']
  },
  {
    name: 'email_template_react_vs_handlebars',
    description: 'Email template engine selection',
    defaultEnabled: false,
    validValues: ['react', 'handlebars']
  },
  {
    name: 'circuit_breaker_enabled',
    description: 'Enable circuit breaker pattern for external APIs',
    defaultEnabled: false
  },
  {
    name: 'advanced_logging_enabled',
    description: 'Enable detailed structured logging',
    defaultEnabled: false
  }
];

/**
 * Helper function to get feature flags instance from environment
 */
export function getFeatureFlags(): FeatureFlags {
  return FeatureFlags.getInstance(process.env.EXPERIMENTS_JSON);
}

/**
 * Convenience helper functions
 */
export function isExperimentEnabled(flagName: string, userId?: string): boolean {
  return getFeatureFlags().isEnabled(flagName, userId);
}

export function getExperimentValue(flagName: string, defaultValue: string = 'default', userId?: string): string {
  return getFeatureFlags().getValue(flagName, defaultValue, userId);
}
