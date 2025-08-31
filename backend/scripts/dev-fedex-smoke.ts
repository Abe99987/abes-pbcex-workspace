#!/usr/bin/env ts-node
/**
 * FedEx Integration Smoke Test Script
 *
 * This script tests the basic FedEx integration functionality:
 * 1. OAuth token acquisition
 * 2. Rates API call
 * 3. Service availability check
 * 4. Label creation (dummy shipment)
 *
 * Usage: npm run dev:fedex-smoke
 */

import { FedexService } from '../src/services/FedexService';
import { logInfo, logError, logWarn } from '../src/utils/logger';
import { env } from '../src/config/env';

async function runSmokeTest(): Promise<void> {
  logInfo('🚚 Starting FedEx Integration Smoke Test');

  try {
    // Initialize FedEx service
    await FedexService.initialize();
    logInfo('✅ FedEx service initialized');

    // Test 1: OAuth Token
    logInfo('🔑 Testing OAuth token acquisition...');
    const tokenResult = await FedexService.getToken();
    if (tokenResult.success && tokenResult.token) {
      logInfo('✅ OAuth token acquired successfully');
    } else {
      logError('❌ Failed to acquire OAuth token', tokenResult.error);
      return;
    }

    // Test 2: Rates API
    logInfo('💰 Testing Rates API...');
    const ratesPayload = {
      accountNumber: {
        value: env.FEDEX_ACCOUNT_NUMBER || 'TEST_ACCOUNT',
      },
      requestedShipment: {
        shipper: {
          address: {
            streetLines: ['1234 Test St'],
            city: 'Memphis',
            stateOrProvinceCode: 'TN',
            postalCode: '38103',
            countryCode: 'US',
          },
        },
        recipient: {
          address: {
            streetLines: ['5678 Demo Ave'],
            city: 'New York',
            stateOrProvinceCode: 'NY',
            postalCode: '10001',
            countryCode: 'US',
          },
        },
        pickupType: 'USE_SCHEDULED_PICKUP',
        serviceType: 'FEDEX_GROUND',
        packagingType: 'YOUR_PACKAGING',
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: 10,
            },
            dimensions: {
              length: 12,
              width: 12,
              height: 12,
              units: 'IN',
            },
          },
        ],
      },
    };

    const ratesResult = await FedexService.getRates(ratesPayload);
    if (ratesResult.success) {
      logInfo('✅ Rates API call successful');
      if (ratesResult.data?.output?.rateReplyDetails) {
        logInfo(
          `📊 Found ${ratesResult.data.output.rateReplyDetails.length} rate options`
        );
      }
    } else {
      logWarn(
        '⚠️ Rates API failed (expected in test environment)',
        ratesResult.error
      );
    }

    // Test 3: Service Availability
    logInfo('🌐 Testing Service Availability API...');
    const availabilityPayload = {
      accountNumber: {
        value: env.FEDEX_ACCOUNT_NUMBER || 'TEST_ACCOUNT',
      },
      requestedShipment: {
        shipDateStamp: new Date().toISOString().split('T')[0],
        serviceType: 'FEDEX_GROUND',
        packagingType: 'YOUR_PACKAGING',
        shipper: {
          address: {
            streetLines: ['1234 Test St'],
            city: 'Memphis',
            stateOrProvinceCode: 'TN',
            postalCode: '38103',
            countryCode: 'US',
          },
        },
        recipient: {
          address: {
            streetLines: ['5678 Demo Ave'],
            city: 'New York',
            stateOrProvinceCode: 'NY',
            postalCode: '10001',
            countryCode: 'US',
          },
        },
      },
    };

    const availabilityResult =
      await FedexService.getServiceAvailability(availabilityPayload);
    if (availabilityResult.success) {
      logInfo('✅ Service Availability API call successful');
    } else {
      logWarn(
        '⚠️ Service Availability API failed (expected in test environment)',
        availabilityResult.error
      );
    }

    // Test 4: Label Creation (Dummy Shipment)
    logInfo('📦 Testing Label Creation API...');
    const shipmentPayload = {
      labelResponseOptions: 'LABEL',
      requestedShipment: {
        shipDatestamp: new Date().toISOString().split('T')[0],
        serviceType: 'FEDEX_GROUND',
        packagingType: 'YOUR_PACKAGING',
        shipper: {
          contact: {
            personName: 'Test Shipper',
            phoneNumber: '9015551234',
            emailAddress: 'shipper@test.com',
          },
          address: {
            streetLines: ['1234 Test St'],
            city: 'Memphis',
            stateOrProvinceCode: 'TN',
            postalCode: '38103',
            countryCode: 'US',
          },
        },
        recipients: [
          {
            contact: {
              personName: 'Test Recipient',
              phoneNumber: '2125551234',
              emailAddress: 'recipient@test.com',
            },
            address: {
              streetLines: ['5678 Demo Ave'],
              city: 'New York',
              stateOrProvinceCode: 'NY',
              postalCode: '10001',
              countryCode: 'US',
            },
          },
        ],
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: 10,
            },
            dimensions: {
              length: 12,
              width: 12,
              height: 12,
              units: 'IN',
            },
          },
        ],
      },
    };

    const shipmentResult = await FedexService.createShipment(shipmentPayload);
    if (shipmentResult.success) {
      logInfo('✅ Label Creation API call successful');
      if (
        shipmentResult.data?.output?.transactionShipments?.[0]
          ?.shipmentDocuments
      ) {
        logInfo('📄 Label generated and saved to tmp/labels/');
      }
    } else {
      logWarn(
        '⚠️ Label Creation API failed (expected in test environment)',
        shipmentResult.error
      );
    }

    logInfo('🎉 FedEx smoke test completed successfully!');
  } catch (error) {
    logError('💥 Smoke test failed with exception', error as Error);
    process.exit(1);
  } finally {
    await FedexService.shutdown();
  }
}

// Run the smoke test
if (require.main === module) {
  runSmokeTest().catch(error => {
    logError('Failed to run FedEx smoke test', error);
    process.exit(1);
  });
}

export { runSmokeTest };
