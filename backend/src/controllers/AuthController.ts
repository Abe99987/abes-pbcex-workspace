import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { generateToken, generateRefreshToken } from '@/middlewares/authMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { User, CreateUserInput, UserUtils } from '@/models/User';
import { Account } from '@/models/Account';
import { USER_ROLES, KYC_STATUS, ACCOUNT_TYPES } from '@/utils/constants';

/**
 * Authentication Controller for PBCEx
 * Handles user registration, login, and authentication operations
 */

// In-memory stores for MVP (replace with Redis in production)
const refreshTokens = new Set<string>();
const blacklistedTokens = new Set<string>();
const users: User[] = [];
const accounts: Account[] = [];

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, phone } = req.body;

    logInfo('User registration attempt', { email });

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw createError.conflict('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const user: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: USER_ROLES.USER,
      kycStatus: KYC_STATUS.NOT_STARTED,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      phone: phone?.trim(),
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      loginCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add user to in-memory store
    users.push(user);

    // Create default accounts (Funding and Trading)
    const fundingAccount: Account = {
      id: uuidv4(),
      userId,
      type: ACCOUNT_TYPES.FUNDING,
      name: 'Funding Account',
      description: 'Real assets held in custody (PAXG, USD, USDC)',
      custodyProvider: 'PAXOS', // Default to Paxos for PAXG
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tradingAccount: Account = {
      id: uuidv4(),
      userId,
      type: ACCOUNT_TYPES.TRADING,
      name: 'Trading Account',
      description: 'Synthetic assets for active trading (XAU-s, XAG-s, XPT-s, XPD-s, XCU-s)',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    accounts.push(fundingAccount, tradingAccount);

    // Generate tokens
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    });

    const refreshToken = generateRefreshToken(user.id);
    refreshTokens.add(refreshToken);

    logInfo('User registered successfully', { 
      userId: user.id, 
      email: user.email,
      fundingAccountId: fundingAccount.id,
      tradingAccountId: tradingAccount.id,
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: 'User registered successfully',
      data: {
        user: UserUtils.toProfile(user),
        accessToken,
        refreshToken,
      },
    });
  });

  /**
   * POST /api/auth/login
   * Authenticate user login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    logInfo('User login attempt', { email });

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw createError.authentication('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError.authentication('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logWarn('Invalid password attempt', { userId: user.id, email: user.email });
      throw createError.authentication('Invalid email or password');
    }

    // Update login statistics
    user.lastLoginAt = new Date();
    user.loginCount += 1;
    user.updatedAt = new Date();

    // Generate tokens
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    });

    const refreshToken = generateRefreshToken(user.id);
    refreshTokens.add(refreshToken);

    logInfo('User logged in successfully', { userId: user.id, email: user.email });

    res.json({
      code: 'SUCCESS',
      message: 'Login successful',
      data: {
        user: UserUtils.toProfile(user),
        accessToken,
        refreshToken,
      },
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user and blacklist token
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token) {
      blacklistedTokens.add(token);
      logInfo('Token blacklisted on logout', { userId: req.user?.id });
    }

    // Remove refresh token if provided in body
    const { refreshToken } = req.body;
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }

    res.json({
      code: 'SUCCESS',
      message: 'Logout successful',
    });
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw createError.notFound('User');
    }

    res.json({
      code: 'SUCCESS',
      data: {
        user: UserUtils.toProfile(user),
      },
    });
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = users.find(u => u.id === userId);
    if (!user) {
      throw createError.notFound('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw createError.authentication('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();

    logInfo('Password changed successfully', { userId });

    res.json({
      code: 'SUCCESS',
      message: 'Password changed successfully',
    });
  });

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    logInfo('Password reset requested', { email });

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Generate reset token (in production, store in Redis with expiration)
      const resetToken = uuidv4();
      
      logInfo('Password reset token generated', { userId: user.id, resetToken });
      
      // TODO: Send email with reset link
      // await NotificationService.sendEmail({
      //   to: user.email,
      //   template: 'password-reset',
      //   data: { resetToken, firstName: user.firstName }
      // });
    }

    // Always return success to avoid user enumeration
    res.json({
      code: 'SUCCESS',
      message: 'If the email exists, a password reset link has been sent',
    });
  });

  /**
   * POST /api/auth/2fa/setup
   * Setup two-factor authentication
   */
  static setup2FA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    logInfo('2FA setup initiated', { userId });

    // TODO: Generate TOTP secret using authenticator library
    const secret = 'MOCK_2FA_SECRET_' + userId.slice(-8);
    const qrCodeUrl = `otpauth://totp/PBCEx:${req.user!.email}?secret=${secret}&issuer=PBCEx`;

    res.json({
      code: 'SUCCESS',
      message: '2FA setup initiated',
      data: {
        secret,
        qrCodeUrl,
        backupCodes: [
          '123456-789012',
          '345678-901234',
          '567890-123456',
        ],
      },
    });
  });

  /**
   * POST /api/auth/2fa/enable
   * Enable two-factor authentication
   */
  static enable2FA = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;
    const userId = req.user!.id;

    // TODO: Verify TOTP code
    if (code !== '123456') {
      throw createError.validation('Invalid 2FA code');
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      throw createError.notFound('User');
    }

    user.twoFactorEnabled = true;
    user.twoFactorSecret = 'MOCK_2FA_SECRET_' + userId.slice(-8);
    user.updatedAt = new Date();

    logInfo('2FA enabled for user', { userId });

    res.json({
      code: 'SUCCESS',
      message: '2FA enabled successfully',
    });
  });

  /**
   * POST /api/auth/2fa/disable
   * Disable two-factor authentication
   */
  static disable2FA = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;
    const userId = req.user!.id;

    const user = users.find(u => u.id === userId);
    if (!user) {
      throw createError.notFound('User');
    }

    // Verify password before disabling 2FA
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError.authentication('Password is incorrect');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.updatedAt = new Date();

    logInfo('2FA disabled for user', { userId });

    res.json({
      code: 'SUCCESS',
      message: '2FA disabled successfully',
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken || !refreshTokens.has(refreshToken)) {
      throw createError.authentication('Invalid refresh token');
    }

    // TODO: Verify refresh token and get user ID
    // For now, extract from token (in production, use proper JWT verification)
    
    const userId = 'mock-user-id'; // This would come from JWT verification
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw createError.authentication('User not found');
    }

    // Generate new access token
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    });

    res.json({
      code: 'SUCCESS',
      data: {
        accessToken,
      },
    });
  });

  // Utility methods for testing and admin
  static getAllUsers = (): User[] => users;
  static getUserById = (id: string): User | undefined => users.find(u => u.id === id);
  static getUserAccounts = (userId: string): Account[] => 
    accounts.filter(a => a.userId === userId);
  static isTokenBlacklisted = (token: string): boolean => blacklistedTokens.has(token);
}
