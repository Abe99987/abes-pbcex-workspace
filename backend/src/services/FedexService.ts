import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { logInfo, logWarn, logError } from '@/utils/logger';

// Metadata types are declared in utils/httpClient.ts
import { env, integrations } from '@/config/env';
import { cache } from '@/cache/redis';
import fs from 'fs/promises';
import path from 'path';
import {
  FedExOAuthResponse,
  FedExRateRequest,
  FedExRateResponse,
  FedExServiceAvailabilityRequest,
  FedExServiceAvailabilityResponse,
  FedExShipmentRequest,
  FedExShipmentResponse,
  FedExServiceResult,
  FedExRateQuote,
  FedExServiceOption,
  FedExLabelResult,
  FedExServiceError,
  FedExServiceType,
  FedExPackagingType,
} from './fedex.types';

/**
 * FedEx Service for PBCEx
 * Production-quality FedEx API integration supporting:
 * - OAuth 2.0 authentication with token caching
 * - Rate shopping and quotes
 * - Service availability checking
 * - Shipment creation and label generation
 */

export class FedexService {
  private static httpClient: AxiosInstance;
  private static isInitialized = false;
  private static readonly TOKEN_CACHE_KEY = 'fedex:oauth:token';
  private static readonly TOKEN_SAFETY_MARGIN_SECONDS = 300; // 5 minutes

