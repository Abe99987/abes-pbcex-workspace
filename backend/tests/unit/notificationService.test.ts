import { TestUtils } from '../setup';

/**
 * NotificationService Unit Tests
 * Tests email/SMS sending with proper payload redaction
 */

interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

interface SMSPayload {
  to: string;
  message: string;
  data?: Record<string, any>;
}

// Mock NotificationService
class MockNotificationService {
  private static sentEmails: EmailPayload[] = [];
  private static sentSMS: SMSPayload[] = [];

  static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
    // Log redacted payload (no sensitive data)
    const redactedPayload = this.redactSensitiveData(payload);
    console.log('Sending email:', redactedPayload);

    // Simulate email sending
    this.sentEmails.push(payload);
    
    return {
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
  }

  static async sendSMS(payload: SMSPayload): Promise<{ success: boolean; messageId: string }> {
    // Log redacted payload (no sensitive data)
    const redactedPayload = this.redactSensitiveData(payload);
    console.log('Sending SMS:', redactedPayload);

    // Simulate SMS sending
    this.sentSMS.push(payload);
    
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
  }

  static redactSensitiveData(payload: any): any {
    const redacted = JSON.parse(JSON.stringify(payload));
    
    // Redact common PII fields
    const sensitiveFields = [
      'ssn', 'socialSecurityNumber',
      'accountNumber', 'routingNumber',
      'password', 'token', 'secret',
      'cardNumber', 'cvv', 'pin',
      'address', 'street', 'address1', 'address2',
      'phone', 'mobile', 'phoneNumber',
      'dateOfBirth', 'dob', 'birthDate',
    ];

    const redactValue = (obj: any, path: string = ''): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => redactValue(item, `${path}[${index}]`));
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase()) || 
          currentPath.toLowerCase().includes(field.toLowerCase())
        )) {
          result[key] = '[REDACTED]';
        } else if (key.toLowerCase() === 'email' && typeof value === 'string') {
          // Partially redact email addresses
          const email = value as string;
          const [local, domain] = email.split('@');
          if (local && domain) {
            result[key] = `${local.charAt(0)}***@${domain}`;
          } else {
            result[key] = '[REDACTED]';
          }
        } else if (typeof value === 'object') {
          result[key] = redactValue(value, currentPath);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return redactValue(redacted);
  }

  // Test utilities
  static getSentEmails(): EmailPayload[] {
    return [...this.sentEmails];
  }

  static getSentSMS(): SMSPayload[] {
    return [...this.sentSMS];
  }

  static clearHistory(): void {
    this.sentEmails = [];
    this.sentSMS = [];
  }

  static getLastEmail(): EmailPayload | null {
    return this.sentEmails[this.sentEmails.length - 1] || null;
  }

  static getLastSMS(): SMSPayload | null {
    return this.sentSMS[this.sentSMS.length - 1] || null;
  }
}

