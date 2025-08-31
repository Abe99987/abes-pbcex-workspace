#!/usr/bin/env ts-node

/**
 * FedEx Development Smoke Test Script
 * Tests FedEx integration with sample data
 * 
 * Usage:
 *   npm run dev:fedex-smoke
 * Or:
 *   ts-node scripts/dev-fedex-smoke.ts
 * 
 * DO NOT run in CI/CD pipelines - this hits real FedEx APIs
 */

import { config } from 'dotenv';
import { FedexService } from '../src/services/FedexService';
import { cache } from '../src/cache/redis';

// Load environment variables
config();

interface TestResults {
  oauth: boolean;
  rates: boolean;
  availability: boolean;
  label: boolean;
  errors: string[];
}

async function runFedExSmokeTest(): Promise<TestResults> {
  const results: TestResults = {
    oauth: false,
    rates: false,
    availability: false,
    label: false,
    errors: [],
  };

  console.log('🚀 Starting FedEx Integration Smoke Test...');
  console.log('=====================================\n');

  try {
    // Initialize services
    console.log('📡 Initializing FedEx service...');
    await FedexService.initialize();
    console.log('✅ FedEx service initialized\n');

    // Test OAuth token
    console.log('🔐 Testing OAuth token retrieval...');
    const tokenResult = await FedexService.getToken();
    
    if (tokenResult.success && tokenResult.data) {
      console.log('✅ OAuth token retrieved successfully');
      console.log(`   Token: ${tokenResult.data.substring(0, 10)}...`);
      console.log(`   Correlation ID: ${tokenResult.correlationId}\n`);
      results.oauth = true;
    } else {
      console.log('❌ OAuth token failed:', tokenResult.error);
      results.errors.push(`OAuth: ${tokenResult.error}`);
    }

    // Test sample addresses (US domestic)
    const sampleShipper = {
      streetLines: ['1600 Amphitheatre Parkway'],
      city: 'Mountain View',
      stateOrProvinceCode: 'CA',
      postalCode: '94043',
      countryCode: 'US',
    };

    const sampleRecipient = {
      streetLines: ['1 Hacker Way'],
      city: 'Menlo Park',
      stateOrProvinceCode: 'CA',
      postalCode: '94025',
      countryCode: 'US',
    };

    const samplePackages = [{
      weight: { value: 5.0, units: 'LB' as const },
      dimensions: {
        length: 12,
        width: 8,
        height: 6,
        units: 'IN' as const,
      },
      declaredValue: {
        amount: 100,
        currency: 'USD',
      },
    }];

    // Test rates
    console.log('💰 Testing rate retrieval...');
    const ratesResult = await FedexService.getRates({
      shipperAddress: sampleShipper,
      recipientAddress: sampleRecipient,
      packages: samplePackages,
    });

    if (ratesResult.success && ratesResult.data) {
      console.log('✅ Rates retrieved successfully');
      console.log(`   Found ${ratesResult.data.length} rate options:`);
      
      ratesResult.data.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.serviceName}: $${rate.totalCharge.toFixed(2)} (${rate.transitDays || '?'} days)`);
      });
      
      console.log(`   Transaction ID: ${ratesResult.transactionId}`);
      console.log(`   Correlation ID: ${ratesResult.correlationId}\n`);
      results.rates = true;
    } else {
      console.log('❌ Rate retrieval failed:', ratesResult.error);
      results.errors.push(`Rates: ${ratesResult.error}`);
    }

    // Test service availability
    console.log('🚚 Testing service availability...');
    const availabilityResult = await FedexService.getServiceAvailability({
      shipperAddress: sampleShipper,
      recipientAddress: sampleRecipient,
      packages: samplePackages,
    });

    if (availabilityResult.success && availabilityResult.data) {
      console.log('✅ Service availability retrieved successfully');
      console.log(`   Found ${availabilityResult.data.length} available services:`);
      
      availabilityResult.data.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.serviceName} (${service.deliveryDay || 'TBD'})`);
      });
      
      console.log(`   Transaction ID: ${availabilityResult.transactionId}`);
      console.log(`   Correlation ID: ${availabilityResult.correlationId}\n`);
      results.availability = true;
    } else {
      console.log('❌ Service availability failed:', availabilityResult.error);
      results.errors.push(`Availability: ${availabilityResult.error}`);
    }

    // Test label creation (use a more complete address for shipment)
    console.log('🏷️  Testing label creation...');
    const labelResult = await FedexService.createShipment({
      shipper: {
        address: sampleShipper,
        contact: {
          personName: 'Test Shipper',
          companyName: 'PBCEx Dev Team',
          phoneNumber: '650-555-0001',
          emailAddress: 'dev@pbcex.com',
        },
      },
      recipient: {
        address: sampleRecipient,
        contact: {
          personName: 'Test Recipient',
          companyName: 'Test Company',
          phoneNumber: '650-555-0002',
          emailAddress: 'test@example.com',
        },
      },
      packages: samplePackages.map(pkg => ({
        ...pkg,
        customerReference: 'DEV-TEST-001',
      })),
      serviceType: 'FEDEX_GROUND',
      labelImageType: 'PDF',
    });

    if (labelResult.success && labelResult.data) {
      console.log('✅ Label created successfully');
      console.log(`   Tracking Number: ${labelResult.data.trackingNumber}`);
      console.log(`   Service Type: ${labelResult.data.serviceType}`);
      console.log(`   Delivery Date: ${labelResult.data.deliveryDate || 'TBD'}`);
      console.log(`   Label File: ${labelResult.data.labelUrl}`);
      console.log(`   Total Charge: $${labelResult.data.totalCharge?.toFixed(2) || 'N/A'}`);
      console.log(`   Transaction ID: ${labelResult.transactionId}`);
      console.log(`   Correlation ID: ${labelResult.correlationId}\n`);
      results.label = true;
    } else {
      console.log('❌ Label creation failed:', labelResult.error);
      results.errors.push(`Label: ${labelResult.error}`);
    }

  } catch (error) {
    console.log('💥 Smoke test crashed:', error);
    results.errors.push(`Crash: ${error}`);
  } finally {
    // Cleanup
    try {
      await FedexService.shutdown();
      await cache.disconnect();
    } catch (cleanupError) {
      console.log('⚠️  Cleanup error:', cleanupError);
    }
  }

  return results;
}

