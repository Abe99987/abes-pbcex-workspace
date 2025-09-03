import { logError, logInfo } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';

// Role definitions for admin terminal access
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CS_AGENT = 'cs_agent',
  INVESTOR_VIEW = 'investor_view',
  BRANCH_MANAGER = 'branch_manager',
  READ_ONLY = 'read_only',
}

// Attribute-based access control attributes
export interface UserAttributes {
  org_id: string;
  region?: string;
  branch_id?: string;
  risk_level: 'low' | 'medium' | 'high';
  clearance_level: 'l1' | 'l2' | 'l3' | 'l4';
  access_scope: 'global' | 'regional' | 'branch' | 'self';
}

// Resource permission definitions
export interface ResourcePermissions {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// ABAC policy result
export interface PolicyResult {
  allowed: boolean;
  reason: string;
  requiredAttributes?: string[];
  denyByDefault: boolean;
}

/**
 * Admin Terminal RBAC Service
 * Implements deny-by-default role-based and attribute-based access control
 */
export class RbacService {
  // Role hierarchy (higher roles inherit permissions from lower roles)
  private static readonly ROLE_HIERARCHY: Record<AdminRole, AdminRole[]> = {
    [AdminRole.SUPER_ADMIN]: [AdminRole.ADMIN, AdminRole.CS_AGENT, AdminRole.INVESTOR_VIEW, AdminRole.BRANCH_MANAGER, AdminRole.READ_ONLY],
    [AdminRole.ADMIN]: [AdminRole.CS_AGENT, AdminRole.INVESTOR_VIEW, AdminRole.READ_ONLY],
    [AdminRole.CS_AGENT]: [AdminRole.READ_ONLY],
    [AdminRole.INVESTOR_VIEW]: [AdminRole.READ_ONLY],
    [AdminRole.BRANCH_MANAGER]: [AdminRole.READ_ONLY],
    [AdminRole.READ_ONLY]: [],
  };

  // Resource access permissions by role
  private static readonly ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
    [AdminRole.SUPER_ADMIN]: [
      'admin:*',
      'cases:*',
      'orders:*',
      'markets:*',
      'hedging:*',
      'reserves:*',
      'accounting:*',
      'spending:*',
      'kpi:*',
      'audit:*',
      'governance:*',
      'branches:*',
      'health:*',
    ],
    [AdminRole.ADMIN]: [
      'cases:read',
      'cases:write',
      'cases:assign',
      'orders:read',
      'orders:export',
      'markets:read',
      'hedging:read',
      'hedging:write', // Added for admin role
      'reserves:read',
      'accounting:read',
      'kpi:read',
      'audit:read',
      'governance:read',
      'governance:write', // Added for admin role  
      'branches:read',
      'health:read',
    ],
    [AdminRole.CS_AGENT]: [
      'cases:read',
      'cases:write',
      'cases:assign',
      'orders:read',
      'branches:read',
      'health:read',
    ],
    [AdminRole.INVESTOR_VIEW]: [
      'kpi:read:aggregated',
      'accounting:read:summary',
      'health:read',
    ],
    [AdminRole.BRANCH_MANAGER]: [
      'cases:read:branch',
      'orders:read:branch',
      'branches:read:own',
      'health:read',
    ],
    [AdminRole.READ_ONLY]: [
      'health:read',
    ],
  };

