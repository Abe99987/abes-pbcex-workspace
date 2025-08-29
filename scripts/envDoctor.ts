#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import chalk from 'chalk';
import { z } from 'zod';

// ES module equivalent of __dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI argument parsing
interface CliOptions {
  strict: boolean;
  help: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    strict: args.includes('--strict') || process.env.ENV_DOCTOR_STRICT === 'true',
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * PBCEx Environment Doctor 🩺
 * 
 * Validates all environment configuration at startup to ensure proper setup.
 * This prevents runtime failures due to missing or invalid environment variables.
 * 
 * Features:
 * - Validates backend environment variables using Zod schema
 * - Validates frontend NEXT_PUBLIC_ variables  
 * - Categorized output for better readability
 * - Color-coded results (green=pass, red=fail, yellow=warning)
 * - CI/CD integration ready
 * - Summary statistics
 */

// Load environment files
dotenv.config(); // Root .env
dotenv.config({ path: path.join(__dirname, '../backend/.env') }); // Backend .env
dotenv.config({ path: path.join(__dirname, '../frontend/.env.local') }); // Frontend .env

// Import backend Zod schema - we'll recreate it here to avoid import issues
const backendEnvSchema = z.object({
  // Core Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1000).max(65535)).default('4000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Authentication & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),

  // Market Data
  TRADINGVIEW_API_KEY: z.string().optional(),

  // KYC & Identity Verification  
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).default('sandbox'),

  // Custody Partners
  PAXOS_API_KEY: z.string().optional(),
  PAXOS_API_SECRET: z.string().optional(),
  PRIMETRUST_API_KEY: z.string().optional(),
  PRIMETRUST_API_SECRET: z.string().optional(),
  ANCHORAGE_API_KEY: z.string().optional(),

  // Fulfillment & Logistics
  JM_BULLION_API_KEY: z.string().optional(),
  JM_BULLION_API_SECRET: z.string().optional(),
  DILLON_GAGE_API_KEY: z.string().optional(),
  DILLON_GAGE_API_SECRET: z.string().optional(),
  FEDEX_CLIENT_ID: z.string().optional(),
  FEDEX_CLIENT_SECRET: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),

  // Messaging & Communication
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  INTERCOM_ACCESS_TOKEN: z.string().optional(),

  // Monitoring & Compliance
  DATADOG_API_KEY: z.string().optional(),
  VANTA_API_KEY: z.string().optional(),

  // Phase-3 Feature Flags
  PHASE: z.string().regex(/^[1-3]$/, 'PHASE must be 1, 2, or 3').default('1'),
  ENABLE_ONCHAIN: z.string().transform(val => val === 'true').pipe(z.boolean()).default('false'),
  ENABLE_VAULT_REDEMPTION: z.string().transform(val => val === 'true').pipe(z.boolean()).default('false'),
  FULFILLMENT_STRATEGY: z.enum(['JM', 'BRINKS']).default('JM'),

  // A/B Testing Configuration
  EXPERIMENTS_JSON: z.string().optional(),
});

// Frontend environment schema
const frontendEnvSchema = z.object({
  // App configuration
  NEXT_PUBLIC_APP_NAME: z.string().default('PBCEx'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Feature flags
  NEXT_PUBLIC_ENABLE_2FA: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  NEXT_PUBLIC_ENABLE_PHYSICAL_TRADING: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  NEXT_PUBLIC_ENABLE_SYNTHETIC_TRADING: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  NEXT_PUBLIC_ENABLE_SHOP: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),

  // Third-party integrations (public keys only)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),

  // Support/Chat
  NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),
});

// Environment variable categories for organized output
interface VariableCategory {
  name: string;
  description: string;
  variables: string[];
  required: boolean;
  criticalForRuntime: boolean;
}

