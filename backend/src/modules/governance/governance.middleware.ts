import { Request, Response, NextFunction } from 'express';
import { GovernanceService } from './governance.service';
import { createError } from '@/middlewares/errorMiddleware';
import { logWarn } from '@/utils/logger';

/**
 * Admin Terminal Governance Middleware
 * Enforces maintenance mode, kill switches, and feature toggles
 */

/**
 * Maintenance mode middleware
 * Blocks requests when maintenance is enabled (except for bypass roles)
 */
export function maintenanceCheck(req: Request, res: Response, next: NextFunction) {
  try {
    if (!GovernanceService.isMaintenanceMode()) {
      return next();
    }

    const userRoles = req.user?.roles || [req.user?.role].filter(Boolean) || [];
    
    if (GovernanceService.canBypassMaintenance(userRoles.filter(Boolean) as string[])) {
      return next();
    }

    const maintenance = GovernanceService.getMaintenanceStatus();
    
    logWarn('Request blocked by maintenance mode', {
      userId: req.user?.id,
      path: req.path,
      maintenance
    });

    return res.status(503).json({
      code: 'MAINTENANCE_MODE',
      message: maintenance.message || 'System is currently under maintenance',
      data: {
        estimatedEnd: maintenance.estimatedEnd,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // If maintenance check fails, allow the request (fail open)
    return next();
  }
}

/**
 * Kill switch middleware factory
 * Creates middleware to check if a specific service is enabled
 */
export function killSwitchCheck(service: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (GovernanceService.isServiceEnabled(service)) {
        return next();
      }

      const killSwitch = GovernanceService.getKillSwitch(service);
      
      logWarn('Request blocked by kill switch', {
        userId: req.user?.id,
        path: req.path,
        service,
        killSwitch
      });

      return res.status(503).json({
        code: 'SERVICE_DISABLED',
        message: `${service} service is currently disabled`,
        data: {
          service,
          reason: killSwitch?.reason,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // If kill switch check fails, allow the request (fail open)
      return next();
    }
  };
}

/**
 * Feature toggle middleware factory
 * Creates middleware to check if a feature is enabled for the user
 */
export function featureToggleCheck(featureName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRoles = req.user?.roles || [req.user?.role].filter(Boolean) || [];
      
      if (GovernanceService.isFeatureEnabled(featureName, userRoles.filter(Boolean) as string[])) {
        return next();
      }

      logWarn('Request blocked by feature toggle', {
        userId: req.user?.id,
        path: req.path,
        feature: featureName,
        userRoles
      });

      return res.status(403).json({
        code: 'FEATURE_DISABLED',
        message: `Feature '${featureName}' is not available`,
        data: {
          feature: featureName,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // If feature check fails, allow the request (fail open)
      return next();
    }
  };
}

/**
 * Combined governance middleware
 * Applies maintenance check, kill switch check, and feature toggle check
 */
export function governanceMiddleware(service?: string, feature?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Apply maintenance check first
    maintenanceCheck(req, res, (err) => {
      if (err || res.headersSent) return;
      
      // Apply service kill switch check if specified
      if (service) {
        killSwitchCheck(service)(req, res, (err) => {
          if (err || res.headersSent) return;
          
          // Apply feature toggle check if specified
          if (feature) {
            featureToggleCheck(feature)(req, res, next);
          } else {
            next();
          }
        });
      } else if (feature) {
        // Just feature check if no service specified
        featureToggleCheck(feature)(req, res, next);
      } else {
        next();
      }
    });
  };
}