function printSummary(results: TestResults): void {
  console.log('=====================================');
  console.log('📊 SMOKE TEST SUMMARY');
  console.log('=====================================');
  
  const tests = [
    { name: 'OAuth Token', passed: results.oauth },
    { name: 'Rate Quotes', passed: results.rates },
    { name: 'Service Availability', passed: results.availability },
    { name: 'Label Creation', passed: results.label },
  ];

  tests.forEach(test => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.name}`);
  });

  const passCount = tests.filter(t => t.passed).length;
  const totalCount = tests.length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (passCount === totalCount) {
    console.log('\n🎉 All tests passed! FedEx integration is working.');
  } else if (passCount > 0) {
    console.log('\n⚠️  Partial success. Some FedEx features are working.');
    console.log('   Check your configuration and FedEx account status.');
  } else {
    console.log('\n💔 All tests failed. Check your FedEx configuration.');
    console.log('   Verify FEDEX_CLIENT_ID, FEDEX_CLIENT_SECRET, and FEDEX_ACCOUNT_NUMBER.');
  }

  console.log('\n💡 TIPS:');
  console.log('   • Ensure your FedEx developer account is active');
  console.log('   • Check that your account number is correct');
  console.log('   • Verify you\'re using the correct base URL (sandbox vs production)');
  console.log('   • Labels created in test mode cannot be used for actual shipping');
}

// Main execution
async function main(): Promise<void> {
  try {
    const results = await runFedExSmokeTest();
    printSummary(results);
    
    // Exit with appropriate code
    const hasErrors = results.errors.length > 0;
    const allPassed = results.oauth && results.rates && results.availability && results.label;
    
    if (allPassed) {
      process.exit(0);
    } else if (hasErrors) {
      process.exit(1);
    } else {
      process.exit(2); // Partial success
    }
  } catch (error) {
    console.error('Fatal error running smoke test:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  try {
    await FedexService.shutdown();
    await cache.disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(130);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  try {
    await FedexService.shutdown();
    await cache.disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(143);
});

// Run the test
if (require.main === module) {
  main();
}
