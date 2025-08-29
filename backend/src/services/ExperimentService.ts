import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../config/env';

/**
 * A/B Experimentation Service for PBCEx
 * 
 * Features:
 * - Hash-based consistent variant assignment
 * - Traffic allocation control
 * - Feature flag integration
 * - Non-PII experiment tracking
 * - Multi-variant support
 * 
 * Usage:
 * ```typescript
 * const variant = ExperimentService.assignVariant(
 *   userId, 
 *   'onboarding_form_length', 
 *   ['multi_step', 'single_page'], 
 *   [50, 50]
 * );
 * ```
 */

// Experiment configuration schema
const ExperimentConfigSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  variants: z.array(z.string()).min(2),
  traffic: z.array(z.number()).optional(), // Traffic allocation percentages
  enabled: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.object({
    roles: z.array(z.string()).optional(),
    newUsersOnly: z.boolean().optional(),
    platforms: z.array(z.string()).optional()
  }).optional()
});

export type ExperimentConfig = z.infer<typeof ExperimentConfigSchema>;

// Experiment assignment result
export interface ExperimentAssignment {
  experimentKey: string;
  variant: string;
  userId: string;
  assignedAt: Date;
  bucketHash: string;
}

// Default experiments configuration
const DEFAULT_EXPERIMENTS: ExperimentConfig[] = [
  {
    key: 'onboarding_form_length',
    name: 'Onboarding Form Length Test',
    description: 'Test single-page vs multi-step onboarding flow',
    variants: ['multi_step', 'single_page'],
    traffic: [50, 50],
    enabled: true,
    targetAudience: {
      newUsersOnly: true
    }
  },
  {
    key: 'order_form_layout',
    name: 'Trading Order Form Layout',
    description: 'Test compact vs standard order form layout',
    variants: ['standard', 'compact'],
    traffic: [70, 30], // Conservative rollout of compact design
    enabled: true,
    targetAudience: {
      roles: ['USER'] // Exclude admin users from this test
    }
  },
  {
    key: 'spread_hint_tooltip',
    name: 'Spread Hint Tooltip Display',
    description: 'Test showing vs hiding spread information tooltip',
    variants: ['show', 'hide'],
    traffic: [50, 50],
    enabled: true
  },
  {
    key: 'price_refresh_frequency',
    name: 'Price Refresh Frequency Test',
    description: 'Test different price update frequencies',
    variants: ['fast_5s', 'standard_10s', 'slow_30s'],
    traffic: [20, 60, 20],
    enabled: false // Disabled by default - requires careful monitoring
  },
  {
    key: 'checkout_flow_steps',
    name: 'Checkout Flow Optimization',
    description: 'Test streamlined vs detailed checkout process',
    variants: ['streamlined', 'detailed'],
    traffic: [40, 60], // Conservative test of streamlined flow
    enabled: true
  }
];

export class ExperimentService {
  private static experiments: Map<string, ExperimentConfig> = new Map();
  private static initialized = false;

  /**
   * Initialize the experiment service with configuration
   */
  static initialize(experimentsConfig?: ExperimentConfig[]): void {
    if (this.initialized) return;

    // Load experiments from environment or use defaults
    const config = this.loadExperimentsFromEnv() || experimentsConfig || DEFAULT_EXPERIMENTS;
    
    // Validate and store experiments
    config.forEach(experiment => {
      try {
        const validated = ExperimentConfigSchema.parse(experiment);
        this.experiments.set(validated.key, validated);
      } catch (error) {
        console.warn(`⚠️  Invalid experiment configuration for ${experiment.key}:`, error);
      }
    });

    this.initialized = true;
    
    if (env.NODE_ENV === 'development') {
      console.log(`🧪 ExperimentService initialized with ${this.experiments.size} experiments`);
      this.experiments.forEach((exp, key) => {
        console.log(`  📊 ${key}: ${exp.variants.join(' vs ')} (${exp.enabled ? 'enabled' : 'disabled'})`);
      });
    }
  }

  /**
   * Assign a variant to a user for a specific experiment
   */
  static assignVariant(
    userId: string,
    experimentKey: string,
    variants?: string[],
    traffic?: number[]
  ): string {
    this.ensureInitialized();

    // Get experiment configuration
    const experiment = this.experiments.get(experimentKey);
    
    // Use provided variants or fall back to configured experiment
    const effectiveVariants = variants || experiment?.variants || ['control', 'treatment'];
    const effectiveTraffic = traffic || experiment?.traffic || this.generateEvenTraffic(effectiveVariants.length);

    // Check if experiment is enabled
    if (experiment && !experiment.enabled) {
      return effectiveVariants[0]; // Return control variant if disabled
    }

    // Check audience targeting
    if (experiment?.targetAudience && !this.isUserInTargetAudience(userId, experiment.targetAudience)) {
      return effectiveVariants[0]; // Return control for users not in target audience
    }

    // Generate consistent hash for user + experiment
    const bucketHash = this.generateBucketHash(userId, experimentKey);
    const bucket = this.hashToBucket(bucketHash, 100);

    // Determine variant based on traffic allocation
    let cumulativeTraffic = 0;
    for (let i = 0; i < effectiveVariants.length; i++) {
      cumulativeTraffic += effectiveTraffic[i] || 0;
      if (bucket < cumulativeTraffic) {
        return effectiveVariants[i];
      }
    }

    // Fallback to control variant
    return effectiveVariants[0];
  }

