/**
 * Unit tests for Feature Flags / Experiments
 */

import { FeatureFlags, EXPERIMENT_DEFINITIONS } from './experiments';

describe('FeatureFlags', () => {
  beforeEach(() => {
    // Reset singleton before each test
    FeatureFlags.reset();
  });

  describe('Basic functionality', () => {
    it('should return false for unknown flags', () => {
      const flags = new FeatureFlags();
      expect(flags.isEnabled('unknown_flag')).toBe(false);
    });

    it('should return default values for known experiments', () => {
      const flags = new FeatureFlags();
      
      // All defined experiments should default to false (safety first)
      EXPERIMENT_DEFINITIONS.forEach(def => {
        expect(flags.isEnabled(def.name)).toBe(def.defaultEnabled);
      });
    });

    it('should parse valid JSON configuration', () => {
      const config = JSON.stringify([
        { name: 'test_flag', enabled: true },
        { name: 'another_flag', enabled: false }
      ]);
      
      const flags = new FeatureFlags(config);
      expect(flags.isEnabled('test_flag')).toBe(true);
      expect(flags.isEnabled('another_flag')).toBe(false);
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = '{ invalid json }';
      const flags = new FeatureFlags(invalidJson);
      
      // Should not throw and should fall back to defaults
      expect(flags.isEnabled('any_flag')).toBe(false);
    });
  });

  describe('Rollout percentage', () => {
    it('should respect rollout percentage', () => {
      const config = JSON.stringify([
        { name: 'rollout_test', enabled: true, rolloutPercentage: 0 }
      ]);
      
      const flags = new FeatureFlags(config);
      
      // With 0% rollout, should always be false
      expect(flags.isEnabled('rollout_test', 'user123')).toBe(false);
      expect(flags.isEnabled('rollout_test', 'user456')).toBe(false);
    });

    it('should enable for 100% rollout', () => {
      const config = JSON.stringify([
        { name: 'rollout_test', enabled: true, rolloutPercentage: 100 }
      ]);
      
      const flags = new FeatureFlags(config);
      
      // With 100% rollout, should always be true
      expect(flags.isEnabled('rollout_test', 'user123')).toBe(true);
      expect(flags.isEnabled('rollout_test', 'user456')).toBe(true);
    });
  });

  describe('Audience targeting', () => {
    it('should enable for specific audiences', () => {
      const config = JSON.stringify([
        { 
          name: 'audience_test', 
          enabled: true, 
          audiences: ['user123', 'admin456'] 
        }
      ]);
      
      const flags = new FeatureFlags(config);
      
      expect(flags.isEnabled('audience_test', 'user123')).toBe(true);
      expect(flags.isEnabled('audience_test', 'admin456')).toBe(true);
      expect(flags.isEnabled('audience_test', 'user789')).toBe(false);
    });
  });

  describe('Multi-value experiments', () => {
    it('should return experiment values', () => {
      const config = JSON.stringify([
        { 
          name: 'variant_test', 
          enabled: true, 
          value: 'variant_a' 
        }
      ]);
      
      const flags = new FeatureFlags(config);
      
      expect(flags.getValue('variant_test')).toBe('variant_a');
      expect(flags.getValue('unknown_test', 'default')).toBe('default');
    });
  });

  describe('Utility methods', () => {
    it('should list active experiments', () => {
      const config = JSON.stringify([
        { name: 'active_flag', enabled: true },
        { name: 'inactive_flag', enabled: false },
        { name: 'another_active', enabled: true }
      ]);
      
      const flags = new FeatureFlags(config);
      const active = flags.getActiveExperiments();
      
      expect(active).toContain('active_flag');
      expect(active).toContain('another_active');
      expect(active).not.toContain('inactive_flag');
      expect(active).toHaveLength(2);
    });
  });

  describe('Singleton behavior', () => {
    it('should maintain singleton instance', () => {
      const config = JSON.stringify([{ name: 'singleton_test', enabled: true }]);
      
      const instance1 = FeatureFlags.getInstance(config);
      const instance2 = FeatureFlags.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1.isEnabled('singleton_test')).toBe(true);
    });
  });

  describe('Safety defaults', () => {
    it('should have all experiments disabled by default', () => {
      EXPERIMENT_DEFINITIONS.forEach(def => {
        expect(def.defaultEnabled).toBe(false);
      });
    });

    it('should include required experiment definitions', () => {
      const requiredExperiments = [
        'price_cache_strategy_redis_vs_memory',
        'bundle_splitting_route_based',
        'fedex_integration_mode',
        'email_template_react_vs_handlebars'
      ];

      const definedNames = EXPERIMENT_DEFINITIONS.map(d => d.name);
      
      requiredExperiments.forEach(name => {
        expect(definedNames).toContain(name);
      });
    });
  });
});
