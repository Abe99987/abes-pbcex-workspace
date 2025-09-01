import { Request, Response } from 'express';
import { asyncHandlerAuth } from '@/utils/asyncHandler';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { idempotencyMiddleware } from '@/middlewares/idempotency';
import { rateLimitMiddleware } from '@/middlewares/rateLimit';
import {
  requireAuth,
  requireMoneyMovement,
  requireFeature,
  requireKycTier,
} from '@/middlewares/auth';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import { db } from '@/db/connection';
import { beneficiarySchema } from '@/models/MoneyMovement';

export class BeneficiariesController {
  /**
   * Create beneficiary
   * POST /api/beneficiaries
   */
  static createBeneficiary = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = beneficiarySchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const beneficiaryData = validation.data;

        // Validate beneficiary data based on type
        let validationResult;
        switch (beneficiaryData.type) {
          case 'bank_swift':
            validationResult = ValidationService.validateBankTransfer(
              'temp', // We'll validate the beneficiary details separately
              '100', // Minimum amount for validation
              beneficiaryData.details.currency || 'USD',
              beneficiaryData.details.rails || 'swift'
            );
            break;
          case 'internal_user':
            // Validate internal user account number
            if (!beneficiaryData.details.internal_account_number) {
              throw createError.validation(
                'Internal account number is required for internal user beneficiaries'
              );
            }
            validationResult = { isValid: true, message: 'Valid' };
            break;
          case 'email_link':
            // Validate email format
            if (
              !beneficiaryData.details.email ||
              !beneficiaryData.details.email.includes('@')
            ) {
              throw createError.validation(
                'Valid email is required for email link beneficiaries'
              );
            }
            validationResult = { isValid: true, message: 'Valid' };
            break;
          default:
            throw createError.validation('Invalid beneficiary type');
        }

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message || 'Beneficiary validation failed'
          );
        }

        // Check if beneficiary already exists
        const existingBeneficiary = await db.query(
          `SELECT id FROM beneficiaries 
         WHERE user_id = $1 
           AND type = $2 
           AND display_name = $3 
           AND is_active = true`,
          [userId, beneficiaryData.type, beneficiaryData.displayName]
        );

        if (existingBeneficiary.rows.length > 0) {
          throw createError.conflict(
            'Beneficiary with this name already exists'
          );
        }

        // Create beneficiary
        const result = await db.query(
          `INSERT INTO beneficiaries (user_id, type, display_name, details, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, user_id, type, display_name, details, created_at`,
          [
            userId,
            beneficiaryData.type,
            beneficiaryData.displayName,
            JSON.stringify(beneficiaryData.details),
          ]
        );

        const beneficiary = result.rows[0];

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'beneficiary_created',
          resourceType: 'beneficiary',
          resourceId: beneficiary.id,
          changes: {
            type: beneficiaryData.type,
            displayName: beneficiaryData.displayName,
            details: beneficiaryData.details, // This will be masked in the audit service
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Beneficiary created', {
          userId,
          beneficiaryId: beneficiary.id,
          type: beneficiaryData.type,
          displayName: beneficiaryData.displayName,
        });

        res.status(201).json({
          success: true,
          data: {
            beneficiaryId: beneficiary.id,
            type: beneficiary.type,
            displayName: beneficiary.display_name, // Database field name
            createdAt: beneficiary.created_at,
          },
        });
      } catch (error) {
        logError('Failed to create beneficiary', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get user's beneficiaries
   * GET /api/beneficiaries
   */
  static getBeneficiaries = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const type = req.query.type as string;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        let query = `
        SELECT id, user_id, type, display_name, details, is_active, created_at, updated_at
        FROM beneficiaries
        WHERE user_id = $1 AND is_active = true
      `;
        const params: any[] = [userId];
        let paramIndex = 2;

        if (type) {
          query += ` AND type = $${paramIndex}`;
          params.push(type);
          paramIndex++;
        }

        query += ` ORDER BY display_name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        const beneficiaries = result.rows.map(row => ({
          id: row.id,
          type: row.type,
          displayName: row.display_name,
          details: row.details,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        // Get total count
        let countQuery = `
        SELECT COUNT(*) as total
        FROM beneficiaries
        WHERE user_id = $1 AND is_active = true
      `;
        const countParams: any[] = [userId];

        if (type) {
          countQuery += ` AND type = $2`;
          countParams.push(type);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
          success: true,
          data: {
            beneficiaries,
            total,
            limit,
            offset,
          },
        });
      } catch (error) {
        logError('Failed to get beneficiaries', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Get specific beneficiary
   * GET /api/beneficiaries/:id
   */
  static getBeneficiary = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const beneficiaryId = req.params.id;

        if (!beneficiaryId) {
          throw createError.validation('Beneficiary ID is required');
        }

        const result = await db.query(
          `SELECT id, user_id, type, display_name, details, is_active, created_at, updated_at
         FROM beneficiaries
         WHERE id = $1 AND user_id = $2 AND is_active = true`,
          [beneficiaryId, userId]
        );

        if (result.rows.length === 0) {
          throw createError.notFound('Beneficiary not found');
        }

        const beneficiary = result.rows[0];

        res.json({
          success: true,
          data: {
            id: beneficiary.id,
            type: beneficiary.type,
            displayName: beneficiary.display_name,
            details: beneficiary.details,
            isActive: beneficiary.is_active,
            createdAt: beneficiary.created_at,
            updatedAt: beneficiary.updated_at,
          },
        });
      } catch (error) {
        logError('Failed to get beneficiary', {
          error: error as Error,
          userId: req.user?.id,
          beneficiaryId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Update beneficiary
   * PUT /api/beneficiaries/:id
   */
  static updateBeneficiary = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const beneficiaryId = req.params.id;
        const { displayName, details, isActive } = req.body;

        if (!beneficiaryId) {
          throw createError.validation('Beneficiary ID is required');
        }

        // Check if beneficiary exists and belongs to user
        const existingResult = await db.query(
          `SELECT id, type, display_name, details, is_active
         FROM beneficiaries
         WHERE id = $1 AND user_id = $2`,
          [beneficiaryId, userId]
        );

        if (existingResult.rows.length === 0) {
          throw createError.notFound('Beneficiary not found');
        }

        const existingBeneficiary = existingResult.rows[0];

        // Build update query
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (displayName !== undefined) {
          updates.push(`display_name = $${paramIndex}`);
          params.push(displayName);
          paramIndex++;
        }

        if (details !== undefined) {
          updates.push(`details = $${paramIndex}`);
          params.push(JSON.stringify(details));
          paramIndex++;
        }

        if (isActive !== undefined) {
          updates.push(`is_active = $${paramIndex}`);
          params.push(isActive);
          paramIndex++;
        }

        if (updates.length === 0) {
          throw createError.validation('No fields to update');
        }

        updates.push(`updated_at = NOW()`);
        params.push(beneficiaryId, userId);

        const result = await db.query(
          `UPDATE beneficiaries 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING id, user_id, type, display_name, details, is_active, created_at, updated_at`,
          params
        );

        const updatedBeneficiary = result.rows[0];

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'beneficiary_updated',
          resourceType: 'beneficiary',
          resourceId: beneficiaryId,
          changes: {
            displayName:
              displayName !== undefined
                ? displayName
                : existingBeneficiary.display_name,
            details:
              details !== undefined ? details : existingBeneficiary.details,
            isActive:
              isActive !== undefined ? isActive : existingBeneficiary.is_active,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Beneficiary updated', {
          userId,
          beneficiaryId,
          changes: {
            displayName,
            details: details ? 'updated' : undefined,
            isActive,
          },
        });

        res.json({
          success: true,
          data: {
            id: updatedBeneficiary.id,
            type: updatedBeneficiary.type,
            displayName: updatedBeneficiary.display_name,
            details: updatedBeneficiary.details,
            isActive: updatedBeneficiary.is_active,
            createdAt: updatedBeneficiary.created_at,
            updatedAt: updatedBeneficiary.updated_at,
          },
        });
      } catch (error) {
        logError('Failed to update beneficiary', {
          error: error as Error,
          userId: req.user?.id,
          beneficiaryId: req.params.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Delete beneficiary
   * DELETE /api/beneficiaries/:id
   */
  static deleteBeneficiary = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const beneficiaryId = req.params.id;

        if (!beneficiaryId) {
          throw createError.validation('Beneficiary ID is required');
        }

        // Check if beneficiary exists and belongs to user
        const existingResult = await db.query(
          `SELECT id, type, display_name
         FROM beneficiaries
         WHERE id = $1 AND user_id = $2 AND is_active = true`,
          [beneficiaryId, userId]
        );

        if (existingResult.rows.length === 0) {
          throw createError.notFound('Beneficiary not found');
        }

        // Soft delete by setting is_active to false
        const result = await db.query(
          `UPDATE beneficiaries 
         SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
          [beneficiaryId, userId]
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'beneficiary_deleted',
          resourceType: 'beneficiary',
          resourceId: beneficiaryId,
          changes: {
            isActive: false,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Beneficiary deleted', {
          userId,
          beneficiaryId,
        });

        res.json({
          success: true,
          data: {
            beneficiaryId,
            deleted: true,
          },
        });
      } catch (error) {
        logError('Failed to delete beneficiary', {
          error: error as Error,
          userId: req.user?.id,
          beneficiaryId: req.params.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const beneficiariesMiddleware = {
  // Write operations (create, update, delete)
  write: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.bankTransfers'),
    requireKycTier('tier1'),
    rateLimitMiddleware.moderate,
    idempotencyMiddleware,
  ],

  // Read operations (list, get)
  read: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.bankTransfers'),
    rateLimitMiddleware.moderate,
  ],
};