const BACKEND_CATEGORIES: VariableCategory[] = [
  {
    name: 'Core',
    description: 'Essential application settings',
    variables: ['NODE_ENV', 'PORT', 'DATABASE_URL', 'REDIS_URL'],
    required: true,
    criticalForRuntime: true,
  },
  {
    name: 'Auth/Security',
    description: 'Authentication and security configuration',
    variables: ['JWT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY'],
    required: true,
    criticalForRuntime: true,
  },
  {
    name: 'Market',
    description: 'Market data and pricing',
    variables: ['TRADINGVIEW_API_KEY'],
    required: false,
    criticalForRuntime: false,
  },
  {
    name: 'KYC/Custody',
    description: 'Identity verification and asset custody',
    variables: [
      'PLAID_CLIENT_ID', 'PLAID_SECRET', 'PLAID_ENV',
      'PAXOS_API_KEY', 'PAXOS_API_SECRET',
      'PRIMETRUST_API_KEY', 'PRIMETRUST_API_SECRET',
      'ANCHORAGE_API_KEY'
    ],
    required: false,
    criticalForRuntime: false,
  },
  {
    name: 'Fulfillment/Logistics',
    description: 'Physical asset fulfillment and shipping',
    variables: [
      'JM_BULLION_API_KEY', 'JM_BULLION_API_SECRET',
      'DILLON_GAGE_API_KEY', 'DILLON_GAGE_API_SECRET',
      'FEDEX_CLIENT_ID', 'FEDEX_CLIENT_SECRET'
    ],
    required: false,
    criticalForRuntime: false,
  },
  {
    name: 'Payments',
    description: 'Payment processing',
    variables: ['STRIPE_SECRET_KEY'],
    required: false,
    criticalForRuntime: false,
  },
  {
    name: 'Messaging/Support/Monitoring',
    description: 'Communication and monitoring services',
    variables: [
      'SENDGRID_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN',
      'INTERCOM_ACCESS_TOKEN', 'DATADOG_API_KEY', 'VANTA_API_KEY'
    ],
    required: false,
    criticalForRuntime: false,
  },
  {
    name: 'Feature Flags',
    description: 'Phase-3 and experimental features',
    variables: ['PHASE', 'ENABLE_ONCHAIN', 'ENABLE_VAULT_REDEMPTION', 'FULFILLMENT_STRATEGY', 'EXPERIMENTS_JSON'],
    required: false,
    criticalForRuntime: false,
  },
];

const FRONTEND_CATEGORIES: VariableCategory[] = [
  {
    name: 'Frontend Core',
    description: 'Essential frontend configuration',
    variables: ['NEXT_PUBLIC_APP_NAME', 'NEXT_PUBLIC_API_BASE_URL'],
    required: true,
    criticalForRuntime: true,
  },
  {
    name: 'Frontend Features',
    description: 'Frontend feature toggles',
    variables: [
      'NEXT_PUBLIC_ENABLE_2FA', 'NEXT_PUBLIC_ENABLE_PHYSICAL_TRADING',
      'NEXT_PUBLIC_ENABLE_SYNTHETIC_TRADING', 'NEXT_PUBLIC_ENABLE_SHOP'
    ],
    required: false,
    criticalForRuntime: false,
  },
  {
    name: 'Frontend Integrations',
    description: 'Third-party frontend integrations',
    variables: [
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'NEXT_PUBLIC_MIXPANEL_TOKEN',
      'NEXT_PUBLIC_INTERCOM_APP_ID'
    ],
    required: false,
    criticalForRuntime: false,
  },
];

interface ValidationResult {
  passed: number;
  failed: number;
  warned: number;
  total: number;
  errors: string[];
  warnings: string[];
  strictViolations: number;
  strictErrors: string[];
}

class EnvDoctor {
  private result: ValidationResult = {
    passed: 0,
    failed: 0,
    warned: 0,
    total: 0,
    errors: [],
    warnings: [],
    strictViolations: 0,
    strictErrors: [],
  };

  private options: CliOptions;

  constructor(options: CliOptions = { strict: false, help: false }) {
    this.options = options;
    console.log(chalk.blue.bold('\n🩺 PBCEx Environment Doctor\n'));
    if (options.strict) {
      console.log(chalk.yellow.bold('⚡ STRICT MODE: Checking for placeholder values\n'));
    }
    console.log(chalk.gray('Validating configuration for reliable startup...\n'));
  }

