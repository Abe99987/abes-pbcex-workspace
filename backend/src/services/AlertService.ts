import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Alert System for PBCEx Platform
 * Handles SLO violations and critical system events
 */

export interface AlertEvent {
  type: 'PRICE_STALL' | 'LEDGER_DRIFT_DETECTED' | 'WEBHOOK_RETRY_EXHAUSTED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata: Record<string, unknown>;
  resolved?: Date;
}

export interface AlertMetrics {
  priceStallCount: number;
  ledgerDriftCount: number;
  webhookFailureCount: number;
  lastAlertTime: Date | null;
}

export class AlertService {
  private static metrics: AlertMetrics = {
    priceStallCount: 0,
    ledgerDriftCount: 0,
    webhookFailureCount: 0,
    lastAlertTime: null,
  };

  /**
   * Emit a price stall alert
   */
  static emitPriceStall(asset: string, staleDurationSeconds: number): void {
    const alert: AlertEvent = {
      type: 'PRICE_STALL',
      severity: staleDurationSeconds > 120 ? 'HIGH' : 'MEDIUM', // 2+ minutes is high severity
      timestamp: new Date(),
      metadata: {
        asset,
        staleDurationSeconds,
        threshold: 30, // Our SLO threshold
      },
    };

    AlertService.processAlert(alert);
    AlertService.metrics.priceStallCount++;
  }

  /**
   * Emit a ledger drift alert
   */
  static emitLedgerDrift(
    accountId: string, 
    asset: string, 
    driftAmount: number, 
    balanceAmount: number, 
    journalSum: number
  ): void {
    const alert: AlertEvent = {
      type: 'LEDGER_DRIFT_DETECTED',
      severity: 'CRITICAL', // Always critical - financial integrity issue
      timestamp: new Date(),
      metadata: {
        accountId,
        asset,
        driftAmount,
        balanceAmount,
        journalSum,
        threshold: 0.01, // $0.01 USD equivalent
      },
    };

    AlertService.processAlert(alert);
    AlertService.metrics.ledgerDriftCount++;
  }

  /**
   * Emit a webhook retry exhausted alert
   */
  static emitWebhookRetryExhausted(
    webhookType: string,
    recipient: string,
    retryCount: number,
    lastError: string
  ): void {
    const alert: AlertEvent = {
      type: 'WEBHOOK_RETRY_EXHAUSTED',
      severity: 'MEDIUM',
      timestamp: new Date(),
      metadata: {
        webhookType,
        recipient,
        retryCount,
        lastError,
        maxRetries: 3, // Our SLO threshold
      },
    };

    AlertService.processAlert(alert);
    AlertService.metrics.webhookFailureCount++;
  }

  /**
   * Get current alert metrics
   */
  static getMetrics(): AlertMetrics {
    return { ...AlertService.metrics };
  }

  /**
   * Reset metrics (for testing/admin purposes)
   */
  static resetMetrics(): void {
    AlertService.metrics = {
      priceStallCount: 0,
      ledgerDriftCount: 0,
      webhookFailureCount: 0,
      lastAlertTime: null,
    };
    logInfo('Alert metrics reset');
  }

  /**
   * Process and route an alert through configured sinks
   */
  private static processAlert(alert: AlertEvent): void {
    AlertService.metrics.lastAlertTime = alert.timestamp;

    // Log Sink - Always available
    const logLevel = alert.severity === 'CRITICAL' ? 'error' : 'warn';
    const logMessage = `ALERT [${alert.type}] ${alert.severity}`;
    
    if (logLevel === 'error') {
      logError(logMessage, { alert });
    } else {
      logWarn(logMessage, { alert });
    }

    // Metric Sink - Increment counters
    logInfo('Alert metrics updated', {
      type: alert.type,
      total: AlertService.getTypeCount(alert.type),
    });

    // TODO: Future alert routing
    // - PagerDuty integration for CRITICAL alerts
    // - Slack webhook for HIGH/MEDIUM alerts  
    // - Email notifications for admin team
    // - Dashboard widget updates
  }

  /**
   * Get count for specific alert type
   */
  private static getTypeCount(type: AlertEvent['type']): number {
    switch (type) {
      case 'PRICE_STALL':
        return AlertService.metrics.priceStallCount;
      case 'LEDGER_DRIFT_DETECTED':
        return AlertService.metrics.ledgerDriftCount;
      case 'WEBHOOK_RETRY_EXHAUSTED':
        return AlertService.metrics.webhookFailureCount;
      default:
        return 0;
    }
  }
}

export default AlertService;
