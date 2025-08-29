import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { KycRecord } from '@/models/KycRecord';
import { KYC_STATUS, KYC_TYPES } from '@/utils/constants';
import { AuthController } from './AuthController';

/**
 * KYC Controller for PBCEx
 * Handles Know Your Customer and Know Your Business verification
 */

// In-memory store for KYC records (replace with database in production)
const kycRecords: KycRecord[] = [];

export class KycController {
  /**
   * POST /api/kyc/submit
   * Submit personal KYC information
   */
  static submitPersonalKyc = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { personal, address, documents, consent } = req.body;

    logInfo('Personal KYC submission', { userId });

    // Check if user already has a personal KYC record
    const existingRecord = kycRecords.find(
      r => r.userId === userId && r.type === KYC_TYPES.PERSONAL
    );

    if (existingRecord && existingRecord.status === KYC_STATUS.APPROVED) {
      throw createError.conflict('Personal KYC already approved');
    }

    // Create or update KYC record
    const kycRecord: KycRecord = {
      id: existingRecord?.id || uuidv4(),
      userId,
      type: KYC_TYPES.PERSONAL,
      status: KYC_STATUS.IN_PROGRESS,
      submissionData: {
        personal: {
          firstName: personal.firstName,
          lastName: personal.lastName,
          dateOfBirth: personal.dateOfBirth,
          ssn: personal.ssn,
          nationality: personal.nationality,
          phone: personal.phone,
          email: personal.email,
          address: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
        },
        documents: documents.map((doc: any) => ({
          type: doc.type,
          filename: doc.filename,
          mimeType: doc.mimeType,
          url: doc.url || `/uploads/${doc.filename}`,
          uploadedAt: new Date(),
        })),
      },
      createdAt: existingRecord?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Simulate Plaid Identity Verification API call
    const plaidVerificationId = await KycController.startPlaidVerification(userId, kycRecord.submissionData);
    kycRecord.providerRef = plaidVerificationId;

    // Add or update record
    if (existingRecord) {
      const index = kycRecords.findIndex(r => r.id === existingRecord.id);
      kycRecords[index] = kycRecord;
    } else {
      kycRecords.push(kycRecord);
    }

    // Update user's KYC status
    const user = AuthController.getUserById(userId);
    if (user) {
      user.kycStatus = KYC_STATUS.PENDING_REVIEW;
      user.updatedAt = new Date();
    }

    logInfo('Personal KYC submitted successfully', { 
      userId, 
      kycRecordId: kycRecord.id,
      plaidVerificationId,
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: 'Personal KYC submitted for review',
      data: {
        submissionId: kycRecord.id,
        status: kycRecord.status,
        providerRef: kycRecord.providerRef,
        estimatedReviewTime: '1-3 business days',
      },
    });
  });

  /**
   * POST /api/kyc/kyb/submit
   * Submit business KYB information
   */
  static submitBusinessKyb = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { company, documents, ownership, licenses, contacts, shippingProfile, consent } = req.body;

    logInfo('Business KYB submission', { userId });

    // Check if user already has a business KYB record
    const existingRecord = kycRecords.find(
      r => r.userId === userId && r.type === KYC_TYPES.BUSINESS
    );

    if (existingRecord && existingRecord.status === KYC_STATUS.APPROVED) {
      throw createError.conflict('Business KYB already approved');
    }

    // Create or update KYB record
    const kybRecord: KycRecord = {
      id: existingRecord?.id || uuidv4(),
      userId,
      type: KYC_TYPES.BUSINESS,
      status: KYC_STATUS.IN_PROGRESS,
      submissionData: {
        business: {
          legalName: company.legalName,
          dba: company.dba,
          entityType: company.entityType,
          ein: company.ein,
          incorporationDate: company.incorporationDate,
          jurisdiction: company.jurisdiction,
          naicsCode: company.naicsCode,
          registeredAddress: company.registeredAddress,
          operatingAddress: company.operatingAddress,
        },
        documents: documents.map((doc: any) => ({
          type: doc.type,
          filename: doc.filename,
          mimeType: doc.mimeType,
          url: doc.url || `/uploads/${doc.filename}`,
          uploadedAt: new Date(),
        })),
        ubos: ownership.ubos.map((ubo: any) => ({
          name: ubo.name,
          ownershipPercent: ubo.ownershipPercent,
          dateOfBirth: ubo.dateOfBirth,
          address: ubo.address,
          phone: ubo.phone,
          email: ubo.email,
        })),
        licenses: licenses.map((license: any) => ({
          type: license.type,
          licenseNumber: license.licenseNumber,
          state: license.state,
          expirationDate: license.expirationDate,
          isActive: license.isActive,
        })),
      },
      createdAt: existingRecord?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Store additional business data
    kybRecord.submissionData.controlPerson = ownership.controlPerson;
    kybRecord.submissionData.contacts = contacts;
    kybRecord.submissionData.shippingProfile = shippingProfile;

    // Simulate enhanced business verification
    const verificationId = await KycController.startBusinessVerification(userId, kybRecord.submissionData);
    kybRecord.providerRef = verificationId;

    // Add or update record
    if (existingRecord) {
      const index = kycRecords.findIndex(r => r.id === existingRecord.id);
      kycRecords[index] = kybRecord;
    } else {
      kycRecords.push(kybRecord);
    }

    // Update user's KYC status
    const user = AuthController.getUserById(userId);
    if (user) {
      user.kycStatus = KYC_STATUS.PENDING_REVIEW;
      user.updatedAt = new Date();
    }

    logInfo('Business KYB submitted successfully', { 
      userId, 
      kybRecordId: kybRecord.id,
      verificationId,
      companyName: company.legalName,
      ein: company.ein,
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: 'Business KYB submitted for review',
      data: {
        submissionId: kybRecord.id,
        status: kybRecord.status,
        providerRef: kybRecord.providerRef,
        estimatedReviewTime: '3-7 business days',
      },
    });
  });

  /**
   * GET /api/kyc/status
   * Get KYC status for current user
   */
  static getKycStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const personalKyc = kycRecords.find(
      r => r.userId === userId && r.type === KYC_TYPES.PERSONAL
    );

    const businessKyb = kycRecords.find(
      r => r.userId === userId && r.type === KYC_TYPES.BUSINESS
    );

    const user = AuthController.getUserById(userId);

    res.json({
      code: 'SUCCESS',
      data: {
        overallStatus: user?.kycStatus || KYC_STATUS.NOT_STARTED,
        personalKyc: personalKyc ? {
          status: personalKyc.status,
          submittedAt: personalKyc.createdAt,
          lastUpdated: personalKyc.updatedAt,
          providerRef: personalKyc.providerRef,
          reviewNotes: personalKyc.reviewNotes,
        } : {
          status: KYC_STATUS.NOT_STARTED,
        },
        businessKyb: businessKyb ? {
          status: businessKyb.status,
          submittedAt: businessKyb.createdAt,
          lastUpdated: businessKyb.updatedAt,
          providerRef: businessKyb.providerRef,
          reviewNotes: businessKyb.reviewNotes,
        } : {
          status: KYC_STATUS.NOT_STARTED,
        },
        nextSteps: KycController.getNextSteps(user?.kycStatus, personalKyc, businessKyb),
      },
    });
  });

  /**
   * GET /api/kyc/documents/:recordId
   * Get uploaded documents for a KYC record
   */
  static getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const userId = req.user!.id;

    const kycRecord = kycRecords.find(r => r.id === recordId && r.userId === userId);
    if (!kycRecord) {
      throw createError.notFound('KYC record');
    }

    res.json({
      code: 'SUCCESS',
      data: {
        documents: kycRecord.submissionData.documents || [],
      },
    });
  });

  /**
   * POST /api/kyc/resubmit/:recordId
   * Resubmit KYC after rejection
   */
  static resubmitKyc = asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const userId = req.user!.id;

    const kycRecord = kycRecords.find(r => r.id === recordId && r.userId === userId);
    if (!kycRecord) {
      throw createError.notFound('KYC record');
    }

    if (![KYC_STATUS.REJECTED, KYC_STATUS.EXPIRED].includes(kycRecord.status)) {
      throw createError.validation('KYC record cannot be resubmitted in current status');
    }

    // Update submission data
    Object.assign(kycRecord.submissionData, req.body);
    kycRecord.status = KYC_STATUS.IN_PROGRESS;
    kycRecord.reviewNotes = undefined;
    kycRecord.updatedAt = new Date();

    logInfo('KYC resubmitted', { userId, recordId, type: kycRecord.type });

    res.json({
      code: 'SUCCESS',
      message: 'KYC resubmitted for review',
      data: {
        submissionId: kycRecord.id,
        status: kycRecord.status,
      },
    });
  });

  // Private helper methods

  private static async startPlaidVerification(userId: string, submissionData: any): Promise<string> {
    // Simulate Plaid Identity Verification API call
    logInfo('Starting Plaid verification', { userId });

    // In production, this would call the actual Plaid API:
    // const plaidClient = new PlaidApi(configuration);
    // const request = {
    //   template_id: 'idvtmp_...',
    //   gave_consent: true,
    //   user: {
    //     client_user_id: userId,
    //     phone_number: submissionData.personal.phone,
    //     email_address: submissionData.personal.email,
    //   }
    // };
    // const response = await plaidClient.identityVerificationCreate(request);

    // For now, return a mock verification ID
    const verificationId = `plaid_verification_${userId.slice(-8)}_${Date.now()}`;

    // Simulate async status update (in production, this would be a webhook)
    setTimeout(() => {
      KycController.simulateVerificationResult(userId, verificationId);
    }, 5000); // 5 seconds for demo

    return verificationId;
  }

  private static async startBusinessVerification(userId: string, submissionData: any): Promise<string> {
    // Simulate business verification process
    logInfo('Starting business verification', { userId });

    const verificationId = `biz_verification_${userId.slice(-8)}_${Date.now()}`;

    // Simulate async status update
    setTimeout(() => {
      KycController.simulateBusinessVerificationResult(userId, verificationId);
    }, 10000); // 10 seconds for demo

    return verificationId;
  }

  private static simulateVerificationResult(userId: string, verificationId: string): void {
    const kycRecord = kycRecords.find(
      r => r.userId === userId && r.providerRef === verificationId
    );

    if (!kycRecord) return;

    // Simulate random verification outcome (80% approval rate)
    const isApproved = Math.random() > 0.2;

    if (isApproved) {
      kycRecord.status = KYC_STATUS.APPROVED;
      kycRecord.reviewNotes = 'Identity verification successful';
      
      // Update user's overall KYC status
      const user = AuthController.getUserById(userId);
      if (user) {
        user.kycStatus = KYC_STATUS.APPROVED;
        user.updatedAt = new Date();
      }
    } else {
      kycRecord.status = KYC_STATUS.REJECTED;
      kycRecord.reviewNotes = 'Unable to verify identity. Please ensure all documents are clear and valid.';
    }

    kycRecord.reviewedAt = new Date();
    kycRecord.updatedAt = new Date();

    logInfo('Verification result simulated', { 
      userId, 
      verificationId, 
      status: kycRecord.status 
    });
  }

  private static simulateBusinessVerificationResult(userId: string, verificationId: string): void {
    const kybRecord = kycRecords.find(
      r => r.userId === userId && r.providerRef === verificationId
    );

    if (!kybRecord) return;

    // Simulate random verification outcome (70% approval rate for business)
    const isApproved = Math.random() > 0.3;

    if (isApproved) {
      kybRecord.status = KYC_STATUS.APPROVED;
      kybRecord.reviewNotes = 'Business verification successful';
    } else {
      kybRecord.status = KYC_STATUS.REJECTED;
      kybRecord.reviewNotes = 'Additional business documentation required. Please provide updated articles of incorporation.';
    }

    kybRecord.reviewedAt = new Date();
    kybRecord.updatedAt = new Date();

    logInfo('Business verification result simulated', { 
      userId, 
      verificationId, 
      status: kybRecord.status 
    });
  }

  private static getNextSteps(
    overallStatus?: string,
    personalKyc?: KycRecord,
    businessKyb?: KycRecord
  ): string[] {
    const nextSteps: string[] = [];

    if (!personalKyc) {
      nextSteps.push('Complete personal identity verification');
    } else if (personalKyc.status === KYC_STATUS.REJECTED) {
      nextSteps.push('Resubmit personal KYC with corrected information');
    }

    if (!businessKyb) {
      nextSteps.push('Complete business verification (optional for higher limits)');
    } else if (businessKyb.status === KYC_STATUS.REJECTED) {
      nextSteps.push('Resubmit business KYB with additional documentation');
    }

    if (overallStatus === KYC_STATUS.APPROVED) {
      nextSteps.push('Your account is fully verified - start trading!');
    }

    return nextSteps;
  }

  // Utility methods for testing and admin
  static getAllKycRecords = (): KycRecord[] => kycRecords;
  static getKycRecordById = (id: string): KycRecord | undefined => 
    kycRecords.find(r => r.id === id);
  static getUserKycRecords = (userId: string): KycRecord[] => 
    kycRecords.filter(r => r.userId === userId);
}
