import { z } from 'zod';
import { USER_ROLES, KYC_STATUS } from '@/utils/constants';

/**
 * User model for PBCEx platform
 */

// User role type alias
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Base user interface
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  kycStatus: typeof KYC_STATUS[keyof typeof KYC_STATUS];
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: Date;
  loginCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// User creation interface (for registration)
export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: typeof USER_ROLES[keyof typeof USER_ROLES];
}

// User update interface
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  kycStatus?: typeof KYC_STATUS[keyof typeof KYC_STATUS];
  isActive?: boolean;
}

// Public user profile (no sensitive data)
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  kycStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  createdAt: Date;
}

// Database schema validation
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]),
  kycStatus: z.enum([
    KYC_STATUS.NOT_STARTED,
    KYC_STATUS.IN_PROGRESS,
    KYC_STATUS.PENDING_REVIEW,
    KYC_STATUS.APPROVED,
    KYC_STATUS.REJECTED,
    KYC_STATUS.EXPIRED,
  ]),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  twoFactorSecret: z.string().optional(),
  lastLoginAt: z.date().optional(),
  loginCount: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export const createUserInputSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).default(USER_ROLES.USER),
});

export const updateUserInputSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  twoFactorSecret: z.string().optional(),
  kycStatus: z.enum([
    KYC_STATUS.NOT_STARTED,
    KYC_STATUS.IN_PROGRESS,
    KYC_STATUS.PENDING_REVIEW,
    KYC_STATUS.APPROVED,
    KYC_STATUS.REJECTED,
    KYC_STATUS.EXPIRED,
  ]).optional(),
  isActive: z.boolean().optional(),
});

// User utility functions
export class UserUtils {
  /**
   * Create a safe user profile (no sensitive data)
   */
  static toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      kycStatus: user.kycStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get full name of user
   */
  static getFullName(user: User): string {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : user.email;
  }

  /**
   * Check if user can perform trading operations
   */
  static canTrade(user: User): boolean {
    return (
      user.isActive &&
      user.emailVerified &&
      user.kycStatus === KYC_STATUS.APPROVED
    );
  }

  /**
   * Check if user can withdraw funds
   */
  static canWithdraw(user: User): boolean {
    return (
      user.isActive &&
      user.emailVerified &&
      user.phoneVerified &&
      user.kycStatus === KYC_STATUS.APPROVED
    );
  }

  /**
   * Check if user needs to complete KYC
   */
  static needsKyc(user: User): boolean {
    const needsKycStatuses = [
      KYC_STATUS.NOT_STARTED,
      KYC_STATUS.REJECTED,
      KYC_STATUS.EXPIRED,
    ] as const;
    return needsKycStatuses.includes(user.kycStatus as typeof needsKycStatuses[number]);
  }

  /**
   * Check if user is admin
   */
  static isAdmin(user: User): boolean {
    return user.role === USER_ROLES.ADMIN;
  }

  /**
   * Generate default user values for creation
   */
  static getDefaultValues(): Partial<User> {
    return {
      role: USER_ROLES.USER,
      kycStatus: KYC_STATUS.NOT_STARTED,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      loginCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate user data before database operations
   */
  static validate(user: Partial<User>): User {
    return userSchema.parse(user);
  }

  /**
   * Validate create user input
   */
  static validateCreateInput(input: any): CreateUserInput {
    return createUserInputSchema.parse(input);
  }

  /**
   * Validate update user input
   */
  static validateUpdateInput(input: any): UpdateUserInput {
    return updateUserInputSchema.parse(input);
  }
}

// SQL table definition (for reference/migration)
export const USER_TABLE_SQL = `
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (kyc_status IN ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_kyc_status ON users(kyc_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at) WHERE last_login_at IS NOT NULL;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
`;
