import { createHash } from 'crypto';

/**
 * Frontend A/B Experimentation Utilities for PBCEx
 * 
 * Features:
 * - Client-side experiment variant assignment
 * - Consistent hashing for deterministic results
 * - Local storage caching for performance
 * - Analytics integration
 * - TypeScript support
 * 
 * Usage:
 * ```typescript
 * const variant = useExperiment('onboarding_form_length', ['multi_step', 'single_page']);
 * const isCompactLayout = isExperimentEnabled('order_form_layout', 'compact');
 * ```
 */

// Experiment configuration interface
export interface ExperimentConfig {
  key: string;
  name: string;
  variants: string[];
  traffic: number[];
  enabled: boolean;
  description?: string;
}

// Experiment assignment result
export interface ExperimentAssignment {
  experimentKey: string;
  variant: string;
  userId: string;
  assignedAt: string;
  bucketHash: string;
  cached: boolean;
}

// Default frontend experiments (should match backend configuration)
const DEFAULT_EXPERIMENTS: ExperimentConfig[] = [
  {
    key: 'onboarding_form_length',
    name: 'Onboarding Form Length Test',
    variants: ['multi_step', 'single_page'],
    traffic: [50, 50],
    enabled: true,
    description: 'Test single-page vs multi-step onboarding flow'
  },
  {
    key: 'order_form_layout',
    name: 'Trading Order Form Layout',
    variants: ['standard', 'compact'],
    traffic: [70, 30],
    enabled: true,
    description: 'Test compact vs standard order form layout'
  },
  {
    key: 'spread_hint_tooltip',
    name: 'Spread Hint Tooltip Display',
    variants: ['show', 'hide'],
    traffic: [50, 50],
    enabled: true,
    description: 'Test showing vs hiding spread information tooltip'
  },
  {
    key: 'price_refresh_frequency',
    name: 'Price Refresh Frequency Test',
    variants: ['fast_5s', 'standard_10s', 'slow_30s'],
    traffic: [20, 60, 20],
    enabled: false,
    description: 'Test different price update frequencies'
  },
  {
    key: 'checkout_flow_steps',
    name: 'Checkout Flow Optimization',
    variants: ['streamlined', 'detailed'],
    traffic: [40, 60],
    enabled: true,
    description: 'Test streamlined vs detailed checkout process'
  }
];

class ExperimentClient {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private cache: Map<string, ExperimentAssignment> = new Map();
  private initialized = false;
  private userId: string | null = null;

  constructor() {
    this.initializeFromLocalConfig();
  }

  /**
   * Initialize with user context and optional remote config
   */
  async initialize(userId: string, remoteConfig?: ExperimentConfig[]): Promise<void> {
    this.userId = userId;

    // Load experiments from config or defaults
    const experiments = remoteConfig || DEFAULT_EXPERIMENTS;
    experiments.forEach(exp => {
      this.experiments.set(exp.key, exp);
    });

    // Load cached assignments from localStorage
    this.loadCachedAssignments();

    this.initialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🧪 ExperimentClient initialized for user ${userId}`);
      console.log(`  📊 ${this.experiments.size} experiments available`);
    }
  }

  /**
   * Get variant assignment for an experiment
   */
  assignVariant(
    experimentKey: string, 
    variants?: string[], 
    traffic?: number[]
  ): string {
    if (!this.initialized || !this.userId) {
      console.warn('ExperimentClient not initialized');
      return variants?.[0] || 'control';
    }

    // Check cache first
    const cacheKey = `${this.userId}:${experimentKey}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached.variant;
    }

    // Get experiment configuration
    const experiment = this.experiments.get(experimentKey);
    const effectiveVariants = variants || experiment?.variants || ['control', 'treatment'];
    const effectiveTraffic = traffic || experiment?.traffic || this.generateEvenTraffic(effectiveVariants.length);

    // Check if experiment is enabled
    if (experiment && !experiment.enabled) {
      return effectiveVariants[0]; // Return control variant
    }

