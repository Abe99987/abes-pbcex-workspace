export { AuditService } from './audit.service';
export { AuditController } from './audit.controller';
export { 
  auditAction, 
  auditSensitiveAction, 
  auditCriticalAction,
  auditDualApproval,
  createAuditEntry 
} from './audit.middleware';
export { default as auditRoutes } from './audit.routes';
export type { 
  AuditEntry, 
  HashChainValidation 
} from './audit.service';
