#!/usr/bin/env node

/**
 * Preflight Script for PBCEx Development
 * Fast, zero-external-call repo status and environment verification
 * 
 * Usage: npm run preflight
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getGitInfo() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const repoName = execSync('git remote get-url origin', { encoding: 'utf8' })
      .trim()
      .split('/')
      .pop()
      .replace('.git', '');
    return { repoName, branch, shortSha };
  } catch (error) {
    return { repoName: 'unknown', branch: 'unknown', shortSha: 'unknown' };
  }
}

function getNodeInfo() {
  try {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    return { nodeVersion, npmVersion };
  } catch (error) {
    return { nodeVersion: process.version, npmVersion: 'unknown' };
  }
}

function checkEnvTemplates() {
  const checks = [];
  
  // Check root env-template for STAGING_WEB_BASE_URL
  const rootEnvPath = join(ROOT_DIR, 'env-template');
  if (existsSync(rootEnvPath)) {
    const rootEnvContent = readFileSync(rootEnvPath, 'utf8');
    const hasStagingUrl = rootEnvContent.includes('STAGING_WEB_BASE_URL=');
    checks.push({
      file: 'env-template',
      check: 'STAGING_WEB_BASE_URL',
      status: hasStagingUrl ? 'PASS' : 'MISSING'
    });
  }
  
  // Check frontend env-template for VITE_API_BASE_URL
  const frontendEnvPath = join(ROOT_DIR, 'frontend/env-template');
  if (existsSync(frontendEnvPath)) {
    const frontendEnvContent = readFileSync(frontendEnvPath, 'utf8');
    const hasViteApi = frontendEnvContent.includes('STAGING_WEB_BASE_URL=');
    checks.push({
      file: 'frontend/env-template',
      check: 'STAGING_WEB_BASE_URL',
      status: hasViteApi ? 'PASS' : 'MISSING'
    });
  }
  
  return checks;
}

function countHardcodedUrls() {
  try {
    // Use grep to count hard-coded HTTP URLs in src directory
    const grepResult = execSync(
      'find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "https\\?://" | wc -l',
      { encoding: 'utf8', cwd: ROOT_DIR }
    ).trim();
    return parseInt(grepResult, 10) || 0;
  } catch (error) {
    return 0;
  }
}

function checkSSESanity() {
  const checks = [];
  
  // Check frontend SSE ops route
  const appPath = join(ROOT_DIR, 'src/App.tsx');
  if (existsSync(appPath)) {
    const appContent = readFileSync(appPath, 'utf8');
    const hasOpsRoute = appContent.includes('/ops/sse');
    checks.push({
      component: 'Frontend',
      check: '/ops/sse route',
      status: hasOpsRoute ? 'PASS' : 'MISSING'
    });
  }
  
  // Check backend SSE ops endpoint
  const opsControllerPath = join(ROOT_DIR, 'backend/src/controllers/OpsController.ts');
  if (existsSync(opsControllerPath)) {
    const opsContent = readFileSync(opsControllerPath, 'utf8');
    const hasStatsEndpoint = opsContent.includes('/api/ops/sse/stats');
    checks.push({
      component: 'Backend',
      check: '/api/ops/sse/stats endpoint',
      status: hasStatsEndpoint ? 'PASS' : 'MISSING'
    });
  }
  
  return checks;
}

function main() {
  log('🚀 PBCEx Preflight Check', 'blue');
  log('═'.repeat(50), 'blue');
  
  // Git and repo info
  const { repoName, branch, shortSha } = getGitInfo();
  log(`📁 Repo: ${repoName}`, 'green');
  log(`🌿 Branch: ${branch}`, 'green');
  log(`📝 SHA: ${shortSha}`, 'green');
  
  // Node environment
  const { nodeVersion, npmVersion } = getNodeInfo();
  log(`⚙️  Node: ${nodeVersion} | npm: ${npmVersion}`, 'green');
  
  log(''); // spacer
  
  // Environment template checks
  log('📋 Environment Configuration:', 'yellow');
  const envChecks = checkEnvTemplates();
  for (const check of envChecks) {
    const statusColor = check.status === 'PASS' ? 'green' : 'red';
    log(`   ${check.file}: ${check.check} ${check.status}`, statusColor);
  }
  
  // Hard-coded URL check
  const urlCount = countHardcodedUrls();
  const urlStatus = urlCount === 0 ? 'PASS' : `FOUND ${urlCount}`;
  const urlColor = urlCount === 0 ? 'green' : 'yellow';
  log(`   Hard-coded URLs in src/**: ${urlStatus}`, urlColor);
  
  log(''); // spacer
  
  // SSE sanity checks
  log('📡 SSE Infrastructure:', 'yellow');
  const sseChecks = checkSSESanity();
  for (const check of sseChecks) {
    const statusColor = check.status === 'PASS' ? 'green' : 'red';
    log(`   ${check.component}: ${check.check} ${check.status}`, statusColor);
  }
  
  log(''); // spacer
  
  // Overall status
  const allEnvPass = envChecks.every(c => c.status === 'PASS');
  const allSSEPass = sseChecks.every(c => c.status === 'PASS');
  const urlsClean = urlCount === 0;
  
  if (allEnvPass && allSSEPass && urlsClean) {
    log('✅ PREFLIGHT PASS - All systems nominal', 'green');
  } else {
    log('⚠️  PREFLIGHT WARNINGS - Some checks need attention', 'yellow');
  }
  
  log('═'.repeat(50), 'blue');
  log(`🕐 ${new Date().toISOString()}`, 'blue');
}

main();
