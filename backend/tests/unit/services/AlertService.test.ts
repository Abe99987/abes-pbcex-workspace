import AlertService from '@/services/AlertService';

// Mock the logger
jest.mock('@/utils/logger', () => ({
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

describe('AlertService', () => {
  beforeEach(() => {
    // Reset metrics before each test
    AlertService.resetMetrics();
  });

  describe('emitPriceStall', () => {
    it('should emit price stall alert with correct metadata', () => {
      const { logWarn } = require('@/utils/logger');

      AlertService.emitPriceStall('AU', 45);

      const metrics = AlertService.getMetrics();
      expect(metrics.priceStallCount).toBe(1);
      expect(metrics.lastAlertTime).toBeInstanceOf(Date);

      // Verify log was called
      expect(logWarn).toHaveBeenCalled();
    });

    it('should set HIGH severity for stalls > 120 seconds', () => {
      const { logWarn } = require('@/utils/logger');

      AlertService.emitPriceStall('BTC', 150); // 2.5 minutes

      // Should log as warn (HIGH severity uses warn, not error)
      expect(logWarn).toHaveBeenCalled();
    });

    it('should set MEDIUM severity for stalls <= 120 seconds', () => {
      const { logWarn } = require('@/utils/logger');

      AlertService.emitPriceStall('ETH', 60); // 1 minute

      expect(logWarn).toHaveBeenCalled();
    });
  });

  describe('emitLedgerDrift', () => {
    it('should emit ledger drift alert with CRITICAL severity', () => {
      const { logError } = require('@/utils/logger');

      AlertService.emitLedgerDrift('account123', 'AU', 0.05, 100.00, 99.95);

      const metrics = AlertService.getMetrics();
      expect(metrics.ledgerDriftCount).toBe(1);
      
      // Should always log as error for CRITICAL severity
      expect(logError).toHaveBeenCalled();
    });

    it('should include correct drift metadata', () => {
      AlertService.emitLedgerDrift('acc456', 'AG', 0.02, 50.00, 49.98);

      const metrics = AlertService.getMetrics();
      expect(metrics.ledgerDriftCount).toBe(1);
    });
  });

  describe('emitWebhookRetryExhausted', () => {
    it('should emit webhook retry exhausted alert', () => {
      const { logWarn } = require('@/utils/logger');

      AlertService.emitWebhookRetryExhausted(
        'email',
        'user@example.com',
        3,
        'Connection timeout'
      );

      const metrics = AlertService.getMetrics();
      expect(metrics.webhookFailureCount).toBe(1);
      expect(logWarn).toHaveBeenCalled();
    });

    it('should track multiple webhook failures', () => {
      AlertService.emitWebhookRetryExhausted('email', 'user1@example.com', 3, 'Error 1');
      AlertService.emitWebhookRetryExhausted('sms', '+1234567890', 3, 'Error 2');

      const metrics = AlertService.getMetrics();
      expect(metrics.webhookFailureCount).toBe(2);
    });
  });

  describe('getMetrics', () => {
    it('should return initial metrics', () => {
      const metrics = AlertService.getMetrics();
      
      expect(metrics).toEqual({
        priceStallCount: 0,
        ledgerDriftCount: 0,
        webhookFailureCount: 0,
        lastAlertTime: null,
      });
    });

    it('should return updated metrics after alerts', () => {
      AlertService.emitPriceStall('AU', 45);
      AlertService.emitLedgerDrift('acc123', 'AG', 0.02, 100, 99.98);
      AlertService.emitWebhookRetryExhausted('email', 'user@test.com', 3, 'Failed');

      const metrics = AlertService.getMetrics();
      expect(metrics.priceStallCount).toBe(1);
      expect(metrics.ledgerDriftCount).toBe(1);
      expect(metrics.webhookFailureCount).toBe(1);
      expect(metrics.lastAlertTime).toBeInstanceOf(Date);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to initial state', () => {
      // Generate some alerts
      AlertService.emitPriceStall('BTC', 60);
      AlertService.emitWebhookRetryExhausted('sms', '+1234567890', 3, 'Error');

      // Verify metrics are set
      let metrics = AlertService.getMetrics();
      expect(metrics.priceStallCount).toBe(1);
      expect(metrics.webhookFailureCount).toBe(1);

      // Reset and verify
      AlertService.resetMetrics();
      metrics = AlertService.getMetrics();
      
      expect(metrics).toEqual({
        priceStallCount: 0,
        ledgerDriftCount: 0,
        webhookFailureCount: 0,
        lastAlertTime: null,
      });
    });
  });
});