    // Generate consistent hash
    const bucketHash = this.generateBucketHash(this.userId, experimentKey);
    const bucket = this.hashToBucket(bucketHash, 100);

    // Assign variant based on traffic allocation
    let cumulativeTraffic = 0;
    let assignedVariant = effectiveVariants[0];

    for (let i = 0; i < effectiveVariants.length; i++) {
      cumulativeTraffic += effectiveTraffic[i] || 0;
      if (bucket < cumulativeTraffic) {
        assignedVariant = effectiveVariants[i];
        break;
      }
    }

    // Cache the assignment
    const assignment: ExperimentAssignment = {
      experimentKey,
      variant: assignedVariant,
      userId: this.userId,
      assignedAt: new Date().toISOString(),
      bucketHash,
      cached: false
    };

    this.cache.set(cacheKey, assignment);
    this.saveCachedAssignments();

    // Log assignment event (async, don't await)
    this.logExperimentEvent(experimentKey, assignedVariant, 'assignment').catch(
      error => console.warn('Failed to log experiment assignment:', error)
    );

    return assignedVariant;
  }

  /**
   * Check if user is in specific experiment variant
   */
  isEnabled(experimentKey: string, variant?: string): boolean {
    const assignedVariant = this.assignVariant(experimentKey);
    
    if (variant) {
      return assignedVariant === variant;
    }

    // Check if user is not in control
    const experiment = this.experiments.get(experimentKey);
    const controlVariant = experiment?.variants[0] || 'control';
    return assignedVariant !== controlVariant;
  }

  /**
   * Get all assignments for current user
   */
  getAllAssignments(): ExperimentAssignment[] {
    if (!this.userId) return [];

    return Array.from(this.cache.values()).filter(
      assignment => assignment.userId === this.userId
    );
  }

  /**
   * Track experiment view/interaction
   */
  async trackView(experimentKey: string, additionalProperties?: Record<string, any>): Promise<void> {
    const variant = this.assignVariant(experimentKey);
    await this.logExperimentEvent(experimentKey, variant, 'view', additionalProperties);
  }

  /**
   * Track experiment conversion
   */
  async trackConversion(experimentKey: string, conversionType?: string, value?: number): Promise<void> {
    const variant = this.assignVariant(experimentKey);
    await this.logExperimentEvent(experimentKey, variant, 'conversion', {
      conversionType,
      value
    });
  }

  // Private methods

  private initializeFromLocalConfig(): void {
    DEFAULT_EXPERIMENTS.forEach(exp => {
      this.experiments.set(exp.key, exp);
    });
  }

  private loadCachedAssignments(): void {
    try {
      const cached = localStorage.getItem('pbcex_experiments');
      if (cached) {
        const assignments = JSON.parse(cached);
        Object.entries(assignments).forEach(([key, assignment]) => {
          this.cache.set(key, { ...(assignment as ExperimentAssignment), cached: true });
        });
      }
    } catch (error) {
      console.warn('Failed to load cached experiment assignments:', error);
    }
  }

  private saveCachedAssignments(): void {
    try {
      const assignments: Record<string, ExperimentAssignment> = {};
      this.cache.forEach((assignment, key) => {
        assignments[key] = assignment;
      });
      localStorage.setItem('pbcex_experiments', JSON.stringify(assignments));
    } catch (error) {
      console.warn('Failed to save experiment assignments to cache:', error);
    }
  }

  private generateBucketHash(userId: string, experimentKey: string): string {
    const input = `${userId}:${experimentKey}:pbcex-experiments`;
    
    // Use Web Crypto API if available, otherwise use a simple hash function
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      // For production, use Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      
      // Fallback to simple hash for client-side compatibility
      return this.simpleHash(input);
    } else {
      return this.simpleHash(input);
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private hashToBucket(hash: string, buckets: number): number {
    const intValue = parseInt(hash.substring(0, 8), 16);
    return intValue % buckets;
  }

  private generateEvenTraffic(variantCount: number): number[] {
    const traffic = Math.floor(100 / variantCount);
    const remainder = 100 % variantCount;
    
    const allocation = new Array(variantCount).fill(traffic);
    
    // Distribute remainder
    for (let i = 0; i < remainder; i++) {
      allocation[i]++;
    }
    
    return allocation;
  }

  private async logExperimentEvent(
    experimentKey: string, 
    variant: string, 
    eventType: 'assignment' | 'view' | 'conversion',
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    try {
      // In a real implementation, this would call your analytics API
      const event = {
        eventType: `experiment_${eventType}`,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        experimentData: {
          experimentKey,
          variant
        },
        properties: additionalProperties || {}
      };

      // Send to analytics API (implement based on your backend)
      // await fetch('/api/analytics/event', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });

      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Experiment Event:', event);
      }

    } catch (error) {
      console.warn('Failed to log experiment event:', error);
    }
  }
}

