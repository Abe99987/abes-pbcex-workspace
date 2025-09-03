export { ApprovalsService } from './approvals.service';
export { ApprovalsController } from './approvals.controller';
export { 
  requireApproval,
  requireStepUpForApproval,
  requireStepUpAndApproval,
  requireApproverRole 
} from './approvals.middleware';
export { default as approvalsRoutes } from './approvals.routes';
export type { 
  ApprovalRequest, 
  ApprovalAuditEntry, 
  ApprovalRule 
} from './approvals.service';
