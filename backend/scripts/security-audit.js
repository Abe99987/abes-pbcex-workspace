#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Security Audit Script for PBCEx Backend
 * 
 * Performs comprehensive security checks including:
 * - Dependency vulnerability scanning
 * - Code security analysis
 * - Environment configuration validation
 * - File permission checks
 * - Secret detection
 * - License compliance
 */

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passedChecks = [];
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌ ERROR',
      warn: '⚠️  WARN',
      info: 'ℹ️  INFO',
      success: '✅ PASS'
    }[level];
    
    console.log(`[${timestamp}] ${prefix}: ${message}`);
  }

  addIssue(category, severity, message, details = {}) {
    const issue = {
      category,
      severity,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    if (severity === 'critical' || severity === 'high') {
      this.issues.push(issue);
      this.log(`${category}: ${message}`, 'error');
    } else {
      this.warnings.push(issue);
      this.log(`${category}: ${message}`, 'warn');
    }
  }

  addPass(category, message) {
    this.passedChecks.push({
      category,
      message,
      timestamp: new Date().toISOString()
    });
    this.log(`${category}: ${message}`, 'success');
  }

  async runAudit() {
    this.log('🔒 Starting PBCEx Security Audit', 'info');
    
    try {
      await this.checkDependencyVulnerabilities();
      await this.checkEnvironmentSecurity();
      await this.checkFilePermissions();
      await this.checkSecretExposure();
      await this.checkCodeSecurity();
      await this.checkLicenseCompliance();
      await this.checkDockerSecurity();
      await this.checkDatabaseSecurity();
      await this.checkApiSecurity();
      await this.generateReport();
    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async checkDependencyVulnerabilities() {
    this.log('🔍 Checking dependency vulnerabilities...', 'info');
    
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        const vulns = audit.vulnerabilities;
        const critical = Object.values(vulns).filter(v => v.severity === 'critical').length;
        const high = Object.values(vulns).filter(v => v.severity === 'high').length;
        const moderate = Object.values(vulns).filter(v => v.severity === 'moderate').length;
        
        if (critical > 0) {
          this.addIssue('Dependencies', 'critical', 
            `Found ${critical} critical vulnerabilities`, { critical, high, moderate });
        } else if (high > 0) {
          this.addIssue('Dependencies', 'high', 
            `Found ${high} high severity vulnerabilities`, { high, moderate });
        } else if (moderate > 0) {
          this.addIssue('Dependencies', 'medium', 
            `Found ${moderate} moderate vulnerabilities`, { moderate });
        } else {
          this.addPass('Dependencies', 'No vulnerabilities found');
        }
      } else {
        this.addPass('Dependencies', 'No vulnerabilities detected');
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          const metadata = audit.metadata || {};
          const vulns = metadata.vulnerabilities || {};
          
          if (vulns.critical > 0 || vulns.high > 0) {
            this.addIssue('Dependencies', 'high', 
              `Found ${vulns.critical || 0} critical and ${vulns.high || 0} high severity vulnerabilities`,
              vulns);
          } else if (vulns.moderate > 0 || vulns.low > 0) {
            this.addIssue('Dependencies', 'medium', 
              `Found ${vulns.moderate || 0} moderate and ${vulns.low || 0} low severity vulnerabilities`,
              vulns);
          }
        } catch (parseError) {
          this.addIssue('Dependencies', 'medium', 'Failed to parse npm audit results');
        }
      } else {
        this.addIssue('Dependencies', 'medium', 'Failed to run dependency vulnerability scan');
      }
    }
  }

  async checkEnvironmentSecurity() {
    this.log('🌍 Checking environment security...', 'info');
    
    const requiredSecrets = [
      'JWT_SECRET',
      'DATABASE_URL',
      'REDIS_URL',
      'SESSION_SECRET'
    ];
    
    const sensitiveEnvVars = [
      'API_KEY',
      'SECRET',
      'PASSWORD',
      'TOKEN',
      'PRIVATE_KEY'
    ];
    
    // Check required secrets
    requiredSecrets.forEach(envVar => {
      const value = process.env[envVar];
      if (!value) {
        this.addIssue('Environment', 'high', `Missing required environment variable: ${envVar}`);
      } else if (value.length < 16) {
        this.addIssue('Environment', 'high', `Environment variable ${envVar} is too short (minimum 16 characters)`);
      } else if (['default', 'changeme', 'password', 'secret'].includes(value.toLowerCase())) {
        this.addIssue('Environment', 'critical', `Environment variable ${envVar} uses insecure default value`);
      } else {
        this.addPass('Environment', `${envVar} is properly configured`);
      }
    });
    
    // Check for development settings in production
    if (process.env.NODE_ENV === 'production') {
      const devSettings = [
        ['DEBUG', 'true'],
        ['LOG_LEVEL', 'debug'],
        ['CORS_ORIGIN', '*']
      ];
      
      devSettings.forEach(([envVar, dangerousValue]) => {
        if (process.env[envVar] === dangerousValue) {
          this.addIssue('Environment', 'high', 
            `Insecure ${envVar}=${dangerousValue} in production environment`);
        }
      });
    }
    
    // Check .env files exist and have proper permissions
    const envFiles = ['.env', '.env.local', '.env.production'];
    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        const stats = fs.statSync(envFile);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode & parseInt('004', 8)) {
          this.addIssue('Environment', 'high', 
            `${envFile} is world-readable (contains secrets)`);
        } else if (mode & parseInt('044', 8)) {
          this.addIssue('Environment', 'medium', 
            `${envFile} is group-readable (contains secrets)`);
        } else {
          this.addPass('Environment', `${envFile} has secure permissions`);
        }
      }
    });
  }

  async checkFilePermissions() {
    this.log('📁 Checking file permissions...', 'info');
    
    const sensitiveFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      '.env',
      '.env.local',
      '.env.production',
      'src/config/env.ts'
    ];
    
    const executableExtensions = ['.js', '.ts', '.sh'];
    
    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const mode = stats.mode & parseInt('777', 8);
        
        // Check if file is world-writable
        if (mode & parseInt('002', 8)) {
          this.addIssue('File Permissions', 'high', `${file} is world-writable`);
        }
        
        // Check if config files are executable
        const ext = path.extname(file);
        if (['.json', '.env'].includes(ext) && (mode & parseInt('111', 8))) {
          this.addIssue('File Permissions', 'medium', `Configuration file ${file} is executable`);
        }
      }
    });
    
    // Check for executable files in src directory
    try {
      const srcFiles = this.getFilesRecursively('./src');
      srcFiles.forEach(file => {
        const stats = fs.statSync(file);
        const mode = stats.mode & parseInt('777', 8);
        const ext = path.extname(file);
        
        if (executableExtensions.includes(ext) && !(mode & parseInt('111', 8))) {
          // This is expected - source files shouldn't be executable
        } else if (!executableExtensions.includes(ext) && (mode & parseInt('111', 8))) {
          this.addIssue('File Permissions', 'low', `Non-executable file ${file} has execute permissions`);
        }
      });
    } catch (error) {
      this.log(`Could not check src directory permissions: ${error.message}`, 'warn');
    }
    
    this.addPass('File Permissions', 'File permission scan completed');
  }

  async checkSecretExposure() {
    this.log('🔑 Checking for exposed secrets...', 'info');
    
    const secretPatterns = [
      { name: 'JWT Secret', pattern: /jwt[_-]?secret[_-]?key?\s*[:=]\s*['"][^'"]{16,}['"]/, severity: 'critical' },
      { name: 'API Key', pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{16,}['"]/, severity: 'high' },
      { name: 'Database Password', pattern: /password[_-]?[:=]\s*['"][^'"]{8,}['"]/, severity: 'high' },
      { name: 'Private Key', pattern: /-----BEGIN[A-Z\s]+PRIVATE KEY-----/, severity: 'critical' },
      { name: 'AWS Secret', pattern: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
      { name: 'Generic Secret', pattern: /secret[_-]?key?\s*[:=]\s*['"][^'"]{12,}['"]/, severity: 'medium' }
    ];
    
    const filesToCheck = this.getFilesRecursively('./src', ['.ts', '.js', '.json']);
    let secretsFound = 0;
    
    filesToCheck.forEach(filePath => {
      if (filePath.includes('node_modules') || filePath.includes('.git')) return;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        secretPatterns.forEach(({ name, pattern, severity }) => {
          const matches = content.match(pattern);
          if (matches) {
            secretsFound++;
            this.addIssue('Secret Exposure', severity, 
              `Potential ${name} found in ${filePath}`, 
              { file: filePath, pattern: pattern.toString() });
          }
        });
        
        // Check for hardcoded credentials
        const credentialPatterns = [
          /password\s*[:=]\s*['"](?!.*\$\{)[^'"]{6,}['"]/, // Hardcoded passwords
          /token\s*[:=]\s*['"](?!.*\$\{)[^'"]{20,}['"]/, // Hardcoded tokens
        ];
        
        credentialPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            secretsFound++;
            this.addIssue('Secret Exposure', 'high', 
              `Hardcoded credentials found in ${filePath}`);
          }
        });
        
      } catch (error) {
        // Skip files we can't read
      }
    });
    
    if (secretsFound === 0) {
      this.addPass('Secret Exposure', 'No exposed secrets detected in source code');
    }
  }

  async checkCodeSecurity() {
    this.log('🔍 Running code security analysis...', 'info');
    
    try {
      // Run ESLint with security rules
      const eslintResult = execSync('npx eslint src --ext .ts --format json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const results = JSON.parse(eslintResult);
      let securityIssues = 0;
      let totalIssues = 0;
      
      results.forEach(file => {
        file.messages.forEach(message => {
          totalIssues++;
          if (message.ruleId && message.ruleId.startsWith('security/')) {
            securityIssues++;
            const severity = message.severity === 2 ? 'high' : 'medium';
            this.addIssue('Code Security', severity, 
              `${message.ruleId}: ${message.message} in ${file.filePath}:${message.line}`);
          }
        });
      });
      
      if (securityIssues === 0) {
        this.addPass('Code Security', `ESLint security scan passed (${totalIssues} total issues)`);
      }
      
    } catch (error) {
      // ESLint returns non-zero exit code when issues found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          let securityIssues = 0;
          
          results.forEach(file => {
            file.messages.forEach(message => {
              if (message.ruleId && message.ruleId.startsWith('security/')) {
                securityIssues++;
                const severity = message.severity === 2 ? 'high' : 'medium';
                this.addIssue('Code Security', severity, 
                  `${message.ruleId}: ${message.message} in ${path.basename(file.filePath)}:${message.line}`);
              }
            });
          });
          
          if (securityIssues === 0) {
            this.addPass('Code Security', 'No security-specific ESLint issues found');
          }
          
        } catch (parseError) {
          this.addIssue('Code Security', 'medium', 'Failed to parse ESLint results');
        }
      } else {
        this.log('ESLint not available, skipping code security analysis', 'warn');
      }
    }
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      { name: 'eval() usage', pattern: /\beval\s*\(/, severity: 'critical' },
      { name: 'Function constructor', pattern: /new\s+Function\s*\(/, severity: 'high' },
      { name: 'innerHTML assignment', pattern: /\.innerHTML\s*=/, severity: 'medium' },
      { name: 'document.write', pattern: /document\.write\s*\(/, severity: 'medium' },
      { name: 'SQL concatenation', pattern: /"SELECT.*"\s*\+/, severity: 'high' }
    ];
    
    const srcFiles = this.getFilesRecursively('./src', ['.ts', '.js']);
    srcFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        dangerousPatterns.forEach(({ name, pattern, severity }) => {
          if (pattern.test(content)) {
            this.addIssue('Code Security', severity, 
              `Dangerous pattern detected: ${name} in ${path.basename(filePath)}`);
          }
        });
      } catch (error) {
        // Skip files we can't read
      }
    });
  }

  async checkLicenseCompliance() {
    this.log('⚖️ Checking license compliance...', 'info');
    
    try {
      // Check package.json for license
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      if (!packageJson.license) {
        this.addIssue('License', 'medium', 'Package.json missing license field');
      } else if (packageJson.license === 'UNLICENSED') {
        this.addPass('License', 'Package properly marked as unlicensed');
      } else {
        this.addPass('License', `Package license: ${packageJson.license}`);
      }
      
      // Check for GPL dependencies (potential licensing issues)
      try {
        const licenseCheck = execSync('npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;UNLICENSED;PROPRIETARY" --json', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        this.addPass('License', 'All dependencies have compatible licenses');
        
      } catch (error) {
        if (error.stdout && error.stdout.includes('GPL')) {
          this.addIssue('License', 'high', 'GPL-licensed dependencies detected (potential licensing conflict)');
        } else {
          this.log('License checker not available, skipping dependency license check', 'warn');
        }
      }
      
    } catch (error) {
      this.addIssue('License', 'low', 'Could not verify license compliance');
    }
  }

  async checkDockerSecurity() {
    this.log('🐳 Checking Docker security...', 'info');
    
    if (fs.existsSync('Dockerfile')) {
      const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
      
      // Check for running as root
      if (!dockerfile.includes('USER ') || dockerfile.includes('USER root')) {
        this.addIssue('Docker', 'high', 'Dockerfile runs as root user');
      } else {
        this.addPass('Docker', 'Dockerfile uses non-root user');
      }
      
      // Check for COPY --chown usage
      if (dockerfile.includes('COPY ') && !dockerfile.includes('COPY --chown=')) {
        this.addIssue('Docker', 'medium', 'Dockerfile COPY commands should use --chown');
      }
      
      // Check for latest tag usage
      if (dockerfile.includes(':latest')) {
        this.addIssue('Docker', 'medium', 'Dockerfile uses :latest tags (not reproducible)');
      }
      
      // Check for secrets in build
      if (dockerfile.includes('ARG PASSWORD') || dockerfile.includes('ARG SECRET')) {
        this.addIssue('Docker', 'high', 'Dockerfile contains secret build arguments');
      }
      
    } else {
      this.log('No Dockerfile found, skipping Docker security check', 'info');
    }
    
    // Check docker-compose.yml
    if (fs.existsSync('docker-compose.yml')) {
      const compose = fs.readFileSync('docker-compose.yml', 'utf8');
      
      if (compose.includes('privileged: true')) {
        this.addIssue('Docker', 'high', 'Docker Compose uses privileged containers');
      }
      
      if (compose.includes('network_mode: host')) {
        this.addIssue('Docker', 'medium', 'Docker Compose uses host networking');
      }
      
    }
  }

  async checkDatabaseSecurity() {
    this.log('🗄️ Checking database security...', 'info');
    
    // Check for database connection security
    const dbConfigFiles = ['src/config/database.ts', 'src/db/connection.ts', 'src/config/env.ts'];
    
    dbConfigFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for SSL configuration
        if (!content.includes('ssl') && !content.includes('sslmode')) {
          this.addIssue('Database', 'high', `${file} missing SSL configuration`);
        }
        
        // Check for connection pooling
        if (!content.includes('pool') && !content.includes('max')) {
          this.addIssue('Database', 'medium', `${file} missing connection pool configuration`);
        }
        
        // Check for hardcoded credentials
        if (content.includes('password:') && !content.includes('process.env')) {
          this.addIssue('Database', 'critical', `${file} contains hardcoded database credentials`);
        }
      }
    });
    
    // Check migration files for security issues
    const migrationDir = 'db/migrations';
    if (fs.existsSync(migrationDir)) {
      const migrations = fs.readdirSync(migrationDir);
      migrations.forEach(migration => {
        const migrationPath = path.join(migrationDir, migration);
        if (migration.endsWith('.sql')) {
          const content = fs.readFileSync(migrationPath, 'utf8');
          
          // Check for potentially dangerous operations
          if (content.includes('DROP TABLE') || content.includes('DROP DATABASE')) {
            this.addIssue('Database', 'high', `Migration ${migration} contains DROP operations`);
          }
          
          // Check for default passwords
          if (content.includes("password = 'password'") || content.includes("password = 'admin'")) {
            this.addIssue('Database', 'critical', `Migration ${migration} creates default passwords`);
          }
        }
      });
    }
  }

  async checkApiSecurity() {
    this.log('🌐 Checking API security...', 'info');
    
    const routeFiles = this.getFilesRecursively('./src/routes', ['.ts', '.js']);
    
    routeFiles.forEach(routeFile => {
      const content = fs.readFileSync(routeFile, 'utf8');
      
      // Check for missing authentication middleware
      if (content.includes('router.') && !content.includes('authenticate') && !content.includes('auth')) {
        this.addIssue('API Security', 'medium', `${path.basename(routeFile)} may be missing authentication`);
      }
      
      // Check for missing rate limiting
      if (content.includes('router.post') && !content.includes('rateLimit') && !content.includes('rateLimiter')) {
        this.addIssue('API Security', 'medium', `${path.basename(routeFile)} POST routes missing rate limiting`);
      }
      
      // Check for direct database queries (potential SQL injection)
      if (content.includes('query(') && content.includes('+') && !content.includes('parameterized')) {
        this.addIssue('API Security', 'high', `${path.basename(routeFile)} may have SQL injection vulnerability`);
      }
      
      // Check for missing input validation
      if (content.includes('req.body') && !content.includes('validate') && !content.includes('schema')) {
        this.addIssue('API Security', 'medium', `${path.basename(routeFile)} missing input validation`);
      }
    });
    
    // Check middleware files
    const middlewareFiles = this.getFilesRecursively('./src/middleware', ['.ts', '.js']);
    let hasSecurityHeaders = false;
    let hasRateLimit = false;
    let hasCors = false;
    
    middlewareFiles.forEach(middlewareFile => {
      const content = fs.readFileSync(middlewareFile, 'utf8');
      
      if (content.includes('helmet') || content.includes('X-Frame-Options')) {
        hasSecurityHeaders = true;
      }
      
      if (content.includes('rateLimit') || content.includes('express-rate-limit')) {
        hasRateLimit = true;
      }
      
      if (content.includes('cors') || content.includes('Access-Control-Allow-Origin')) {
        hasCors = true;
      }
    });
    
    if (!hasSecurityHeaders) {
      this.addIssue('API Security', 'high', 'Missing security headers middleware (helmet)');
    } else {
      this.addPass('API Security', 'Security headers middleware configured');
    }
    
    if (!hasRateLimit) {
      this.addIssue('API Security', 'high', 'Missing rate limiting middleware');
    } else {
      this.addPass('API Security', 'Rate limiting middleware configured');
    }
    
    if (!hasCors) {
      this.addIssue('API Security', 'medium', 'Missing CORS configuration');
    } else {
      this.addPass('API Security', 'CORS middleware configured');
    }
  }

  getFilesRecursively(dir, extensions = []) {
    let files = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files = files.concat(this.getFilesRecursively(fullPath, extensions));
        } else if (entry.isFile()) {
          if (extensions.length === 0 || extensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return files;
  }

  async generateReport() {
    const duration = Date.now() - this.startTime;
    const totalIssues = this.issues.length + this.warnings.length;
    
    console.log('\n' + '='.repeat(80));
    console.log('🔒 PBCEX SECURITY AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`📅 Generated: ${new Date().toISOString()}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Passed Checks: ${this.passedChecks.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Issues: ${this.issues.length}`);
    console.log(`📊 Total Findings: ${totalIssues}`);
    
    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL/HIGH SEVERITY ISSUES:');
      this.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}`);
        console.log(`   ${issue.message}`);
        if (Object.keys(issue.details).length > 0) {
          console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
        }
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.category}] ${warning.message}`);
      });
    }
    
    // Generate JSON report
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: duration,
        version: '1.0.0'
      },
      summary: {
        totalChecks: this.passedChecks.length + totalIssues,
        passedChecks: this.passedChecks.length,
        warnings: this.warnings.length,
        issues: this.issues.length,
        riskLevel: this.calculateRiskLevel()
      },
      findings: {
        issues: this.issues,
        warnings: this.warnings,
        passedChecks: this.passedChecks
      }
    };
    
    fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
    console.log('\n📋 Detailed report saved to: security-audit-report.json');
    
    // Return appropriate exit code
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
      console.log('\n💥 AUDIT FAILED: Critical security issues found');
      process.exit(2);
    } else if (highIssues > 0) {
      console.log('\n⚠️  AUDIT WARNING: High severity issues found');
      process.exit(1);
    } else {
      console.log('\n✅ AUDIT PASSED: No critical or high severity issues found');
      process.exit(0);
    }
  }

  calculateRiskLevel() {
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    const highCount = this.issues.filter(i => i.severity === 'high').length;
    const mediumCount = this.issues.filter(i => i.severity === 'medium').length;
    
    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 2) return 'HIGH';
    if (highCount > 0 || mediumCount > 5) return 'MEDIUM';
    if (mediumCount > 0 || this.warnings.length > 10) return 'LOW';
    return 'MINIMAL';
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(3);
  });
}

module.exports = SecurityAuditor;