  /**
   * Check if a user is assigned to a specific experiment variant
   */
  static isEnabled(userId: string, experimentKey: string, variant?: string): boolean {
    const assignedVariant = this.assignVariant(userId, experimentKey);
    
    if (variant) {
      return assignedVariant === variant;
    }

    // If no specific variant requested, check if user is not in control
    const experiment = this.experiments.get(experimentKey);
    const controlVariant = experiment?.variants[0] || 'control';
    
    return assignedVariant !== controlVariant;
  }

  /**
   * Get experiment assignment details for a user
   */
  static getAssignment(userId: string, experimentKey: string): ExperimentAssignment | null {
    this.ensureInitialized();

    const experiment = this.experiments.get(experimentKey);
    if (!experiment) return null;

    const variant = this.assignVariant(userId, experimentKey);
    const bucketHash = this.generateBucketHash(userId, experimentKey);

    return {
      experimentKey,
      variant,
      userId,
      assignedAt: new Date(),
      bucketHash
    };
  }

  /**
   * Get all active experiments for a user
   */
  static getAllAssignments(userId: string, activeOnly = true): ExperimentAssignment[] {
    this.ensureInitialized();

    const assignments: ExperimentAssignment[] = [];

    this.experiments.forEach((experiment, key) => {
      if (!activeOnly || experiment.enabled) {
        const assignment = this.getAssignment(userId, key);
        if (assignment) {
          assignments.push(assignment);
        }
      }
    });

    return assignments;
  }

  /**
   * Get experiment configuration
   */
  static getExperimentConfig(experimentKey: string): ExperimentConfig | null {
    this.ensureInitialized();
    return this.experiments.get(experimentKey) || null;
  }

  /**
   * List all available experiments
   */
  static listExperiments(): ExperimentConfig[] {
    this.ensureInitialized();
    return Array.from(this.experiments.values());
  }

  /**
   * Update experiment configuration (for runtime updates)
   */
  static updateExperiment(experimentKey: string, updates: Partial<ExperimentConfig>): boolean {
    this.ensureInitialized();

    const existing = this.experiments.get(experimentKey);
    if (!existing) return false;

    try {
      const updated = ExperimentConfigSchema.parse({ ...existing, ...updates });
      this.experiments.set(experimentKey, updated);
      return true;
    } catch (error) {
      console.warn(`⚠️  Failed to update experiment ${experimentKey}:`, error);
      return false;
    }
  }

  /**
   * Disable/enable an experiment
   */
  static setExperimentEnabled(experimentKey: string, enabled: boolean): boolean {
    return this.updateExperiment(experimentKey, { enabled });
  }

  // Private helper methods

  private static ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }

  private static loadExperimentsFromEnv(): ExperimentConfig[] | null {
    try {
      const experimentsJson = env.EXPERIMENTS_JSON || process.env.EXPERIMENTS_JSON;
      if (experimentsJson) {
        return JSON.parse(experimentsJson);
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse EXPERIMENTS_JSON:', error);
    }
    return null;
  }

  private static generateBucketHash(userId: string, experimentKey: string): string {
    // Use SHA-256 for consistent, uniform distribution
    const input = `${userId}:${experimentKey}:pbcex-experiments`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private static hashToBucket(hash: string, buckets: number): number {
    // Convert first 8 hex characters to integer and modulo by bucket count
    const hexSubstring = hash.substring(0, 8);
    const intValue = parseInt(hexSubstring, 16);
    return intValue % buckets;
  }

  private static generateEvenTraffic(variantCount: number): number[] {
    const traffic = Math.floor(100 / variantCount);
    const remainder = 100 % variantCount;
    
    const allocation = new Array(variantCount).fill(traffic);
    
    // Distribute remainder to first variants
    for (let i = 0; i < remainder; i++) {
      allocation[i]++;
    }
    
    return allocation;
  }

  private static isUserInTargetAudience(userId: string, targetAudience: ExperimentConfig['targetAudience']): boolean {
    if (!targetAudience) return true;

    // TODO: Implement user role checking, new user detection, etc.
    // For now, return true to include all users
    // In a real implementation, you would:
    // 1. Query user role from database/auth service
    // 2. Check user registration date for newUsersOnly
    // 3. Check platform/device type for platform targeting

    return true;
  }

  /**
   * Analytics helper to generate experiment event data
   */
  static generateAnalyticsEvent(userId: string, experimentKey: string, eventType: 'assignment' | 'conversion'): {
    eventType: string;
    userId: string;
    experimentKey: string;
    variant: string;
    timestamp: string;
    properties: Record<string, any>;
  } {
    const assignment = this.getAssignment(userId, experimentKey);
    
    return {
      eventType: `experiment_${eventType}`,
      userId,
      experimentKey,
      variant: assignment?.variant || 'unknown',
      timestamp: new Date().toISOString(),
      properties: {
        bucketHash: assignment?.bucketHash,
        experimentEnabled: this.experiments.get(experimentKey)?.enabled ?? false
      }
    };
  }
}

// Auto-initialize with defaults
ExperimentService.initialize();
