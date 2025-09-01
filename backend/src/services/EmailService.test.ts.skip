/**
 * EmailService Test Scaffold
 * Basic tests for Resend integration with mocking
 */

import { EmailService } from './EmailService';
import { env } from '@/config/env';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}));

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton for each test
    (EmailService as any).resendClient = null;
    (EmailService as any).isInitialized = false;
  });

  describe('Initialization', () => {
    it('should initialize successfully with Resend API key', async () => {
      const originalResendKey = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = 'test_resend_key';

      await EmailService.initialize();
      
      const health = EmailService.getHealthStatus();
      expect(health.status).toBe('connected');
      expect(health.provider).toBe('Resend');

      // Restore original env
      process.env.RESEND_API_KEY = originalResendKey;
    });

    it('should initialize in mock mode without API key', async () => {
      const originalResendKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      await EmailService.initialize();
      
      const health = EmailService.getHealthStatus();
      expect(health.status).toBe('mock');
      expect(health.provider).toBe('Mock');

      // Restore original env
      process.env.RESEND_API_KEY = originalResendKey;
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully with valid inputs', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'email_123' },
        error: null
      });

      (EmailService as any).resendClient = {
        emails: { send: mockSend }
      };
      (EmailService as any).isInitialized = true;

      const result = await EmailService.sendTransactionalEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email_123');
      expect(result.provider).toBe('RESEND');
      expect(mockSend).toHaveBeenCalledWith({
        from: env.EMAIL_FROM,
        to: ['test@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      });
    });

    it('should handle Resend API errors gracefully', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' }
      });

      (EmailService as any).resendClient = {
        emails: { send: mockSend }
      };
      (EmailService as any).isInitialized = true;

      const result = await EmailService.sendTransactionalEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
      expect(result.provider).toBe('RESEND');
    });

    it('should validate email addresses', async () => {
      const result = await EmailService.sendTransactionalEmail(
        'invalid-email',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should require all mandatory fields', async () => {
      const result = await EmailService.sendTransactionalEmail(
        '',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required email parameters');
    });

    it('should fall back to mock mode when Resend is unavailable', async () => {
      (EmailService as any).resendClient = null;
      (EmailService as any).isInitialized = true;

      const result = await EmailService.sendTransactionalEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('MOCK');
      expect(result.messageId).toMatch(/^mock_email_/);
    });
  });

  describe('Email Address Masking', () => {
    it('should mask email addresses in logs for privacy', () => {
      const maskEmail = (EmailService as any).maskEmail;
      
      expect(maskEmail('user@example.com')).toBe('u***r@example.com');
      expect(maskEmail('a@test.com')).toBe('***@test.com');
      expect(maskEmail('invalid-email')).toBe('***@***');
    });
  });

  describe('Service Health', () => {
    it('should report correct health status', () => {
      (EmailService as any).resendClient = { emails: { send: jest.fn() } };
      
      const health = EmailService.getHealthStatus();
      expect(health).toEqual({
        status: 'connected',
        provider: 'Resend',
        configured: expect.any(Boolean)
      });
    });
  });

  describe('Test Email Generation', () => {
    it('should generate test email with service information', async () => {
      (EmailService as any).resendClient = null;
      (EmailService as any).isInitialized = true;

      const result = await EmailService.sendTestEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('MOCK');
    });
  });
});
