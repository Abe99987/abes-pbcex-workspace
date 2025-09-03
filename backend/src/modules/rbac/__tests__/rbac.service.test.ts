import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RbacService, AdminRole, UserAttributes, PolicyResult } from '../rbac.service';

// Mock dependencies
jest.mock('@/utils/logger');

describe('RbacService', () => {
  const mockUserAttributes: UserAttributes = {
    org_id: 'org1',
    region: 'us-east',
    branch_id: 'branch1',
    risk_level: 'medium',
    clearance_level: 'l3',
    access_scope: 'global',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasRole', () => {
    it('should return true for direct role match', () => {
      const userRoles = ['admin'];
      
      const result = RbacService.hasRole(userRoles, AdminRole.ADMIN);

      expect(result).toBe(true);
    });

    it('should return true for role hierarchy match', () => {
      const userRoles = ['super_admin'];
      
      const result = RbacService.hasRole(userRoles, AdminRole.ADMIN);

      expect(result).toBe(true);
    });

    it('should return false for insufficient role', () => {
      const userRoles = ['read_only'];
      
      const result = RbacService.hasRole(userRoles, AdminRole.ADMIN);

      expect(result).toBe(false);
    });

    it('should return false for empty roles', () => {
      const userRoles: string[] = [];
      
      const result = RbacService.hasRole(userRoles, AdminRole.ADMIN);

      expect(result).toBe(false);
    });

    it('should support multiple user roles', () => {
      const userRoles = ['cs_agent', 'branch_manager'];
      
      const result1 = RbacService.hasRole(userRoles, AdminRole.CS_AGENT);
      const result2 = RbacService.hasRole(userRoles, AdminRole.BRANCH_MANAGER);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should allow exact permission match', () => {
      const userRoles = ['admin'];
      
      const result = RbacService.hasPermission(userRoles, 'cases', 'read');

      expect(result).toBe(true);
    });

    it('should allow wildcard permission match', () => {
      const userRoles = ['admin'];
      
      const result = RbacService.hasPermission(userRoles, 'cases', 'write');

      expect(result).toBe(true);
    });

    it('should allow global admin permission', () => {
      const userRoles = ['super_admin'];
      
      const result = RbacService.hasPermission(userRoles, 'any_resource', 'any_action');

      expect(result).toBe(true);
    });

    it('should deny permission for insufficient role', () => {
      const userRoles = ['read_only'];
      
      const result = RbacService.hasPermission(userRoles, 'cases', 'write');

      expect(result).toBe(false);
    });

    it('should deny permission for empty roles', () => {
      const userRoles: string[] = [];
      
      const result = RbacService.hasPermission(userRoles, 'cases', 'read');

      expect(result).toBe(false);
    });

    it('should respect investor view restrictions', () => {
      const userRoles = ['investor_view'];
      
      const allowedResult = RbacService.hasPermission(userRoles, 'kpi', 'read:aggregated');
      const deniedResult = RbacService.hasPermission(userRoles, 'cases', 'read');

      expect(allowedResult).toBe(true);
      expect(deniedResult).toBe(false);
    });
  });

  describe('evaluatePolicy - DENY BY DEFAULT', () => {
    it('should deny access by default for invalid role', () => {
      const userRoles = ['invalid_role'];
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        mockUserAttributes,
        'cases',
        'read'
      );

      expect(result.allowed).toBe(false);
      expect(result.denyByDefault).toBe(true);
      expect(result.reason).toContain('lacks permission');
    });

    it('should allow access for valid role and attributes', () => {
      const userRoles = ['admin'];
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        mockUserAttributes,
        'cases',
        'read'
      );

      expect(result.allowed).toBe(true);
      expect(result.denyByDefault).toBe(true);
      expect(result.reason).toBe('Access granted after policy evaluation');
    });

    it('should deny branch-scoped access to different org', () => {
      const userRoles = ['branch_manager'];
      const branchUserAttributes: UserAttributes = {
        ...mockUserAttributes,
        access_scope: 'branch',
      };
      const resourceContext = { org_id: 'different_org' };
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        branchUserAttributes,
        'cases',
        'read:branch',
        resourceContext
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Branch-scoped access denied');
    });

    it('should deny access for insufficient clearance level', () => {
      const userRoles = ['admin'];
      const lowClearanceAttributes: UserAttributes = {
        ...mockUserAttributes,
        clearance_level: 'l1',
      };
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        lowClearanceAttributes,
        'hedging',
        'write'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('clearance level');
    });

    it('should enforce governance super admin requirement', () => {
      const userRoles = ['admin'];
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        mockUserAttributes,
        'governance',
        'write'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('super admin role');
    });

    it('should allow super admin for governance operations', () => {
      const userRoles = ['super_admin'];
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        mockUserAttributes,
        'governance',
        'write'
      );

      expect(result.allowed).toBe(true);
    });

    it('should enforce L4 clearance for hedging operations', () => {
      const userRoles = ['admin'];
      const l4Attributes: UserAttributes = {
        ...mockUserAttributes,
        clearance_level: 'l4',
      };
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        l4Attributes,
        'hedging',
        'write'
      );

      expect(result.allowed).toBe(true);
    });

    it('should restrict investor view to aggregated data only', () => {
      const userRoles = ['investor_view'];
      
      const allowedResult = RbacService.evaluatePolicy(
        userRoles,
        mockUserAttributes,
        'kpi',
        'read:aggregated'
      );

      const deniedResult = RbacService.evaluatePolicy(
        userRoles,
        mockUserAttributes,
        'kpi',
        'read'
      );

      expect(allowedResult.allowed).toBe(true);
      expect(deniedResult.allowed).toBe(false);
      expect(deniedResult.reason).toContain('lacks permission for kpi:read');
    });

    it('should handle regional scope restrictions', () => {
      const userRoles = ['branch_manager'];
      const regionalAttributes: UserAttributes = {
        ...mockUserAttributes,
        access_scope: 'regional',
      };
      const wrongRegionContext = { region: 'us-west' };
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        regionalAttributes,
        'cases',
        'read:branch',
        wrongRegionContext
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Regional access denied');
    });

    it('should handle policy evaluation errors gracefully', () => {
      const userRoles = ['admin'];
      const invalidAttributes = null as any;
      
      const result = RbacService.evaluatePolicy(
        userRoles,
        invalidAttributes,
        'cases',
        'read'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Policy evaluation failed');
      expect(result.denyByDefault).toBe(true);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return scoped permissions for branch access', () => {
      const userRoles = ['admin'];
      const branchAttributes: UserAttributes = {
        ...mockUserAttributes,
        access_scope: 'branch',
      };
      
      const permissions = RbacService.getEffectivePermissions(userRoles, branchAttributes);

      expect(permissions).toContain('cases:read:branch');
      expect(permissions).toContain('orders:read:branch');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return regional scoped permissions', () => {
      const userRoles = ['cs_agent'];
      const regionalAttributes: UserAttributes = {
        ...mockUserAttributes,
        access_scope: 'regional',
      };
      
      const permissions = RbacService.getEffectivePermissions(userRoles, regionalAttributes);

      expect(permissions).toContain('cases:read:regional');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return global permissions for super admin', () => {
      const userRoles = ['super_admin'];
      
      const permissions = RbacService.getEffectivePermissions(userRoles, mockUserAttributes);

      expect(permissions).toContain('admin:*');
      expect(permissions.length).toBeGreaterThan(10);
    });

    it('should return minimal permissions for read-only role', () => {
      const userRoles = ['read_only'];
      
      const permissions = RbacService.getEffectivePermissions(userRoles, mockUserAttributes);

      expect(permissions).toContain('health:read');
      expect(permissions.length).toBe(1);
    });
  });
});