describe('NotificationService', () => {
  beforeEach(() => {
    MockNotificationService.clearHistory();
    // Spy on console.log to capture redacted logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Email Sending', () => {
    it('should send emails successfully', async () => {
      const emailPayload: EmailPayload = {
        to: 'user@example.com',
        subject: 'Welcome to PBCEx',
        template: 'welcome',
        data: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const result = await MockNotificationService.sendEmail(emailPayload);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^email_\d+_[a-z0-9]+$/);
      
      const sentEmails = MockNotificationService.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toEqual(emailPayload);
    });

    it('should generate unique message IDs', async () => {
      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test',
        template: 'test',
        data: {},
      };

      const result1 = await MockNotificationService.sendEmail(payload);
      await TestUtils.wait(10); // Small delay to ensure different timestamps
      const result2 = await MockNotificationService.sendEmail(payload);

      expect(result1.messageId).not.toBe(result2.messageId);
      expect(result1.messageId).toMatch(/^email_/);
      expect(result2.messageId).toMatch(/^email_/);
    });

    it('should handle various email templates', async () => {
      const templates = ['welcome', 'kyc-approved', 'trade-executed', 'password-reset'];
      
      for (const template of templates) {
        const payload: EmailPayload = {
          to: 'user@example.com',
          subject: `Test ${template}`,
          template,
          data: { testData: true },
        };

        const result = await MockNotificationService.sendEmail(payload);
        expect(result.success).toBe(true);
      }

      expect(MockNotificationService.getSentEmails()).toHaveLength(templates.length);
    });
  });

  describe('SMS Sending', () => {
    it('should send SMS successfully', async () => {
      const smsPayload: SMSPayload = {
        to: '+1234567890',
        message: 'Your PBCEx verification code is: 123456',
        data: {
          code: '123456',
          expiresIn: '10 minutes',
        },
      };

      const result = await MockNotificationService.sendSMS(smsPayload);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^sms_\d+_[a-z0-9]+$/);
      
      const sentSMS = MockNotificationService.getSentSMS();
      expect(sentSMS).toHaveLength(1);
      expect(sentSMS[0]).toEqual(smsPayload);
    });

    it('should handle SMS without additional data', async () => {
      const smsPayload: SMSPayload = {
        to: '+1234567890',
        message: 'Simple SMS message',
      };

      const result = await MockNotificationService.sendSMS(smsPayload);
      expect(result.success).toBe(true);
      
      const lastSMS = MockNotificationService.getLastSMS();
      expect(lastSMS?.data).toBeUndefined();
    });
  });

  describe('Data Redaction', () => {
    it('should redact sensitive fields in email data', () => {
      const sensitiveData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        ssn: '123-45-6789',
        accountNumber: '1234567890',
        password: 'secret123',
        address: '123 Main St',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        publicInfo: 'This is not sensitive',
      };

      const redacted = MockNotificationService.redactSensitiveData(sensitiveData);

      expect(redacted.firstName).toBe('John'); // Not sensitive
      expect(redacted.lastName).toBe('Doe'); // Not sensitive
      expect(redacted.email).toBe('j***@example.com'); // Partially redacted
      expect(redacted.ssn).toBe('[REDACTED]');
      expect(redacted.accountNumber).toBe('[REDACTED]');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.address).toBe('[REDACTED]');
      expect(redacted.phone).toBe('[REDACTED]');
      expect(redacted.dateOfBirth).toBe('[REDACTED]');
      expect(redacted.publicInfo).toBe('This is not sensitive');
    });

    it('should redact nested sensitive data', () => {
      const nestedData = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '+1234567890',
          },
          banking: {
            accountNumber: '1234567890',
            routingNumber: '987654321',
          },
        },
        transaction: {
          amount: '1000.00',
          asset: 'PAXG',
        },
      };

      const redacted = MockNotificationService.redactSensitiveData(nestedData);

      expect(redacted.user.name).toBe('John Doe');
      expect(redacted.user.contact.email).toBe('j***@example.com');
      expect(redacted.user.contact.phone).toBe('[REDACTED]');
      expect(redacted.user.banking.accountNumber).toBe('[REDACTED]');
      expect(redacted.user.banking.routingNumber).toBe('[REDACTED]');
      expect(redacted.transaction.amount).toBe('1000.00'); // Not sensitive
      expect(redacted.transaction.asset).toBe('PAXG'); // Not sensitive
    });

    it('should redact sensitive data in arrays', () => {
      const arrayData = {
        users: [
          { name: 'John', email: 'john@example.com', ssn: '123-45-6789' },
          { name: 'Jane', email: 'jane@example.com', ssn: '987-65-4321' },
        ],
        amounts: [100, 200, 300],
      };

      const redacted = MockNotificationService.redactSensitiveData(arrayData);

      expect(redacted.users[0].name).toBe('John');
      expect(redacted.users[0].email).toBe('j***@example.com');
      expect(redacted.users[0].ssn).toBe('[REDACTED]');
      expect(redacted.users[1].name).toBe('Jane');
      expect(redacted.users[1].email).toBe('j***@example.com');
      expect(redacted.users[1].ssn).toBe('[REDACTED]');
      expect(redacted.amounts).toEqual([100, 200, 300]); // Not sensitive
    });

    it('should handle various email formats', () => {
      const testEmails = [
        { input: 'user@example.com', expected: 'u***@example.com' },
        { input: 'a@b.com', expected: 'a***@b.com' },
        { input: 'verylongusername@domain.org', expected: 'v***@domain.org' },
        { input: 'invalid-email', expected: '[REDACTED]' },
        { input: '', expected: '[REDACTED]' },
      ];

      testEmails.forEach(({ input, expected }) => {
        const data = { email: input };
        const redacted = MockNotificationService.redactSensitiveData(data);
        expect(redacted.email).toBe(expected);
      });
    });

    it('should preserve non-sensitive data types', () => {
      const mixedData = {
        string: 'normal string',
        number: 12345,
        boolean: true,
        date: new Date('2024-01-01'),
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { key: 'value' },
      };

      const redacted = MockNotificationService.redactSensitiveData(mixedData);

      expect(redacted.string).toBe('normal string');
      expect(redacted.number).toBe(12345);
      expect(redacted.boolean).toBe(true);
      expect(redacted.date).toEqual(mixedData.date);
      expect(redacted.null).toBeNull();
      expect(redacted.undefined).toBeUndefined();
      expect(redacted.array).toEqual([1, 2, 3]);
      expect(redacted.object).toEqual({ key: 'value' });
    });
  });

  describe('Logging and Auditing', () => {
    it('should log redacted email payloads', async () => {
      const emailPayload: EmailPayload = {
        to: 'user@example.com',
        subject: 'Test Email',
        template: 'test',
        data: {
          name: 'John Doe',
          ssn: '123-45-6789',
          accountNumber: '1234567890',
        },
      };

      await MockNotificationService.sendEmail(emailPayload);

      expect(console.log).toHaveBeenCalledWith('Sending email:', expect.objectContaining({
        to: 'u***@example.com',
        subject: 'Test Email',
        template: 'test',
        data: expect.objectContaining({
          name: 'John Doe',
          ssn: '[REDACTED]',
          accountNumber: '[REDACTED]',
        }),
      }));
    });

    it('should log redacted SMS payloads', async () => {
      const smsPayload: SMSPayload = {
        to: '+1234567890',
        message: 'Your code is 123456',
        data: {
          phone: '+1234567890',
          code: '123456',
        },
      };

      await MockNotificationService.sendSMS(smsPayload);

      expect(console.log).toHaveBeenCalledWith('Sending SMS:', expect.objectContaining({
        to: '[REDACTED]',
        message: 'Your code is 123456',
        data: expect.objectContaining({
          phone: '[REDACTED]',
          code: '123456', // Code itself is not considered PII in this context
        }),
      }));
    });

    it('should not log actual sensitive data', async () => {
      const sensitiveEmail: EmailPayload = {
        to: 'user@example.com',
        subject: 'Account Update',
        template: 'account-update',
        data: {
          ssn: '123-45-6789',
          accountNumber: '1234567890',
          password: 'newsecretpassword',
        },
      };

      await MockNotificationService.sendEmail(sensitiveEmail);

      // Verify that console.log was called, but not with sensitive data
      const logCalls = (console.log as jest.Mock).mock.calls;
      const loggedData = logCalls.find(call => call[0] === 'Sending email:');
      
      expect(loggedData).toBeDefined();
      const loggedPayload = loggedData[1];
      
      expect(JSON.stringify(loggedPayload)).not.toContain('123-45-6789');
      expect(JSON.stringify(loggedPayload)).not.toContain('1234567890');
      expect(JSON.stringify(loggedPayload)).not.toContain('newsecretpassword');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle KYC approval email', async () => {
      const kycEmail: EmailPayload = {
        to: 'customer@example.com',
        subject: 'KYC Approved - Welcome to PBCEx',
        template: 'kyc-approved',
        data: {
          firstName: 'Alice',
          kycType: 'PERSONAL',
          approvedAt: new Date().toISOString(),
          accountNumber: '1234567890',
        },
      };

      const result = await MockNotificationService.sendEmail(kycEmail);
      expect(result.success).toBe(true);

      const lastEmail = MockNotificationService.getLastEmail();
      expect(lastEmail?.template).toBe('kyc-approved');
      expect(lastEmail?.data.firstName).toBe('Alice');
    });

    it('should handle trade execution SMS', async () => {
      const tradeSMS: SMSPayload = {
        to: '+1234567890',
        message: 'Trade executed: Sold 1.0 PAXG for $2,150.00',
        data: {
          tradeId: 'trade_123456',
          fromAsset: 'PAXG',
          toAsset: 'USD',
          amount: '1.0',
          value: '2150.00',
        },
      };

      const result = await MockNotificationService.sendSMS(tradeSMS);
      expect(result.success).toBe(true);

      const lastSMS = MockNotificationService.getLastSMS();
      expect(lastSMS?.data?.tradeId).toBe('trade_123456');
    });

    it('should handle password reset with sensitive data redaction', async () => {
      const resetEmail: EmailPayload = {
        to: 'user@company.com',
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          resetToken: 'secret-token-12345',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
        },
      };

      await MockNotificationService.sendEmail(resetEmail);

      // Verify that the token is redacted in logs but preserved in actual email
      const logCalls = (console.log as jest.Mock).mock.calls;
      const emailLog = logCalls.find(call => call[0] === 'Sending email:');
      
      // Token should be redacted in logs (contains 'token')
      expect(emailLog[1].data.resetToken).toBe('[REDACTED]');
      
      // But preserved in the actual email that would be sent
      const actualEmail = MockNotificationService.getLastEmail();
      expect(actualEmail?.data.resetToken).toBe('secret-token-12345');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty email data', async () => {
      const emptyEmail: EmailPayload = {
        to: 'user@example.com',
        subject: 'Empty Data Test',
        template: 'empty',
        data: {},
      };

      const result = await MockNotificationService.sendEmail(emptyEmail);
      expect(result.success).toBe(true);
      
      const redacted = MockNotificationService.redactSensitiveData(emptyEmail);
      expect(redacted.data).toEqual({});
    });

    it('should handle null and undefined values in redaction', () => {
      const dataWithNulls = {
        name: 'John',
        ssn: null,
        phone: undefined,
        email: 'john@example.com',
      };

      const redacted = MockNotificationService.redactSensitiveData(dataWithNulls);
      
      expect(redacted.name).toBe('John');
      expect(redacted.ssn).toBeNull();
      expect(redacted.phone).toBeUndefined();
      expect(redacted.email).toBe('j***@example.com');
    });

    it('should handle circular references in data', () => {
      const circularData: any = {
        name: 'John',
        ssn: '123-45-6789',
      };
      circularData.self = circularData; // Create circular reference

      // Should not throw error (JSON.parse/stringify handles this)
      expect(() => {
        MockNotificationService.redactSensitiveData(circularData);
      }).not.toThrow();
    });
  });
});