  /**
   * Initialize FedEx service
   */
  static async initialize(): Promise<void> {
    if (FedexService.isInitialized) {
      logWarn('FedexService already initialized');
      return;
    }

    logInfo('Initializing FedexService');

    try {
      // Create HTTP client with timeout and retry logic
      FedexService.httpClient = axios.create({
        baseURL: env.FEDEX_BASE_URL,
        timeout: 30000, // 30 seconds
        headers: {
          'Content-Type': 'application/json',
          'X-locale': 'en_US',
        },
        // Retry configuration
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      // Add request interceptor for logging
      FedexService.httpClient.interceptors.request.use(
        (config) => {
          const correlationId = Math.random().toString(36).substr(2, 9);
          config.metadata = { correlationId, startTime: Date.now() };
          
          logInfo('FedEx API request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            correlationId,
            hasAuth: !!config.headers?.['Authorization'],
          });
          
          return config;
        }
      );

      // Add response interceptor for logging and error handling
      FedexService.httpClient.interceptors.response.use(
        (response) => {
          const { correlationId, startTime } = response.config.metadata || {};
          const duration = startTime ? Date.now() - startTime : 0;
          
          logInfo('FedEx API response', {
            status: response.status,
            correlationId,
            duration,
          });
          
          return response;
        },
        (error: AxiosError) => {
          const { correlationId, startTime } = error.config?.metadata || {};
          const duration = startTime ? Date.now() - startTime : 0;
          
          logError('FedEx API error', {
            status: error.response?.status,
            correlationId,
            duration,
            error: error.message,
            data: error.response?.data,
          });
          
          return Promise.reject(error);
        }
      );

      // Test connectivity if configured
      if (integrations.fedex) {
        await FedexService.testConnection();
        logInfo('FedEx API connectivity verified');
      } else {
        logWarn('FedEx not fully configured, service will be mocked');
      }

      FedexService.isInitialized = true;
      logInfo('FedexService initialized successfully');

    } catch (error) {
      logError('Failed to initialize FedexService', error as Error);
      // Continue with mock service
    }
  }

  /**
   * Get OAuth token (cached)
   */
  static async getToken(): Promise<FedExServiceResult<string>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    try {
      // Check cache first
      const cachedToken = await FedexService.getCachedToken();
      if (cachedToken) {
        logInfo('Using cached FedEx token', { correlationId });
        return {
          success: true,
          data: cachedToken,
          correlationId,
        };
      }

      // Get new token
      if (!integrations.fedex || !env.FEDEX_CLIENT_ID || !env.FEDEX_CLIENT_SECRET) {
        return {
          success: false,
          error: 'FedEx not configured',
          correlationId,
        };
      }

      logInfo('Requesting new FedEx OAuth token', { correlationId });

      const response = await FedexService.httpClient.post<FedExOAuthResponse>('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: env.FEDEX_CLIENT_ID,
        client_secret: env.FEDEX_CLIENT_SECRET,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status !== 200) {
        return {
          success: false,
          error: `OAuth failed with status ${response.status}`,
          correlationId,
        };
      }

      const { access_token, expires_in } = response.data;

      // Cache token with TTL
      const ttl = expires_in - FedexService.TOKEN_SAFETY_MARGIN_SECONDS;
      await cache.setex(FedexService.TOKEN_CACHE_KEY, ttl, access_token);

      logInfo('FedEx OAuth token obtained and cached', { 
        correlationId,
        expiresIn: expires_in,
        ttl,
      });

      return {
        success: true,
        data: access_token,
        correlationId,
      };

    } catch (error) {
      logError('Failed to get FedEx token', {
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown token error',
        correlationId,
      };
    }
  }

  /**
   * Get shipping rates
   */
  static async getRates(request: {
    shipperAddress: {
      streetLines: string[];
      city: string;
      stateOrProvinceCode: string;
      postalCode: string;
      countryCode: string;
    };
    recipientAddress: {
      streetLines: string[];
      city: string;
      stateOrProvinceCode: string;
      postalCode: string;
      countryCode: string;
    };
    packages: Array<{
      weight: { value: number; units: 'LB' | 'KG' };
      dimensions?: { length: number; width: number; height: number; units: 'IN' | 'CM' };
      declaredValue?: { amount: number; currency: string };
    }>;
    shipDate?: string; // YYYY-MM-DD, defaults to tomorrow
    serviceTypes?: FedExServiceType[];
  }): Promise<FedExServiceResult<FedExRateQuote[]>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Getting FedEx rates', {
      correlationId,
      packageCount: request.packages.length,
      shipperZip: request.shipperAddress.postalCode,
      recipientZip: request.recipientAddress.postalCode,
    });

    try {
      if (!integrations.fedexFull) {
        // Mock rates for development
        const mockRates = FedexService.generateMockRates(request);
        return {
          success: true,
          data: mockRates,
          correlationId,
        };
      }

      // Get auth token
      const tokenResult = await FedexService.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          error: tokenResult.error || 'Failed to get auth token',
          correlationId,
        };
      }

      // Prepare request
      const shipDate = request.shipDate || FedexService.getTomorrowDate();
      const fedexRequest: FedExRateRequest = {
        accountNumber: {
          value: env.FEDEX_ACCOUNT_NUMBER!,
        },
        requestedShipment: {
          shipper: {
            address: request.shipperAddress,
          },
          recipient: {
            address: request.recipientAddress,
          },
          shipDateStamp: shipDate,
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          requestedPackageLineItems: request.packages.map((pkg, index) => ({
            sequenceNumber: index + 1,
            groupPackageCount: 1,
            weight: pkg.weight,
            dimensions: pkg.dimensions,
            declaredValue: pkg.declaredValue,
          })),
          rateRequestType: ['ACCOUNT', 'LIST'],
          preferredCurrency: 'USD',
        },
      };

      // Make API request
      const response = await FedexService.httpClient.post<FedExRateResponse>('/rate/v1/rates/quotes', fedexRequest, {
        headers: {
          'Authorization': `Bearer ${tokenResult.data}`,
        },
      });

      if (response.status !== 200) {
        return {
          success: false,
          error: `Rate request failed with status ${response.status}`,
          correlationId,
        };
      }

      // Process response
      const rates = FedexService.parseRateResponse(response.data);
      
      // Filter by requested service types if specified
      const filteredRates = request.serviceTypes 
        ? rates.filter(rate => request.serviceTypes!.includes(rate.serviceType))
        : rates;

      logInfo('FedEx rates retrieved successfully', {
        correlationId,
        rateCount: filteredRates.length,
        transactionId: response.data.transactionId,
      });

      return {
        success: true,
        data: filteredRates,
        transactionId: response.data.transactionId,
        correlationId,
      };

    } catch (error) {
      logError('Failed to get FedEx rates', {
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown rate error',
        correlationId,
      };
    }
  }

  /**
   * Get service availability
   */
  static async getServiceAvailability(request: {
    shipperAddress: {
      streetLines: string[];
      city: string;
      stateOrProvinceCode: string;
      postalCode: string;
      countryCode: string;
    };
    recipientAddress: {
      streetLines: string[];
      city: string;
      stateOrProvinceCode: string;
      postalCode: string;
      countryCode: string;
    };
    packages: Array<{
      weight: { value: number; units: 'LB' | 'KG' };
      dimensions?: { length: number; width: number; height: number; units: 'IN' | 'CM' };
    }>;
    shipDate?: string;
  }): Promise<FedExServiceResult<FedExServiceOption[]>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Checking FedEx service availability', {
      correlationId,
      shipperZip: request.shipperAddress.postalCode,
      recipientZip: request.recipientAddress.postalCode,
    });

    try {
      if (!integrations.fedexFull) {
        // Mock service availability
        const mockServices = FedexService.generateMockServices();
        return {
          success: true,
          data: mockServices,
          correlationId,
        };
      }

      // Get auth token
      const tokenResult = await FedexService.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          error: tokenResult.error || 'Failed to get auth token',
          correlationId,
        };
      }

      const shipDate = request.shipDate || FedexService.getTomorrowDate();
      const fedexRequest: FedExServiceAvailabilityRequest = {
        requestedShipment: {
          shipDatestamp: shipDate,
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          shipper: { address: request.shipperAddress },
          recipient: { address: request.recipientAddress },
          requestedPackageLineItems: request.packages.map((pkg, index) => ({
            sequenceNumber: index + 1,
            weight: pkg.weight,
            dimensions: pkg.dimensions,
          })),
        },
      };

      const response = await FedexService.httpClient.post<FedExServiceAvailabilityResponse>(
        '/ship/v1/shipments/availability', 
        fedexRequest,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data}`,
          },
        }
      );

      if (response.status !== 200) {
        return {
          success: false,
          error: `Service availability request failed with status ${response.status}`,
          correlationId,
        };
      }

      const services = FedexService.parseServiceAvailabilityResponse(response.data);

      logInfo('FedEx service availability retrieved', {
        correlationId,
        serviceCount: services.length,
        transactionId: response.data.transactionId,
      });

      return {
        success: true,
        data: services,
        transactionId: response.data.transactionId,
        correlationId,
      };

    } catch (error) {
      logError('Failed to get FedEx service availability', {
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown availability error',
        correlationId,
      };
    }
  }

  /**
   * Create shipment and generate label
   */
  static async createShipment(request: {
    shipper: {
      address: {
        streetLines: string[];
        city: string;
        stateOrProvinceCode: string;
        postalCode: string;
        countryCode: string;
      };
      contact: {
        personName: string;
        companyName?: string;
        phoneNumber: string;
        emailAddress?: string;
      };
    };
    recipient: {
      address: {
        streetLines: string[];
        city: string;
        stateOrProvinceCode: string;
        postalCode: string;
        countryCode: string;
      };
      contact: {
        personName: string;
        companyName?: string;
        phoneNumber: string;
        emailAddress?: string;
      };
    };
    packages: Array<{
      weight: { value: number; units: 'LB' | 'KG' };
      dimensions?: { length: number; width: number; height: number; units: 'IN' | 'CM' };
      declaredValue?: { amount: number; currency: string };
      customerReference?: string;
    }>;
    serviceType: FedExServiceType;
    packagingType?: FedExPackagingType;
    labelImageType?: 'PDF' | 'PNG';
    shipDate?: string;
  }): Promise<FedExServiceResult<FedExLabelResult>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Creating FedEx shipment', {
      correlationId,
      serviceType: request.serviceType,
      packageCount: request.packages.length,
    });

    try {
      if (!integrations.fedexFull) {
        // Mock shipment creation
        const mockResult = await FedexService.generateMockLabel(request);
        return {
          success: true,
          data: mockResult,
          correlationId,
        };
      }

      // Get auth token
      const tokenResult = await FedexService.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          error: tokenResult.error || 'Failed to get auth token',
          correlationId,
        };
      }

      const shipDate = request.shipDate || FedexService.getTomorrowDate();
      const fedexRequest: FedExShipmentRequest = {
        labelResponseOptions: 'LABEL',
        requestedShipment: {
          shipper: {
            address: request.shipper.address,
            contact: request.shipper.contact,
          },
          recipients: [{
            address: request.recipient.address,
            contact: request.recipient.contact,
          }],
          shipDatestamp: shipDate,
          serviceType: request.serviceType,
          packagingType: request.packagingType || 'YOUR_PACKAGING',
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          shippingChargesPayment: {
            paymentType: 'SENDER',
          },
          labelSpecification: {
            imageType: request.labelImageType || 'PDF',
            labelStockType: 'PAPER_4X6',
            labelPrintingOrientation: 'TOP_EDGE_OF_TEXT_FIRST',
          },
          requestedPackageLineItems: request.packages.map((pkg, index) => ({
            sequenceNumber: index + 1,
            weight: pkg.weight,
            dimensions: pkg.dimensions,
            declaredValue: pkg.declaredValue,
            customerReferences: pkg.customerReference ? [{
              customerReferenceType: 'CUSTOMER_REFERENCE',
              value: pkg.customerReference,
            }] : undefined,
          })),
        },
        accountNumber: {
          value: env.FEDEX_ACCOUNT_NUMBER!,
        },
      };

      const response = await FedexService.httpClient.post<FedExShipmentResponse>(
        '/ship/v1/shipments',
        fedexRequest,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data}`,
          },
        }
      );

      if (response.status !== 200) {
        return {
          success: false,
          error: `Shipment creation failed with status ${response.status}`,
          correlationId,
        };
      }

      // Parse response and save label
      const labelResult = await FedexService.parseShipmentResponse(response.data, correlationId);

      logInfo('FedEx shipment created successfully', {
        correlationId,
        trackingNumber: labelResult.trackingNumber,
        serviceType: labelResult.serviceType,
        transactionId: response.data.transactionId,
      });

      return {
        success: true,
        data: labelResult,
        transactionId: response.data.transactionId,
        correlationId,
      };

    } catch (error) {
      logError('Failed to create FedEx shipment', {
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown shipment error',
        correlationId,
      };
    }
  }

  /**
   * Save label to local file system
   */
  static async saveLabel(base64Content: string, filename?: string): Promise<string> {
    const labelsDir = path.join(process.cwd(), 'tmp', 'labels');
    await fs.mkdir(labelsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = filename || `fedex-label-${timestamp}.pdf`;
    const filePath = path.join(labelsDir, fileName);

    const buffer = Buffer.from(base64Content, 'base64');
    await fs.writeFile(filePath, buffer);

    logInfo('FedEx label saved', { filePath });
    return filePath;
  }

  /**
   * Get service health status
   */
  static getHealthStatus(): {
    status: string;
    configured: boolean;
    accountConfigured: boolean;
    baseUrl: string;
  } {
    return {
      status: FedexService.isInitialized ? 'initialized' : 'not_initialized',
      configured: integrations.fedex,
      accountConfigured: integrations.fedexFull,
      baseUrl: env.FEDEX_BASE_URL,
    };
  }

  /**
   * Shutdown service gracefully
   */
  static async shutdown(): Promise<void> {
    logInfo('Shutting down FedexService');
    FedexService.isInitialized = false;
    logInfo('FedexService shut down');
  }

  // Private helper methods

  private static async getCachedToken(): Promise<string | null> {
    try {
      return await cache.get(FedexService.TOKEN_CACHE_KEY);
    } catch (error) {
      logWarn('Failed to get cached FedEx token', { error });
      return null;
    }
  }

  private static async testConnection(): Promise<void> {
    if (!integrations.fedex) {
      throw new Error('FedEx not configured');
    }

    // Test OAuth endpoint
    const response = await FedexService.httpClient.post('/oauth/token', {
      grant_type: 'client_credentials',
      client_id: 'test',
      client_secret: 'test',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: () => true, // Accept any status for test
    });

    if (response.status === 404) {
      throw new Error('FedEx API endpoint not found - check base URL');
    }
  }

  private static getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private static generateMockRates(request: any): FedExRateQuote[] {
    const baseRate = 15.99;
    return [
      {
        serviceType: 'FEDEX_GROUND',
        serviceName: 'FedEx Ground',
        packagingType: 'YOUR_PACKAGING',
        totalCharge: baseRate,
        baseCharge: baseRate - 2.50,
        currency: 'USD',
        transitDays: 3,
        deliveryDay: 'MON',
        surcharges: [
          { type: 'FUEL', description: 'Fuel Surcharge', amount: 2.50 },
        ],
      },
      {
        serviceType: 'FEDEX_EXPRESS_SAVER',
        serviceName: 'FedEx Express Saver',
        packagingType: 'YOUR_PACKAGING',
        totalCharge: baseRate + 8,
        baseCharge: baseRate + 5.50,
        currency: 'USD',
        transitDays: 2,
        deliveryDay: 'FRI',
        surcharges: [
          { type: 'FUEL', description: 'Fuel Surcharge', amount: 2.50 },
        ],
      },
    ];
  }

  private static generateMockServices(): FedExServiceOption[] {
    return [
      {
        serviceType: 'FEDEX_GROUND',
        serviceName: 'FedEx Ground',
        packagingType: 'YOUR_PACKAGING',
        transitDays: 3,
        deliveryDay: 'MON',
      },
      {
        serviceType: 'FEDEX_EXPRESS_SAVER',
        serviceName: 'FedEx Express Saver',
        packagingType: 'YOUR_PACKAGING',
        transitDays: 2,
        deliveryDay: 'FRI',
      },
    ];
  }

  private static async generateMockLabel(request: any): Promise<FedExLabelResult> {
    const trackingNumber = `1234567890${Date.now().toString().slice(-2)}`;
    const mockPdfContent = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKEZlZEV4IE1vY2sgTGFiZWwpCi9Qcm9kdWNlciAoUEJDRXggTW9jayBHZW5lcmF0b3IpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNDA0MDEwMDAwMDBaKQo+PgplbmRvYmoKJSVFT0Y=';
    
    const filename = `mock-label-${trackingNumber}.pdf`;
    const filePath = await FedexService.saveLabel(mockPdfContent, filename);
    
    return {
      trackingNumber,
      labelUrl: filePath,
      labelBase64: mockPdfContent,
      serviceType: request.serviceType,
      deliveryDate: FedexService.getTomorrowDate(),
      totalCharge: 15.99,
      currency: 'USD',
    };
  }

  private static parseRateResponse(response: FedExRateResponse): FedExRateQuote[] {
    return response.output.rateReplyDetails.map(detail => ({
      serviceType: detail.serviceType as FedExServiceType,
      serviceName: detail.serviceName,
      packagingType: detail.packagingType as FedExPackagingType,
      totalCharge: detail.ratedShipmentDetails[0]?.totalNetCharge || 0,
      baseCharge: detail.ratedShipmentDetails[0]?.totalBaseCharge || 0,
      currency: detail.ratedShipmentDetails[0]?.shipmentRateDetail.currency || 'USD',
      transitDays: detail.operationalDetail ? parseInt(detail.operationalDetail.transitTime) : undefined,
      deliveryDate: detail.operationalDetail?.deliveryDate,
      deliveryDay: detail.operationalDetail?.deliveryDay,
      surcharges: detail.ratedShipmentDetails[0]?.shipmentRateDetail.surcharges || [],
    }));
  }

  private static parseServiceAvailabilityResponse(response: FedExServiceAvailabilityResponse): FedExServiceOption[] {
    return response.output.options.map(option => ({
      serviceType: option.serviceType as FedExServiceType,
      serviceName: option.serviceName,
      packagingType: option.packagingType as FedExPackagingType,
      deliveryDate: option.commit?.dateDetail.dayCxsFormat,
      deliveryDay: option.commit?.dateDetail.dayOfWeek,
    }));
  }

  private static async parseShipmentResponse(response: FedExShipmentResponse, correlationId: string): Promise<FedExLabelResult> {
    const transaction = response.output.transactionShipments[0];
    const packageDetail = transaction.completedPackageDetails[0];
    const document = packageDetail.packageDocuments[0];

    const filename = `label-${packageDetail.trackingNumber}-${correlationId}.pdf`;
    const filePath = await FedexService.saveLabel(document.encodedLabel, filename);

    return {
      trackingNumber: packageDetail.trackingNumber,
      labelUrl: filePath,
      labelBase64: document.encodedLabel,
      serviceType: transaction.serviceType as FedExServiceType,
      deliveryDate: packageDetail.operationalDetail?.deliveryDate,
    };
  }
}

export default FedexService;
