import { z } from 'zod';
import { KYC_STATUS, KYC_TYPES } from '@/utils/constants';

/**
 * KYC Record model for PBCEx platform
 * Handles both personal and business KYC verification
 */

export interface KycRecord {
  id: string;
  userId: string;
  type: typeof KYC_TYPES[keyof typeof KYC_TYPES];
  status: typeof KYC_STATUS[keyof typeof KYC_STATUS];
  providerRef?: string; // Plaid verification ID
  submissionData: {
    personal?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      ssn: string;
      nationality: string;
      phone: string;
      email: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
    };
    business?: {
      legalName: string;
      dba?: string;
      entityType: string;
      ein: string;
      incorporationDate: string;
      jurisdiction: string;
      naicsCode?: string;
      registeredAddress: any;
      operatingAddress: any;
    };
    documents: Array<{
      type: string;
      filename: string;
      mimeType: string;
      url: string;
      uploadedAt: Date;
    }>;
    ubos?: Array<{
      name: string;
      ownershipPercent: number;
      dateOfBirth: string;
      address: any;
      phone: string;
      email: string;
    }>;
    licenses?: Array<{
      type: string;
      licenseNumber: string;
      state: string;
      expirationDate: string;
      isActive: boolean;
    }>;
  };
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKycRecordInput {
  userId: string;
  type: typeof KYC_TYPES[keyof typeof KYC_TYPES];
  submissionData: KycRecord['submissionData'];
}

export class KycRecordUtils {
  static needsReview(record: KycRecord): boolean {
    return [KYC_STATUS.IN_PROGRESS, KYC_STATUS.PENDING_REVIEW].includes(record.status as any);
  }

  static isExpired(record: KycRecord): boolean {
    return record.expiresAt ? new Date() > record.expiresAt : false;
  }

  static canResubmit(record: KycRecord): boolean {
    return [KYC_STATUS.REJECTED, KYC_STATUS.EXPIRED].includes(record.status as any);
  }

  static getRequiredDocuments(type: string): string[] {
    if (type === KYC_TYPES.PERSONAL) {
      return ['ID_FRONT', 'ID_BACK', 'SELFIE'];
    } else {
      return ['ARTICLES_OF_INCORP', 'GOOD_STANDING', 'BYLAWS', 'BOARD_RESOLUTION', 'W9'];
    }
  }

  static validateDocuments(record: KycRecord): boolean {
    const required = KycRecordUtils.getRequiredDocuments(record.type);
    const submitted = record.submissionData.documents.map(d => d.type);
    return required.every(doc => submitted.includes(doc));
  }
}

export const KYC_RECORD_TABLE_SQL = `
CREATE TABLE kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS')),
  status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
  provider_ref VARCHAR(100),
  submission_data JSONB NOT NULL,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One KYC record per user per type
  UNIQUE(user_id, type)
);

CREATE INDEX idx_kyc_records_user_id ON kyc_records(user_id);
CREATE INDEX idx_kyc_records_status ON kyc_records(status);
CREATE INDEX idx_kyc_records_type ON kyc_records(type);
CREATE INDEX idx_kyc_records_provider_ref ON kyc_records(provider_ref) WHERE provider_ref IS NOT NULL;
`;
