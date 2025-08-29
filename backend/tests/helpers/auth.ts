import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Factory, FactoryUser } from './factory';
import { User } from '../../src/models/User';
import { env } from '../../src/config/env';
import { query } from './db';

/**
 * Authentication Test Helpers
 * Provides utilities for handling auth in tests
 */

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register a new user and return auth tokens
 */
export async function registerUser(userData: FactoryUser = {}): Promise<AuthResult> {
  const password = userData.password || 'password123';
  
  // Create user with factory
  const user = await Factory.createUser({
    emailVerified: true, // Skip email verification in tests
    ...userData,
  });
  
  // Generate JWT token
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { 
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'pbcex-test',
      audience: 'pbcex-api',
    }
  );
  
  return {
    user,
    accessToken,
  };
}

/**
 * Login with email/password and return auth tokens
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { email, password } = credentials;
  
  // Get user from database
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userRow = result.rows[0];
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, userRow.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }
  
  // Convert to User object
  const user: User = {
    id: userRow.id,
    email: userRow.email,
    passwordHash: userRow.password_hash,
    firstName: userRow.first_name,
    lastName: userRow.last_name,
    role: userRow.role,
    kycStatus: userRow.kyc_status,
    emailVerified: userRow.email_verified,
    phoneVerified: userRow.phone_verified,
    phone: userRow.phone,
    twoFactorEnabled: userRow.two_factor_enabled,
    lastLoginAt: userRow.last_login_at,
    createdAt: userRow.created_at,
    updatedAt: userRow.updated_at,
  };
  
  // Generate JWT token
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { 
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'pbcex-test',
      audience: 'pbcex-api',
    }
  );
  
  // Update last login
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  
  return {
    user,
    accessToken,
  };
}

/**
 * Create and login admin user
 */
export async function loginAdmin(overrides: Partial<FactoryUser> = {}): Promise<AuthResult> {
  const adminUser = await Factory.createAdminUser(overrides);
  const password = overrides.password || 'password123';
  
  return await loginUser({
    email: adminUser.email,
    password,
  });
}

/**
 * Create and login support user
 */
export async function loginSupport(overrides: Partial<FactoryUser> = {}): Promise<AuthResult> {
  const supportUser = await Factory.createSupportUser(overrides);
  const password = overrides.password || 'password123';
  
  return await loginUser({
    email: supportUser.email,
    password,
  });
}

/**
 * Create and login teller user
 */
export async function loginTeller(overrides: Partial<FactoryUser> = {}): Promise<AuthResult> {
  const tellerUser = await Factory.createTellerUser(overrides);
  const password = overrides.password || 'password123';
  
  return await loginUser({
    email: tellerUser.email,
    password,
  });
}

/**
 * Create and login regular user
 */
export async function loginRegularUser(overrides: FactoryUser = {}): Promise<AuthResult> {
  return await registerUser({
    role: 'USER',
    kycStatus: 'APPROVED',
    ...overrides,
  });
}

/**
 * Generate JWT token for user (without password verification)
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { 
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'pbcex-test',
      audience: 'pbcex-api',
    }
  );
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'pbcex-test',
      audience: 'pbcex-api',
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Get authorization headers for requests
 */
export function getAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Mock JWT for specific user role
 */
export function mockJwtForRole(role: 'USER' | 'ADMIN' | 'SUPPORT' | 'TELLER'): string {
  const mockPayload = {
    userId: `mock-${role.toLowerCase()}-id`,
    email: `${role.toLowerCase()}@pbcex.com`,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: 'pbcex-test',
    aud: 'pbcex-api',
  };
  
  return jwt.sign(mockPayload, env.JWT_SECRET);
}

/**
 * Create user with specific KYC status
 */
export async function createUserWithKycStatus(
  status: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED',
  overrides: FactoryUser = {}
): Promise<AuthResult> {
  return await registerUser({
    kycStatus: status,
    ...overrides,
  });
}

/**
 * Helper to create headers for different user types
 */
export const AuthHeaders = {
  async user(): Promise<Record<string, string>> {
    const auth = await loginRegularUser();
    return getAuthHeaders(auth.accessToken);
  },
  
  async admin(): Promise<Record<string, string>> {
    const auth = await loginAdmin();
    return getAuthHeaders(auth.accessToken);
  },
  
  async support(): Promise<Record<string, string>> {
    const auth = await loginSupport();
    return getAuthHeaders(auth.accessToken);
  },
  
  async teller(): Promise<Record<string, string>> {
    const auth = await loginTeller();
    return getAuthHeaders(auth.accessToken);
  },
};

/**
 * Test authentication scenarios
 */
export const AuthScenarios = {
  // Valid authenticated user
  async validUser(): Promise<AuthResult> {
    return await loginRegularUser();
  },
  
  // User with pending KYC
  async pendingKyc(): Promise<AuthResult> {
    return await createUserWithKycStatus('PENDING');
  },
  
  // User with rejected KYC
  async rejectedKyc(): Promise<AuthResult> {
    return await createUserWithKycStatus('REJECTED');
  },
  
  // Unverified email user
  async unverifiedEmail(): Promise<AuthResult> {
    return await registerUser({ emailVerified: false });
  },
  
  // Admin with full access
  async adminUser(): Promise<AuthResult> {
    return await loginAdmin();
  },
  
  // Support agent
  async supportAgent(): Promise<AuthResult> {
    return await loginSupport();
  },
  
  // Bank teller
  async bankTeller(): Promise<AuthResult> {
    return await loginTeller();
  },
};

/**
 * Logout helper (for testing token invalidation)
 */
export async function logoutUser(token: string): Promise<void> {
  // In a real implementation, this would invalidate the token
  // For tests, we just verify the token exists
  try {
    verifyToken(token);
  } catch (error) {
    throw new Error('Token already invalid');
  }
}

export default {
  registerUser,
  loginUser,
  loginAdmin,
  loginSupport,
  loginTeller,
  loginRegularUser,
  generateToken,
  verifyToken,
  extractToken,
  getAuthHeaders,
  mockJwtForRole,
  createUserWithKycStatus,
  AuthHeaders,
  AuthScenarios,
  logoutUser,
};
