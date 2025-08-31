/**
 * Redacting Logger Wrapper
 * Replaces sensitive information in logs to prevent secret exposure
 */

import { logInfo, logWarn, logError } from './logger';

/**
 * Patterns for detecting secrets in logs
 */
const SECRET_PATTERNS = [
  // Stripe API keys
  { pattern: /sk_(live|test)_[a-zA-Z0-9]+/gi, replacement: 'sk_***_[REDACTED]' },
  
  // AWS Access Keys
  { pattern: /AKIA[0-9A-Z]{16}/gi, replacement: 'AKIA[REDACTED]' },
  
  // Twilio tokens
  { pattern: /twilio.*auth.*token["\s:=]+[a-zA-Z0-9]+/gi, replacement: 'twilio_auth_token: [REDACTED]' },
  
  // Resend API keys
  { pattern: /resend.*api.*key["\s:=]+[a-zA-Z0-9]+/gi, replacement: 'resend_api_key: [REDACTED]' },
  
  // FedEx credentials
  { pattern: /fedex.*(secret|password|key)["\s:=]+[a-zA-Z0-9]+/gi, replacement: 'fedex_credential: [REDACTED]' },
  
  // Private keys
  { pattern: /-----BEGIN.*PRIVATE.*KEY-----[\s\S]*?-----END.*PRIVATE.*KEY-----/gi, replacement: '[PRIVATE_KEY_REDACTED]' },
  
  // Generic API tokens
  { pattern: /(access[_-]?token|refresh[_-]?token|api[_-]?key|bearer)["\s:=]+[a-zA-Z0-9-_]+/gi, replacement: '$1: [REDACTED]' },
  
  // JWT tokens (simplified detection)
  { pattern: /eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/gi, replacement: 'eyJ[JWT_REDACTED]' },
  
  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/gi, replacement: '****-****-****-[REDACTED]' },
  
  // Social Security Numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/gi, replacement: '***-**-[REDACTED]' },
  
  // Email addresses (when they might contain sensitive info)
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, replacement: '***@***.***' }
];

/**
 * Additional patterns for common secret naming conventions
 */
const ENV_VAR_PATTERNS = [
  { pattern: /(password|secret|key|token)\s*[=:]\s*[^\s\n]+/gi, replacement: '$1=[REDACTED]' },
  { pattern: /[A-Z_]+_(PASSWORD|SECRET|KEY|TOKEN)\s*[=:]\s*[^\s\n]+/gi, replacement: '$1=[REDACTED]' }
];

/**
 * Redact sensitive information from a string
 */
export function redactSecrets(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let redactedText = text;

  // Apply secret patterns
  SECRET_PATTERNS.forEach(({ pattern, replacement }) => {
    redactedText = redactedText.replace(pattern, replacement);
  });

  // Apply environment variable patterns
  ENV_VAR_PATTERNS.forEach(({ pattern, replacement }) => {
    redactedText = redactedText.replace(pattern, replacement);
  });

  return redactedText;
}

/**
 * Redact sensitive information from objects
 */
export function redactObject(obj: any): any {
  if (!obj) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactSecrets(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  if (typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact sensitive keys by name
      if (isSensitiveKey(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(value);
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * Check if a key name suggests sensitive information
 */
function isSensitiveKey(key: string): boolean {
  const sensitiveKeyPatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i,
    /apikey/i,
    /api_key/i,
    /private/i,
    /confidential/i
  ];

  return sensitiveKeyPatterns.some(pattern => pattern.test(key));
}

/**
 * Redacting logger wrapper functions
 */
export const redactingLogger = {
  info: (message: string, data?: any) => {
    const redactedMessage = redactSecrets(message);
    const redactedData = data ? redactObject(data) : data;
    logInfo(redactedMessage, redactedData);
  },

  warn: (message: string, data?: any) => {
    const redactedMessage = redactSecrets(message);
    const redactedData = data ? redactObject(data) : data;
    logWarn(redactedMessage, redactedData);
  },

  error: (message: string, error?: Error | any) => {
    const redactedMessage = redactSecrets(message);
    
    if (error instanceof Error) {
      // Redact error message and stack trace
      const redactedError = new Error(redactSecrets(error.message));
      redactedError.stack = error.stack ? redactSecrets(error.stack) : undefined;
      redactedError.name = error.name;
      logError(redactedMessage, redactedError);
    } else {
      const redactedError = redactObject(error);
      logError(redactedMessage, redactedError);
    }
  }
};

/**
 * Safe JSON stringify that handles circular references and redacts secrets
 */
export function safeStringify(obj: any): string {
  try {
    const redacted = redactObject(obj);
    return JSON.stringify(redacted, null, 2);
  } catch (error) {
    return '[Unable to stringify object]';
  }
}

/**
 * Middleware for redacting request/response logs
 */
export function redactRequestResponse(req: any, res: any): { req: any; res: any } {
  const redactedReq = {
    method: req.method,
    url: req.url,
    headers: redactObject(req.headers),
    body: redactObject(req.body),
    query: redactObject(req.query),
    params: redactObject(req.params)
  };

  const redactedRes = {
    statusCode: res.statusCode,
    headers: redactObject(res.getHeaders?.()),
  };

  return { req: redactedReq, res: redactedRes };
}