// Create singleton instance
const experimentClient = new ExperimentClient();

// Export utility functions
export async function initializeExperiments(userId: string, remoteConfig?: ExperimentConfig[]): Promise<void> {
  await experimentClient.initialize(userId, remoteConfig);
}

export function useExperiment(experimentKey: string, variants?: string[], traffic?: number[]): string {
  return experimentClient.assignVariant(experimentKey, variants, traffic);
}

export function isExperimentEnabled(experimentKey: string, variant?: string): boolean {
  return experimentClient.isEnabled(experimentKey, variant);
}

export function trackExperimentView(experimentKey: string, properties?: Record<string, any>): Promise<void> {
  return experimentClient.trackView(experimentKey, properties);
}

export function trackExperimentConversion(experimentKey: string, conversionType?: string, value?: number): Promise<void> {
  return experimentClient.trackConversion(experimentKey, conversionType, value);
}

export function getAllExperimentAssignments(): ExperimentAssignment[] {
  return experimentClient.getAllAssignments();
}

// React hook for experiment variants
export function useExperimentVariant(experimentKey: string): string {
  // This would typically use React state/context in a real implementation
  return useExperiment(experimentKey);
}

// Utility for CSS classes based on experiment variants
export function experimentClass(experimentKey: string, variantClasses: Record<string, string>): string {
  const variant = useExperiment(experimentKey);
  return variantClasses[variant] || '';
}

// Export the client for advanced usage
export { experimentClient as ExperimentClient };

// Specific experiment utilities for PBCEx UI components

/**
 * Onboarding form experiment utilities
 */
export const OnboardingExperiment = {
  getFormType(): 'multi_step' | 'single_page' {
    return useExperiment('onboarding_form_length') as 'multi_step' | 'single_page';
  },

  isMultiStep(): boolean {
    return this.getFormType() === 'multi_step';
  },

  isSinglePage(): boolean {
    return this.getFormType() === 'single_page';
  },

  trackFormStart(): Promise<void> {
    return trackExperimentView('onboarding_form_length', { action: 'form_start' });
  },

  trackFormComplete(): Promise<void> {
    return trackExperimentConversion('onboarding_form_length', 'registration_complete');
  }
};

/**
 * Trading form experiment utilities
 */
export const TradingExperiment = {
  getLayoutType(): 'standard' | 'compact' {
    return useExperiment('order_form_layout') as 'standard' | 'compact';
  },

  isCompactLayout(): boolean {
    return this.getLayoutType() === 'compact';
  },

  getLayoutClass(): string {
    return experimentClass('order_form_layout', {
      standard: 'order-form-standard',
      compact: 'order-form-compact'
    });
  },

  trackOrderInitiate(): Promise<void> {
    return trackExperimentView('order_form_layout', { action: 'order_initiate' });
  },

  trackOrderComplete(orderValue: number): Promise<void> {
    return trackExperimentConversion('order_form_layout', 'order_complete', orderValue);
  }
};

/**
 * UI tooltip experiment utilities
 */
export const TooltipExperiment = {
  shouldShowSpreadHint(): boolean {
    return useExperiment('spread_hint_tooltip') === 'show';
  },

  trackTooltipView(tooltipType: string): Promise<void> {
    return trackExperimentView('spread_hint_tooltip', { tooltip_type: tooltipType });
  }
};
