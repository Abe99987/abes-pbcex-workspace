export { RbacService, AdminRole } from './rbac.service';
export { 
  requireRole, 
  requirePermission, 
  requirePolicy, 
  requireClearance, 
  requireOrgScope,
  applyInvestorRedaction 
} from './rbac.middleware';
export type { 
  UserAttributes, 
  ResourcePermissions, 
  PolicyResult 
} from './rbac.service';
