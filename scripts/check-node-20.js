#!/usr/bin/env node

/**
 * Node 20.x Version Enforcement Guard
 * 
 * Prevents package installation on incorrect Node versions to avoid lockfile drift.
 * This script runs during npm preinstall to enforce Node 20.x usage.
 */

const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

if (majorVersion !== 20) {
  console.error('');
  console.error('❌ Node Version Mismatch Detected');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`   Current Node: v${nodeVersion}`);
  console.error('   Required:     Node 20.x');
  console.error('');
  console.error('🔧 Fix this by using Node 20:');
  console.error('   • nvm use 20 (if using nvm)');
  console.error('   • nvm install 20 (if Node 20 not installed)');
  console.error('   • Check .nvmrc file for project requirements');
  console.error('');
  console.error('💡 This prevents lockfile drift and ensures consistent builds.');
  console.error('');
  
  process.exit(1);
}

console.log(`✅ Node version check passed: v${nodeVersion}`);