  async diagnose(): Promise<boolean> {
    // Validate backend environment
    console.log(chalk.blue.bold('🔧 Backend Environment Variables'));
    console.log(chalk.gray('─'.repeat(50)));
    await this.validateBackendEnv();

    console.log(); // Spacing

    // Validate frontend environment  
    console.log(chalk.blue.bold('🌐 Frontend Environment Variables'));
    console.log(chalk.gray('─'.repeat(50)));
    await this.validateFrontendEnv();

    // Print summary
    this.printSummary();

    // Return success status (fail if critical errors OR strict violations in strict mode)
    const hasFailures = this.result.failed > 0;
    const hasStrictViolations = this.options.strict && this.result.strictViolations > 0;
    return !hasFailures && !hasStrictViolations;
  }

  private async validateBackendEnv(): Promise<void> {
    try {
      const result = backendEnvSchema.safeParse(process.env);
      
      if (result.success) {
        this.validateCategorizedVariables(BACKEND_CATEGORIES, process.env);
      } else {
        // First, validate categorized variables to show the organized output
        this.validateCategorizedVariables(BACKEND_CATEGORIES, process.env);
        
        // Then handle Zod validation errors for required variables
        result.error.errors.forEach(error => {
          const varName = error.path.join('.');
          if (error.code === 'invalid_type' && error.received === 'undefined') {
            // Only add to errors if it's in a required category
            const isRequired = BACKEND_CATEGORIES.some(cat => 
              cat.required && cat.variables.includes(varName)
            );
            if (isRequired) {
              this.result.failed++;
              this.result.errors.push(`${varName}: Required but not set`);
            }
          } else {
            this.result.errors.push(`${varName}: ${error.message}`);
          }
        });
      }
    } catch (error) {
      this.result.errors.push(`Backend validation failed: ${error.message}`);
    }
  }

  private async validateFrontendEnv(): Promise<void> {
    try {
      const result = frontendEnvSchema.safeParse(process.env);
      
      if (result.success) {
        this.validateCategorizedVariables(FRONTEND_CATEGORIES, process.env);
      } else {
        // First, validate categorized variables to show the organized output
        this.validateCategorizedVariables(FRONTEND_CATEGORIES, process.env);
        
        // Then handle Zod validation errors for required variables
        result.error.errors.forEach(error => {
          const varName = error.path.join('.');
          if (error.code === 'invalid_type' && error.received === 'undefined') {
            // Only add to errors if it's in a required category
            const isRequired = FRONTEND_CATEGORIES.some(cat => 
              cat.required && cat.variables.includes(varName)
            );
            if (isRequired) {
              this.result.failed++;
              this.result.errors.push(`${varName}: Required but not set`);
            }
          } else {
            this.result.errors.push(`${varName}: ${error.message}`);
          }
        });
      }
    } catch (error) {
      this.result.errors.push(`Frontend validation failed: ${error.message}`);
    }
  }

  private validateCategorizedVariables(categories: VariableCategory[], env: NodeJS.ProcessEnv): void {
    categories.forEach(category => {
      console.log(chalk.cyan.bold(`\n📂 ${category.name}`));
      console.log(chalk.gray(`   ${category.description}`));
      
      category.variables.forEach(varName => {
        const value = env[varName];
        const isSet = value !== undefined && value !== '';
        this.result.total++;

        if (isSet) {
          // Variable is set - check for strict violations
          const strictViolation = this.options.strict ? this.checkStrictViolation(varName, value!) : null;
          
          if (strictViolation) {
            // Strict violation found
            this.result.strictViolations++;
            this.result.strictErrors.push(`${varName}: ${strictViolation}`);
            const displayValue = this.maskSensitiveValue(varName, value!);
            console.log(chalk.red(`   🚫 ${varName}`), chalk.gray(`= ${displayValue}`), chalk.red(`(${strictViolation})`));
          } else {
            // Variable is properly set
            this.result.passed++;
            const displayValue = this.maskSensitiveValue(varName, value!);
            console.log(chalk.green(`   ✅ ${varName}`), chalk.gray(`= ${displayValue}`));
          }
        } else {
          // Variable is not set
          if (category.required || category.criticalForRuntime) {
            // Critical missing variable
            console.log(chalk.red(`   ❌ ${varName}`), chalk.red('(required but not set)'));
            // Don't increment failed here - it will be handled in the validation methods
          } else {
            // Optional missing variable
            this.result.warned++;
            console.log(chalk.yellow(`   ⚠️  ${varName}`), chalk.yellow('(optional, not set)'));
            this.result.warnings.push(`${varName}: Optional ${category.name} integration not configured`);
          }
        }
      });
    });
  }