  /**
   * Check if user has required role (with hierarchy support)
   */
  static hasRole(userRoles: string[], requiredRole: AdminRole): boolean {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // Check direct role match
    if (userRoles.includes(requiredRole)) {
      return true;
    }

    // Check role hierarchy - if user has a higher role, they inherit lower permissions
    for (const userRole of userRoles) {
      const hierarchy = RbacService.ROLE_HIERARCHY[userRole as AdminRole];
      if (hierarchy && hierarchy.includes(requiredRole)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has permission to access a resource/action
   */
  static hasPermission(userRoles: string[], resource: string, action: string): boolean {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    const permissionKey = `${resource}:${action}`;
    const wildcardPermission = `${resource}:*`;
    const globalPermission = 'admin:*';

    // Check each user role
    for (const role of userRoles) {
      const rolePermissions = RbacService.ROLE_PERMISSIONS[role as AdminRole];
      if (!rolePermissions) continue;

      // Check for exact match, wildcard, or global admin
      if (
        rolePermissions.includes(permissionKey) ||
        rolePermissions.includes(wildcardPermission) ||
        rolePermissions.includes(globalPermission)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate ABAC policy (deny by default)
   */
  static evaluatePolicy(
    userRoles: string[],
    userAttributes: UserAttributes,
    resource: string,
    action: string,
    resourceContext?: Record<string, any>
  ): PolicyResult {
    try {
      // DENY BY DEFAULT
      let result: PolicyResult = {
        allowed: false,
        reason: 'Access denied by default policy',
        denyByDefault: true,
      };

      // First check: Role-based permissions
      if (!RbacService.hasPermission(userRoles, resource, action)) {
        return {
          ...result,
          reason: `Role ${userRoles.join(', ')} lacks permission for ${resource}:${action}`,
        };
      }

      // Second check: Attribute-based conditions
      const attributeCheck = RbacService.evaluateAttributes(
        userAttributes,
        resource,
        action,
        resourceContext
      );

      if (!attributeCheck.allowed) {
        return attributeCheck;
      }

      // Third check: Resource-specific business rules
      const businessRuleCheck = RbacService.evaluateBusinessRules(
        userRoles,
        userAttributes,
        resource,
        action,
        resourceContext
      );

      if (!businessRuleCheck.allowed) {
        return businessRuleCheck;
      }

      // All checks passed
      logInfo('RBAC policy evaluation: ALLOW', {
        userRoles,
        resource,
        action,
        orgId: userAttributes.org_id,
        accessScope: userAttributes.access_scope,
      });

      return {
        allowed: true,
        reason: 'Access granted after policy evaluation',
        denyByDefault: true,
      };

    } catch (error) {
      logError('RBAC policy evaluation error', error as Error);
      return {
        allowed: false,
        reason: 'Policy evaluation failed',
        denyByDefault: true,
      };
    }
  }

  /**
   * Evaluate attribute-based conditions
   */
  private static evaluateAttributes(
    attributes: UserAttributes,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): PolicyResult {
    // Scope-based restrictions
    if (attributes.access_scope === 'branch' && context?.org_id !== attributes.org_id) {
      return {
        allowed: false,
        reason: 'Branch-scoped access denied for different organization',
        denyByDefault: true,
      };
    }

    if (attributes.access_scope === 'branch' && context?.branch_id !== attributes.branch_id) {
      return {
        allowed: false,
        reason: 'Branch-scoped access denied for different branch',
        denyByDefault: true,
      };
    }

    // Regional restrictions
    if (attributes.access_scope === 'regional' && context?.region !== attributes.region) {
      return {
        allowed: false,
        reason: 'Regional access denied for different region',
        denyByDefault: true,
      };
    }

    // Clearance level restrictions for sensitive resources
    if (RbacService.requiresHighClearance(resource, action) && 
        !['l3', 'l4'].includes(attributes.clearance_level)) {
      return {
        allowed: false,
        reason: 'Insufficient clearance level for sensitive resource',
        requiredAttributes: ['clearance_level:l3+'],
        denyByDefault: true,
      };
    }

    return {
      allowed: true,
      reason: 'Attribute checks passed',
      denyByDefault: true,
    };
  }

  /**
   * Evaluate business rules for specific resources
   */
  private static evaluateBusinessRules(
    userRoles: string[],
    attributes: UserAttributes,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): PolicyResult {
    // Governance operations require super admin
    if (resource === 'governance' && action.includes('write')) {
      if (!userRoles.includes(AdminRole.SUPER_ADMIN)) {
        return {
          allowed: false,
          reason: 'Governance operations require super admin role',
          denyByDefault: true,
        };
      }
    }

    // Hedging operations require high clearance
    if (resource === 'hedging' && action.includes('write')) {
      if (attributes.clearance_level !== 'l4') {
        return {
          allowed: false,
          reason: 'Hedging operations require L4 clearance',
          requiredAttributes: ['clearance_level:l4'],
          denyByDefault: true,
        };
      }
    }

    // Investor view restrictions (redacted access only)
    if (userRoles.includes(AdminRole.INVESTOR_VIEW) && !action.includes('aggregated') && !action.includes('summary')) {
      if (['accounting', 'kpi'].includes(resource)) {
        return {
          allowed: false,
          reason: 'Investor view limited to aggregated data only',
          denyByDefault: true,
        };
      }
    }

    return {
      allowed: true,
      reason: 'Business rule checks passed',
      denyByDefault: true,
    };
  }

  /**
   * Check if resource/action requires high clearance
   */
  private static requiresHighClearance(resource: string, action: string): boolean {
    const highClearanceResources = [
      'hedging:write',
      'governance:*',
      'audit:write',
      'reserves:write',
      'spending:write',
    ];

    return highClearanceResources.some(pattern => {
      const [res, act] = pattern.split(':');
      return resource === res && (act === '*' || action === act);
    });
  }

  /**
   * Get user's effective permissions based on roles and attributes
   */
  static getEffectivePermissions(userRoles: string[], attributes: UserAttributes): string[] {
    const permissions = new Set<string>();

    for (const role of userRoles) {
      const rolePermissions = RbacService.ROLE_PERMISSIONS[role as AdminRole];
      if (rolePermissions) {
        rolePermissions.forEach(perm => {
          // Apply attribute-based scoping
          if (attributes.access_scope === 'branch' && !perm.includes(':branch')) {
            permissions.add(`${perm}:branch`);
          } else if (attributes.access_scope === 'regional' && !perm.includes(':regional')) {
            permissions.add(`${perm}:regional`);
          } else {
            permissions.add(perm);
          }
        });
      }
    }

    return Array.from(permissions);
  }
}
