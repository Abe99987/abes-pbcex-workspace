import { db } from '@/db';
import { cache } from '@/cache/redis';
import { logError } from '@/utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    adminServices: ComponentHealth;
    auditLog: ComponentHealth;
    rbacEngine: ComponentHealth;
  };
  uptime: number;
  version: string;
  timestamp: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck?: string;
  error?: string;
}

export interface LivenessStatus {
  status: 'healthy' | 'unhealthy';
  issues?: string[];
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  blockers?: string[];
}

/**
 * Admin Terminal Health Service
 * Monitors health of admin terminal specific components
 */
export class HealthService {
  /**
   * Get comprehensive system health status
   */
  static async getSystemHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    const [dbHealth, redisHealth, adminServicesHealth, auditHealth, rbacHealth] = await Promise.all([
      HealthService.checkDatabaseHealth(),
      HealthService.checkRedisHealth(),
      HealthService.checkAdminServicesHealth(),
      HealthService.checkAuditLogHealth(),
      HealthService.checkRbacEngineHealth(),
    ]);

    const allComponents = [dbHealth, redisHealth, adminServicesHealth, auditHealth, rbacHealth];
    const overallStatus = HealthService.determineOverallStatus(allComponents);

    return {
      status: overallStatus,
      components: {
        database: dbHealth,
        redis: redisHealth,
        adminServices: adminServicesHealth,
        auditLog: auditHealth,
        rbacEngine: rbacHealth,
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get liveness status (basic health check)
   */
  static async getLivenessStatus(): Promise<LivenessStatus> {
    const issues: string[] = [];

    // Basic checks that don't require external dependencies
    try {
      // Check if process is responsive
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > 1024) { // More than 1GB heap usage
        issues.push('High memory usage detected');
      }

      // Check uptime
      if (process.uptime() < 10) {
        issues.push('Service recently restarted');
      }

    } catch (error) {
      issues.push('Process health check failed');
      logError('Liveness check failed', error as Error);
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'unhealthy',
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Get readiness status (can serve traffic)
   */
  static async getReadinessStatus(): Promise<ReadinessStatus> {
    const blockers: string[] = [];

    try {
      // Check database connectivity
      const dbCheck = await HealthService.checkDatabaseHealth();
      if (dbCheck.status === 'unhealthy') {
        blockers.push('Database connection failed');
      }

      // Check Redis connectivity
      const redisCheck = await HealthService.checkRedisHealth();
      if (redisCheck.status === 'unhealthy') {
        blockers.push('Redis connection failed');
      }

      // Check critical admin services
      const adminCheck = await HealthService.checkAdminServicesHealth();
      if (adminCheck.status === 'unhealthy') {
        blockers.push('Admin services not ready');
      }

    } catch (error) {
      blockers.push('Readiness check failed');
      logError('Readiness check failed', error as Error);
    }

    return {
      status: blockers.length === 0 ? 'ready' : 'not_ready',
      blockers: blockers.length > 0 ? blockers : undefined,
    };
  }

  /**
   * Check database health
   */
  private static async checkDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const result = await db.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        status: result.status === 'ok' ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: result.details,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check Redis health
   */
  private static async checkRedisHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const result = await cache.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        status: result.status === 'ok' ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: result.details,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check admin services health
   */
  private static async checkAdminServicesHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // TODO: Check admin-specific services when implemented
      // For now, just return healthy as placeholder
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check audit log health
   */
  private static async checkAuditLogHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // TODO: Check audit log integrity when implemented
      // For now, just return healthy as placeholder
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check RBAC engine health
   */
  private static async checkRbacEngineHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // TODO: Check RBAC engine when implemented
      // For now, just return healthy as placeholder
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Determine overall status from component statuses
   */
  private static determineOverallStatus(components: ComponentHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return unhealthyCount > components.length / 2 ? 'unhealthy' : 'degraded';
    }
    
    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }
}
