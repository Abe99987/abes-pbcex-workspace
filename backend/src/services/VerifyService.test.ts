/**
 * VerifyService Test Scaffold
 * Basic tests for Twilio Verify integration with mocking
 */

import { VerifyService } from './VerifyService';

// Mock Twilio
jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    verify: {
      v2: {
        services: jest.fn().mockReturnValue({
          verifications: {
            create: jest.fn(),
            verificationChecks: {
              create: jest.fn()
            }
          }
        })
      }
    }
  }))
}));

describe('VerifyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (VerifyService as any).twilioClient = null;
    (VerifyService as any).isInitialized = false;
  });

  describe('Initialization', () => {
    it('should initialize successfully with Twilio credentials', async () => {
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      const originalToken = process.env.TWILIO_AUTH_TOKEN;
      const originalServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

      process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
      process.env.TWILIO_VERIFY_SERVICE_SID = 'test_service_sid';

      await VerifyService.initialize();
      
      const health = VerifyService.getHealthStatus();
      expect(health.status).toBe('connected');
      expect(health.provider).toBe('Twilio');

      // Restore original env
      process.env.TWILIO_ACCOUNT_SID = originalSid;
      process.env.TWILIO_AUTH_TOKEN = originalToken;
      process.env.TWILIO_VERIFY_SERVICE_SID = originalServiceSid;
    });

    it('should initialize in mock mode without credentials', async () => {
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      const originalToken = process.env.TWILIO_AUTH_TOKEN;

      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      await VerifyService.initialize();
      
      const health = VerifyService.getHealthStatus();
      expect(health.status).toBe('mock');
      expect(health.provider).toBe('Mock');

      // Restore original env
      process.env.TWILIO_ACCOUNT_SID = originalSid;
      process.env.TWILIO_AUTH_TOKEN = originalToken;
    });
  });

  describe('Start Verification', () => {
    it('should start verification successfully with valid phone number', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        sid: 'verification_123',
        status: 'pending',
        channel: 'sms'
      });

      (VerifyService as any).twilioClient = {
        verify: {
          v2: {
            services: () => ({
              verifications: { create: mockCreate }
            })
          }
        }
      };
      (VerifyService as any).isInitialized = true;

      const result = await VerifyService.startVerification('+15555551234');

      expect(result.success).toBe(true);
      expect(result.data?.verificationId).toBe('verification_123');
      expect(result.data?.status).toBe('pending');
      expect(mockCreate).toHaveBeenCalledWith({
        to: '+15555551234',
        channel: 'sms'
      });
    });

    it('should handle Twilio API errors gracefully', async () => {
      const mockCreate = jest.fn().mockRejectedValue(
        new Error('Invalid phone number format')
      );

      (VerifyService as any).twilioClient = {
        verify: {
          v2: {
            services: () => ({
              verifications: { create: mockCreate }
            })
          }
        }
      };
      (VerifyService as any).isInitialized = true;

      const result = await VerifyService.startVerification('invalid-phone');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should validate phone number format', async () => {
      const result = await VerifyService.startVerification('123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should fall back to mock mode when Twilio is unavailable', async () => {
      (VerifyService as any).twilioClient = null;
      (VerifyService as any).isInitialized = true;

      const result = await VerifyService.startVerification('+15555551234');

      expect(result.success).toBe(true);
      expect(result.data?.verificationId).toMatch(/^mock_verification_/);
      expect(result.data?.status).toBe('pending');
    });
  });

  describe('Check Verification', () => {
    it('should verify code successfully', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        sid: 'check_123',
        status: 'approved',
        valid: true
      });

      (VerifyService as any).twilioClient = {
        verify: {
          v2: {
            services: () => ({
              verificationChecks: { create: mockCreate }
            })
          }
        }
      };
      (VerifyService as any).isInitialized = true;

      const result = await VerifyService.checkVerification('+15555551234', '123456');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('approved');
      expect(result.data?.valid).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        to: '+15555551234',
        code: '123456'
      });
    });

    it('should handle invalid verification codes', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        sid: 'check_123',
        status: 'denied',
        valid: false
      });

      (VerifyService as any).twilioClient = {
        verify: {
          v2: {
            services: () => ({
              verificationChecks: { create: mockCreate }
            })
          }
        }
      };
      (VerifyService as any).isInitialized = true;

      const result = await VerifyService.checkVerification('+15555551234', '000000');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('denied');
      expect(result.data?.valid).toBe(false);
    });

    it('should use mock approval for test codes', async () => {
      (VerifyService as any).twilioClient = null;
      (VerifyService as any).isInitialized = true;

      // Test codes that should be auto-approved in mock mode
      const testCodes = ['123456', '000000', '111111'];

      for (const code of testCodes) {
        const result = await VerifyService.checkVerification('+15555551234', code);
        expect(result.success).toBe(true);
        expect(result.data?.valid).toBe(true);
        expect(result.data?.status).toBe('approved');
      }
    });

    it('should reject invalid mock codes', async () => {
      (VerifyService as any).twilioClient = null;
      (VerifyService as any).isInitialized = true;

      const result = await VerifyService.checkVerification('+15555551234', '999999');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.status).toBe('denied');
    });
  });

  describe('Rate Limiting', () => {
    it('should track verification attempts per phone number', async () => {
      // This would be enhanced to test actual rate limiting
      // For now, just ensure the service can be called multiple times
      const phone = '+15555551234';
      
      const result1 = await VerifyService.startVerification(phone);
      const result2 = await VerifyService.startVerification(phone);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Phone Number Formatting', () => {
    it('should handle different phone number formats', async () => {
      const phoneNumbers = [
        '+15555551234',
        '15555551234',
        '555-555-1234',
        '(555) 555-1234'
      ];

      // Mock mode should handle various formats gracefully
      (VerifyService as any).twilioClient = null;
      (VerifyService as any).isInitialized = true;

      for (const phone of phoneNumbers) {
        const result = await VerifyService.startVerification(phone);
        // At minimum, should not crash
        expect(result).toBeDefined();
      }
    });
  });

  describe('Service Health', () => {
    it('should report correct health status', () => {
      (VerifyService as any).twilioClient = { verify: { v2: {} } };
      
      const health = VerifyService.getHealthStatus();
      expect(health).toEqual({
        status: 'connected',
        provider: 'Twilio',
        configured: expect.any(Boolean)
      });
    });
  });
});