  private checkStrictViolation(varName: string, value: string): string | null {
    const trimmedValue = value.trim();
    
    // Check for empty or whitespace-only values
    if (trimmedValue === '') {
      return 'empty or whitespace-only value';
    }
    
    // Check for common placeholder patterns
    const placeholderPatterns = [
      { pattern: /^replace_me$/i, message: 'placeholder value "replace_me"' },
      { pattern: /^changeme$/i, message: 'placeholder value "changeme"' },
      { pattern: /^your_.+_here$/i, message: 'placeholder pattern "your_*_here"' },
    ];
    
    for (const { pattern, message } of placeholderPatterns) {
      if (pattern.test(trimmedValue)) {
        return message;
      }
    }
    
    // Check for test Stripe keys (only warn in production)
    if (trimmedValue.startsWith('sk_test_')) {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        return 'test Stripe key in production';
      } else {
        // In non-production, this is just a warning, not a strict violation
        return null;
      }
    }
    
    return null;
  }

  private maskSensitiveValue(varName: string, value: string): string {
    const sensitivePatterns = [
      'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'AUTH', 'PRIVATE'
    ];

    const isSensitive = sensitivePatterns.some(pattern => 
      varName.toUpperCase().includes(pattern)
    );

    if (isSensitive) {
      if (value.length <= 8) {
        return '*'.repeat(value.length);
      } else {
        return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
      }
    }

    // Non-sensitive values can be shown
    if (value.length > 50) {
      return `${value.substring(0, 47)}...`;
    }
    
    return value;
  }

  private printSummary(): void {
    console.log('\n' + chalk.blue.bold('📊 Environment Doctor Summary'));
    console.log(chalk.gray('='.repeat(50)));

    const passRate = this.result.total > 0 ? Math.round((this.result.passed / this.result.total) * 100) : 0;

    // Status indicator
    const hasFailures = this.result.failed > 0;
    const hasStrictViolations = this.options.strict && this.result.strictViolations > 0;
    
    if (!hasFailures && !hasStrictViolations) {
      console.log(chalk.green.bold('✅ DIAGNOSIS: HEALTHY'));
      console.log(chalk.green('   All critical environment variables are properly configured.'));
      if (this.options.strict) {
        console.log(chalk.green('   No placeholder values detected in strict mode.'));
      }
    } else {
      console.log(chalk.red.bold('❌ DIAGNOSIS: UNHEALTHY'));
      if (hasFailures) {
        console.log(chalk.red(`   ${this.result.failed} critical configuration issue(s) found.`));
      }
      if (hasStrictViolations) {
        console.log(chalk.red(`   ${this.result.strictViolations} placeholder value(s) detected in strict mode.`));
      }
    }

    // Statistics
    console.log();
    console.log(chalk.cyan('📈 Configuration Statistics:'));
    console.log(chalk.green(`   ✅ Configured: ${this.result.passed}/${this.result.total} (${passRate}%)`));
    if (this.result.failed > 0) {
      console.log(chalk.red(`   ❌ Missing Critical: ${this.result.failed}`));
    }
    if (this.result.warned > 0) {
      console.log(chalk.yellow(`   ⚠️  Missing Optional: ${this.result.warned}`));
    }
    
    // Strict mode summary
    if (this.options.strict) {
      if (this.result.strictViolations > 0) {
        console.log(chalk.red(`   🚫 Strict violations: ${this.result.strictViolations} placeholder(s) found`));
      } else {
        console.log(chalk.green(`   ⚡ Strict checks: All values are production-ready`));
      }
    }

    // Show errors if any
    if (this.result.errors.length > 0) {
      console.log(chalk.red.bold('\n🚨 Critical Issues:'));
      this.result.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    // Show strict violations if any
    if (this.options.strict && this.result.strictErrors.length > 0) {
      console.log(chalk.red.bold('\n🚫 Strict Mode Violations:'));
      this.result.strictErrors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    // Show warnings summary if any
    if (this.result.warnings.length > 0 && this.result.warnings.length <= 5) {
      console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
      this.result.warnings.slice(0, 5).forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
      if (this.result.warnings.length > 5) {
        console.log(chalk.yellow(`   ... and ${this.result.warnings.length - 5} more`));
      }
    } else if (this.result.warnings.length > 5) {
      console.log(chalk.yellow.bold(`\n⚠️  ${this.result.warnings.length} optional integrations not configured (non-critical)`));
    }

    // Recommendations
    console.log(chalk.blue.bold('\n💡 Recommendations:'));
    if (this.result.failed > 0) {
      console.log(chalk.blue('   1. Copy env-template to .env in the appropriate directories'));
      console.log(chalk.blue('   2. Fill in all required environment variables'));
      console.log(chalk.blue('   3. Run this command again to verify the fix'));
    } else if (this.options.strict && this.result.strictViolations > 0) {
      console.log(chalk.blue('   1. Replace placeholder values with actual configuration'));
      console.log(chalk.blue('   2. Ensure no test keys are used in production environments'));
      console.log(chalk.blue('   3. Run with --strict flag again to verify fixes'));
    } else if (this.result.warned > 0) {
      console.log(chalk.blue('   • Configure optional integrations as needed for full functionality'));
      if (this.options.strict) {
        console.log(chalk.blue('   • All values are production-ready - no placeholders detected'));
      }
    } else {
      console.log(chalk.blue('   • Configuration looks good! Ready for production deployment.'));
      if (this.options.strict) {
        console.log(chalk.blue('   • Strict mode passed - no placeholder values found'));
      }
    }

    // File locations
    console.log(chalk.gray.bold('\n📁 Configuration Files:'));
    console.log(chalk.gray('   • Root: .env'));
    console.log(chalk.gray('   • Backend: backend/.env'));
    console.log(chalk.gray('   • Frontend: frontend/.env.local'));

    console.log(); // Final spacing
  }
}

function printHelp(): void {
  console.log(chalk.blue.bold('🩺 PBCEx Environment Doctor\n'));
  console.log('Validates environment configuration for reliable application startup.\n');
  console.log(chalk.cyan('Usage:'));
  console.log('  npm run env:doctor                # Standard validation');
  console.log('  npm run env:doctor:strict         # Strict mode validation');
  console.log('  ts-node scripts/envDoctor.ts      # Direct execution');
  console.log('  ts-node scripts/envDoctor.ts --strict  # Direct with strict mode\n');
  
  console.log(chalk.cyan('Options:'));
  console.log('  --strict                          Enable strict mode (checks for placeholders)');
  console.log('  --help, -h                        Show this help message\n');
  
  console.log(chalk.cyan('Environment Variables:'));
  console.log('  ENV_DOCTOR_STRICT=true            Enable strict mode via environment\n');
  
  console.log(chalk.cyan('Strict Mode:'));
  console.log('  • Detects placeholder values like "replace_me", "changeme"');
  console.log('  • Flags "your_*_here" patterns');
  console.log('  • Warns about test Stripe keys in production');
  console.log('  • Fails build if any placeholder values found');
  console.log('  • Recommended for production deployments\n');
  
  console.log(chalk.cyan('Exit Codes:'));
  console.log('  0    All validations passed');
  console.log('  1    Critical configuration issues or strict violations found');
  console.log('  2    Tool crashed or internal error\n');
}

// CLI execution
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    
    if (options.help) {
      printHelp();
      process.exit(0);
    }

    const doctor = new EnvDoctor(options);
    const isHealthy = await doctor.diagnose();

    // Exit with appropriate code for CI/CD
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Environment Doctor crashed:'));
    console.error(chalk.red(error.message));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(2);
  }
}

// Run the doctor (ES module check)
if (import.meta.url === `file://${__filename}`) {
  main();
}

export { EnvDoctor };
