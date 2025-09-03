import { env } from '@/config/env';

/**
 * Admin Terminal Configuration
 * Centralized configuration for admin terminal modules
 */
export interface AdminTerminalConfig {
  // Security settings
  security: {
    jwtAudience: string;
    jwtIssuer: string;
    auditHashSecret: string;
    stepUpTimeoutMs: number;
    dualApprovalTimeoutMs: number;
  };

  // Feature flags for admin modules
  features: {
    enableCases: boolean;
    enableMarkets: boolean;
    enableHedging: boolean;
    enableReserves: boolean;
    enableAccounting: boolean;
    enableKpi: boolean;
    enableAudit: boolean;
    enableGovernance: boolean;
    enableBranches: boolean;
    enableInvestorView: boolean;
  };

  // API configuration
  api: {
    baseUrl: string;
    wsUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  // Database configuration
  database: {
    connectionUrl: string;
    maxConnections: number;
    queryTimeout: number;
  };

  // Redis configuration
  redis: {
    connectionUrl: string;
    keyPrefix: string;
    ttlDefault: number;
  };

  // External integrations
  integrations: {
    cloudflare: {
      enabled: boolean;
      accountId?: string;
      apiToken?: string;
    };
    waf: {
      provider: string;
      enabled: boolean;
    };
  };

  // Logging and monitoring
  monitoring: {
    logLevel: string;
    enableMetrics: boolean;
    enableTracing: boolean;
  };
}

/**
 * Load and validate admin terminal configuration
 */
export function loadAdminTerminalConfig(): AdminTerminalConfig {
  return {
    security: {
      jwtAudience: 'pbcex-api',
      jwtIssuer: 'pbcex.com', 
      auditHashSecret: env.JWT_SECRET || 'dev-audit-secret-32-chars-long', // Use JWT_SECRET as fallback
      stepUpTimeoutMs: 300000, // 5 minutes
      dualApprovalTimeoutMs: 3600000, // 1 hour
    },

    features: {
      enableCases: true,
      enableMarkets: true,
      enableHedging: true,
      enableReserves: true,
      enableAccounting: true,
      enableKpi: true,
      enableAudit: true,
      enableGovernance: true,
      enableBranches: true,
      enableInvestorView: true,
    },

    api: {
      baseUrl: env.API_BASE_URL || 'http://localhost:4001',
      wsUrl: 'ws://localhost:4001', // Default websocket URL
      timeout: 30000,
      retryAttempts: 3,
    },

    database: {
      connectionUrl: env.DATABASE_URL,
      maxConnections: 20,
      queryTimeout: 30000,
    },

    redis: {
      connectionUrl: env.REDIS_URL,
      keyPrefix: 'admin:',
      ttlDefault: 3600, // 1 hour
    },

    integrations: {
      cloudflare: {
        enabled: false, // Will be enabled when env vars are added
        accountId: undefined,
        apiToken: undefined,
      },
      waf: {
        provider: 'cloudflare',
        enabled: env.NODE_ENV === 'production',
      },
    },

    monitoring: {
      logLevel: 'info',
      enableMetrics: env.NODE_ENV === 'production',
      enableTracing: env.NODE_ENV === 'production',
    },
  };
}

// Export singleton instance
export const adminTerminalConfig = loadAdminTerminalConfig();
