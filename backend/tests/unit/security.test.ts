import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

/**
 * Security-focused Unit Tests
 * 
 * Tests critical security components including:
 * - Password hashing and validation
 * - JWT token security
 * - Input sanitization and validation
 * - PII/secret redaction in logs
 * - Rate limiting implementation
 * - SQL injection prevention
 */

describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Password Security', () => {
    test('should hash passwords with sufficient complexity', async () => {
      const plainPassword = 'TestPassword123!';
      const saltRounds = 12;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
      
      // Verify hash properties
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[ab]\$12\$/); // bcrypt format with cost 12
      
      // Verify password can be verified
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
      
      // Verify wrong password fails
      const isWrongValid = await bcrypt.compare('WrongPassword123!', hashedPassword);
      expect(isWrongValid).toBe(false);
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        '12345678',        // Only numbers
        'password',        // Only lowercase
        'PASSWORD',        // Only uppercase
        'Pass123',         // Too short
        'passwordwithoutcaps123', // No uppercase or special chars
        'PASSWORD123',     // No lowercase
        'Password',        // No numbers or special chars
        '',                // Empty
        'abc',             // Too short
      ];

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      weakPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(false);
      });
    });

    test('should accept strong passwords', () => {
      const strongPasswords = [
        'TestPassword123!',
        'MySecure@Pass1',
        'Complex&Strong9',
        'Tr@d3r$ecure',
        'P@ssw0rd!Strong',
      ];

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      strongPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(true);
      });
    });

    test('should use timing-safe password comparison', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      // Measure timing for correct password
      const startCorrect = process.hrtime.bigint();
      await bcrypt.compare(password, hash);
      const timeCorrect = process.hrtime.bigint() - startCorrect;
      
      // Measure timing for incorrect password
      const startIncorrect = process.hrtime.bigint();
      await bcrypt.compare('WrongPassword123!', hash);
      const timeIncorrect = process.hrtime.bigint() - startIncorrect;
      
      // bcrypt should have similar timing for both cases (within reasonable bounds)
      const timeDifference = Math.abs(Number(timeCorrect - timeIncorrect)) / 1000000; // Convert to ms
      expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
    });
  });

  describe('JWT Token Security', () => {
    const JWT_SECRET = 'test-secret-key-for-testing-only';
    const testUserId = 'user-12345';

    test('should generate secure JWT tokens', () => {
      const payload = {
        userId: testUserId,
        role: 'USER',
        email: 'test@example.com',
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'pbcex-api',
        audience: 'pbcex-client',
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.role).toBe('USER');
      expect(decoded.iss).toBe('pbcex-api');
      expect(decoded.aud).toBe('pbcex-client');
    });

    test('should reject tampered tokens', () => {
      const payload = { userId: testUserId };
      const token = jwt.sign(payload, JWT_SECRET);
      
      // Tamper with the token
      const tamperedToken = token.slice(0, -10) + 'tampered123';
      
      expect(() => {
        jwt.verify(tamperedToken, JWT_SECRET);
      }).toThrow('invalid signature');
    });

    test('should reject expired tokens', () => {
      const payload = { userId: testUserId };
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
      
      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }).toThrow('jwt expired');
    });

    test('should reject tokens with wrong secret', () => {
      const payload = { userId: testUserId };
      const token = jwt.sign(payload, JWT_SECRET);
      
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow('invalid signature');
    });

    test('should include security claims in token', () => {
      const payload = {
        userId: testUserId,
        role: 'USER',
        sessionId: 'session-12345',
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1h',
        issuer: 'pbcex-api',
        audience: 'pbcex-client',
        jwtid: 'jwt-12345',
        subject: testUserId,
      });

      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      
      expect(decoded.sub).toBe(testUserId);
      expect(decoded.iss).toBe('pbcex-api');
      expect(decoded.aud).toBe('pbcex-client');
      expect(decoded.jti).toBe('jwt-12345');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
        "'; DELETE FROM accounts WHERE '1'='1",
        "admin'--",
        "admin' /*",
        "' OR 1=1#",
        "' OR 'x'='x",
        "') OR ('1'='1",
      ];

      // Mock input sanitization function
      function sanitizeInput(input: string): string {
        return input
          .replace(/['"]/g, '') // Remove quotes
          .replace(/[;--]/g, '') // Remove SQL comment markers
          .replace(/\bUNION\b/gi, '') // Remove UNION keyword
          .replace(/\bSELECT\b/gi, '') // Remove SELECT keyword
          .replace(/\bDROP\b/gi, '') // Remove DROP keyword
          .replace(/\bDELETE\b/gi, '') // Remove DELETE keyword
          .replace(/\bINSERT\b/gi, '') // Remove INSERT keyword
          .replace(/\bUPDATE\b/gi, '') // Remove UPDATE keyword
          .trim();
      }

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain('"');
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
        expect(sanitized.toUpperCase()).not.toContain('UNION');
        expect(sanitized.toUpperCase()).not.toContain('SELECT');
        expect(sanitized.toUpperCase()).not.toContain('DROP');
      });
    });

    test('should sanitize XSS attempts', () => {
      const xssInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)">',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<link rel="stylesheet" href="javascript:alert(1)">',
        '<style>@import "javascript:alert(1)"</style>',
      ];

      // Mock XSS sanitization function
      function sanitizeXSS(input: string): string {
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
          .replace(/<embed[^>]*>/gi, '')
          .replace(/<link[^>]*>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }

      xssInputs.forEach(input => {
        const sanitized = sanitizeXSS(input);
        expect(sanitized.toLowerCase()).not.toContain('<script');
        expect(sanitized.toLowerCase()).not.toContain('<iframe');
        expect(sanitized.toLowerCase()).not.toContain('javascript:');
        expect(sanitized.toLowerCase()).not.toContain('onerror=');
        expect(sanitized.toLowerCase()).not.toContain('onload=');
      });
    });

    test('should validate email addresses securely', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example-domain.com',
      ];

      const invalidEmails = [
        'user@',
        '@domain.com',
        'user..name@domain.com',
        'user@domain',
        'user space@domain.com',
        '<script>alert(1)</script>@domain.com',
        'user@domain.com<script>',
      ];

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('PII and Secret Redaction', () => {
    test('should redact sensitive information in logs', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'SecretPassword123!',
        ssn: '123-45-6789',
        token: 'jwt-token-12345',
        authorization: 'Bearer token-12345',
        api_key: 'api-key-secret',
        secret_key: 'secret-value',
        creditCard: '4111-1111-1111-1111',
        phone: '+1-555-0123',
        address: '123 Main St, City, State',
      };

      // Mock log redaction function
      function redactSensitiveData(data: Record<string, any>): Record<string, any> {
        const redacted = { ...data };
        const sensitiveFields = [
          'password', 'token', 'authorization', 'api_key', 'secret_key',
          'ssn', 'creditCard', 'credit_card', 'cvv', 'pin'
        ];

        const sensitivePatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
          /Bearer\s+[\w-]+/gi, // Bearer tokens
        ];

        Object.keys(redacted).forEach(key => {
          if (sensitiveFields.includes(key.toLowerCase())) {
            redacted[key] = '[REDACTED]';
          } else if (typeof redacted[key] === 'string') {
            sensitivePatterns.forEach(pattern => {
              redacted[key] = redacted[key].replace(pattern, '[REDACTED]');
            });
          }
        });

        return redacted;
      }

      const redactedData = redactSensitiveData(sensitiveData);

      expect(redactedData.password).toBe('[REDACTED]');
      expect(redactedData.token).toBe('[REDACTED]');
      expect(redactedData.authorization).toBe('[REDACTED]');
      expect(redactedData.api_key).toBe('[REDACTED]');
      expect(redactedData.secret_key).toBe('[REDACTED]');
      expect(redactedData.ssn).toBe('[REDACTED]');
      expect(redactedData.creditCard).toBe('[REDACTED]');
      
      // Should preserve non-sensitive data
      expect(redactedData.email).toBe('user@example.com');
      expect(redactedData.phone).toBe('+1-555-0123');
    });

    test('should redact authorization headers in HTTP logs', () => {
      const httpRequest = {
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer jwt-token-12345',
          'x-api-key': 'api-key-secret-value',
          'user-agent': 'PBCEx-Client/1.0',
        },
        body: {
          email: 'user@example.com',
          password: 'UserPassword123!',
        },
      };

      // Mock HTTP log redaction
      function redactHttpLog(request: any): any {
        const redacted = JSON.parse(JSON.stringify(request));
        
        // Redact authorization headers
        if (redacted.headers) {
          Object.keys(redacted.headers).forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('auth') || lowerHeader.includes('key') || lowerHeader.includes('token')) {
              redacted.headers[header] = '[REDACTED]';
            }
          });
        }

        // Redact sensitive body fields
        if (redacted.body && typeof redacted.body === 'object') {
          const sensitiveBodyFields = ['password', 'token', 'secret', 'key'];
          Object.keys(redacted.body).forEach(field => {
            if (sensitiveBodyFields.some(sensitive => field.toLowerCase().includes(sensitive))) {
              redacted.body[field] = '[REDACTED]';
            }
          });
        }

        return redacted;
      }

      const redactedRequest = redactHttpLog(httpRequest);

      expect(redactedRequest.headers.authorization).toBe('[REDACTED]');
      expect(redactedRequest.headers['x-api-key']).toBe('[REDACTED]');
      expect(redactedRequest.body.password).toBe('[REDACTED]');
      expect(redactedRequest.body.email).toBe('user@example.com'); // Email should remain
      expect(redactedRequest.method).toBe('POST'); // Other fields should remain
    });
  });

  describe('Rate Limiting', () => {
    test('should implement rate limiting logic', () => {
      class RateLimiter {
        private requests: Map<string, number[]> = new Map();
        
        constructor(
          private maxRequests: number,
          private windowMs: number
        ) {}

        isAllowed(identifier: string): boolean {
          const now = Date.now();
          const requests = this.requests.get(identifier) || [];
          
          // Remove expired requests
          const validRequests = requests.filter(timestamp => 
            now - timestamp < this.windowMs
          );
          
          // Check if limit exceeded
          if (validRequests.length >= this.maxRequests) {
            return false;
          }
          
          // Add current request
          validRequests.push(now);
          this.requests.set(identifier, validRequests);
          
          return true;
        }

        getRemainingRequests(identifier: string): number {
          const now = Date.now();
          const requests = this.requests.get(identifier) || [];
          const validRequests = requests.filter(timestamp => 
            now - timestamp < this.windowMs
          );
          
          return Math.max(0, this.maxRequests - validRequests.length);
        }

        getResetTime(identifier: string): number {
          const requests = this.requests.get(identifier) || [];
          if (requests.length === 0) return 0;
          
          const oldestRequest = Math.min(...requests);
          return oldestRequest + this.windowMs;
        }
      }

      const rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
      const clientId = 'client-123';

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(clientId)).toBe(true);
      }

      // Should block 6th request
      expect(rateLimiter.isAllowed(clientId)).toBe(false);
      expect(rateLimiter.getRemainingRequests(clientId)).toBe(0);
    });

    test('should reset rate limit after window expires', () => {
      class MockRateLimiter {
        private requests: Map<string, number[]> = new Map();
        private mockTime = Date.now();
        
        constructor(
          private maxRequests: number,
          private windowMs: number
        ) {}

        setMockTime(time: number): void {
          this.mockTime = time;
        }

        isAllowed(identifier: string): boolean {
          const now = this.mockTime;
          const requests = this.requests.get(identifier) || [];
          
          const validRequests = requests.filter(timestamp => 
            now - timestamp < this.windowMs
          );
          
          if (validRequests.length >= this.maxRequests) {
            return false;
          }
          
          validRequests.push(now);
          this.requests.set(identifier, validRequests);
          
          return true;
        }
      }

      const rateLimiter = new MockRateLimiter(3, 5000); // 3 requests per 5 seconds
      const clientId = 'client-456';
      const baseTime = Date.now();

      rateLimiter.setMockTime(baseTime);

      // Fill up the rate limit
      expect(rateLimiter.isAllowed(clientId)).toBe(true);
      expect(rateLimiter.isAllowed(clientId)).toBe(true);
      expect(rateLimiter.isAllowed(clientId)).toBe(true);
      expect(rateLimiter.isAllowed(clientId)).toBe(false); // 4th request blocked

      // Move time forward past the window
      rateLimiter.setMockTime(baseTime + 6000); // 6 seconds later

      // Should allow requests again
      expect(rateLimiter.isAllowed(clientId)).toBe(true);
      expect(rateLimiter.isAllowed(clientId)).toBe(true);
    });
  });

  describe('Timing Attack Prevention', () => {
    test('should use constant-time string comparison', () => {
      // Mock constant-time comparison function
      function constantTimeEquals(a: string, b: string): boolean {
        if (a.length !== b.length) {
          return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
      }

      const secret = 'secret-api-key-12345';
      const validKey = 'secret-api-key-12345';
      const invalidKey = 'wrong-api-key-67890';

      expect(constantTimeEquals(secret, validKey)).toBe(true);
      expect(constantTimeEquals(secret, invalidKey)).toBe(false);
      expect(constantTimeEquals(secret, 'short')).toBe(false);
    });

    test('should implement delay on failed authentication attempts', async () => {
      class AuthenticationService {
        private failedAttempts: Map<string, number> = new Map();
        
        async authenticateWithDelay(userId: string, password: string): Promise<boolean> {
          const attempts = this.failedAttempts.get(userId) || 0;
          
          // Implement exponential backoff delay
          if (attempts > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000); // Max 30 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // Mock authentication (always fails for test)
          const isValid = false;
          
          if (!isValid) {
            this.failedAttempts.set(userId, attempts + 1);
          } else {
            this.failedAttempts.delete(userId);
          }
          
          return isValid;
        }

        getFailedAttempts(userId: string): number {
          return this.failedAttempts.get(userId) || 0;
        }
      }

      const authService = new AuthenticationService();
      const userId = 'user-123';

      // First failed attempt
      const start1 = Date.now();
      await authService.authenticateWithDelay(userId, 'wrong-password');
      const duration1 = Date.now() - start1;

      expect(authService.getFailedAttempts(userId)).toBe(1);
      expect(duration1).toBeLessThan(100); // First attempt should be fast

      // Second failed attempt should have delay
      const start2 = Date.now();
      await authService.authenticateWithDelay(userId, 'wrong-password');
      const duration2 = Date.now() - start2;

      expect(authService.getFailedAttempts(userId)).toBe(2);
      expect(duration2).toBeGreaterThan(900); // Should have ~1 second delay
    });
  });

  describe('Cryptographic Operations', () => {
    test('should use cryptographically secure random values', () => {
      const crypto = require('crypto');
      
      // Generate random bytes
      const randomBytes = crypto.randomBytes(32);
      expect(randomBytes).toHaveLength(32);
      
      // Generate random hex string
      const randomHex = crypto.randomBytes(16).toString('hex');
      expect(randomHex).toHaveLength(32);
      expect(randomHex).toMatch(/^[a-f0-9]+$/);
      
      // Generate random UUID
      const uuid = crypto.randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should properly handle encryption/decryption', () => {
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      function encrypt(text: string): { encrypted: string; authTag: string } {
        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from('pbcex-encryption', 'utf8'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        return { encrypted, authTag };
      }
      
      function decrypt(encrypted: string, authTag: string): string {
        const decipher = crypto.createDecipher(algorithm, key);
        decipher.setAAD(Buffer.from('pbcex-encryption', 'utf8'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      }
      
      const plaintext = 'sensitive-user-data-12345';
      const { encrypted, authTag } = encrypt(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(authTag).toBeDefined();
      
      const decrypted = decrypt(encrypted, authTag);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Environment Security', () => {
    test('should validate environment variables for security', () => {
      const requiredSecurityEnvVars = [
        'JWT_SECRET',
        'DATABASE_URL',
        'REDIS_URL',
      ];

      const optionalSecurityEnvVars = [
        'API_KEY_ENCRYPTION_KEY',
        'SESSION_SECRET',
        'WEBHOOK_SECRET',
      ];

      // Mock environment validation
      function validateEnvironment(): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        requiredSecurityEnvVars.forEach(envVar => {
          const value = process.env[envVar];
          if (!value) {
            errors.push(`Missing required environment variable: ${envVar}`);
          } else if (value.length < 16) {
            errors.push(`Environment variable ${envVar} is too short (minimum 16 characters)`);
          } else if (value === 'default' || value === 'changeme') {
            errors.push(`Environment variable ${envVar} uses default/insecure value`);
          }
        });

        optionalSecurityEnvVars.forEach(envVar => {
          const value = process.env[envVar];
          if (!value) {
            warnings.push(`Optional security environment variable not set: ${envVar}`);
          }
        });

        return { errors, warnings };
      }

      // Set test environment variables
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-16-chars-minimum';
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const validation = validateEnvironment();
      expect(validation.errors).toHaveLength(0);
      
      // Clean up
      delete process.env.JWT_SECRET;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
    });

    test('should detect insecure environment configurations', () => {
      const insecureConfigs = {
        NODE_ENV: 'development', // Should be production in prod
        DEBUG: 'true',           // Should be false in prod
        CORS_ORIGIN: '*',        // Should be specific origins
        SSL_VERIFY: 'false',     // Should be true
        LOG_LEVEL: 'debug',      // Should be warn/error in prod
      };

      function detectInsecureConfig(config: Record<string, string>): string[] {
        const issues: string[] = [];

        if (config.NODE_ENV === 'development') {
          issues.push('NODE_ENV is set to development');
        }

        if (config.DEBUG === 'true') {
          issues.push('Debug mode is enabled');
        }

        if (config.CORS_ORIGIN === '*') {
          issues.push('CORS allows all origins');
        }

        if (config.SSL_VERIFY === 'false') {
          issues.push('SSL verification is disabled');
        }

        if (config.LOG_LEVEL === 'debug') {
          issues.push('Debug logging is enabled');
        }

        return issues;
      }

      const issues = detectInsecureConfig(insecureConfigs);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues).toContain('NODE_ENV is set to development');
      expect(issues).toContain('Debug mode is enabled');
    });
  });
});
