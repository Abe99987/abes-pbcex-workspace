import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { FedexService } from '@/services/FedexService';
import { env } from '@/config/env';
import { 
  FedExServiceType,
  FedExPackagingType,
} from '@/services/fedex.types';

/**
 * FedEx Controller for PBCEx
 * Handles shipping operations using FedEx APIs
 */

interface FedExRatesRequest extends Request {
  body: {
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
    shipDate?: string;
    serviceTypes?: FedExServiceType[];
  };
}

interface FedExAvailabilityRequest extends Request {
  body: {
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
  };
}

interface FedExShipmentRequest extends Request {
  body: {
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
  };
}

export class FedexController {
  /**
   * POST /api/fedex/rates
   * Get shipping rates
   */
  static getRates = asyncHandler(async (req: FedExRatesRequest, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';
    const clientIp = req.ip || 'unknown';

    logInfo('FedEx rates request', { 
      requestId,
      clientIp,
      packageCount: req.body.packages?.length || 0,
      shipperZip: req.body.shipperAddress?.postalCode,
      recipientZip: req.body.recipientAddress?.postalCode,
    });

    // Input validation
    const { shipperAddress, recipientAddress, packages } = req.body;

    if (!shipperAddress || !recipientAddress || !packages || !Array.isArray(packages)) {
      throw createError.badRequest('Missing required fields: shipperAddress, recipientAddress, packages');
    }

    if (packages.length === 0 || packages.length > 99) {
      throw createError.badRequest('Package count must be between 1 and 99');
    }

    // Validate addresses
    FedexController.validateAddress(shipperAddress, 'shipper');
    FedexController.validateAddress(recipientAddress, 'recipient');

    // Validate packages
    packages.forEach((pkg, index) => {
      FedexController.validatePackage(pkg, index);
    });

    try {
      const result = await FedexService.getRates(req.body);

      if (result.success) {
        logInfo('FedEx rates retrieved successfully', {
          requestId,
          rateCount: result.data?.length || 0,
          transactionId: result.transactionId,
          correlationId: result.correlationId,
        });

        res.status(200).json({
          success: true,
          message: 'Rates retrieved successfully',
          data: {
            rates: result.data,
            transactionId: result.transactionId,
            correlationId: result.correlationId,
          },
        });
      } else {
        logWarn('FedEx rates request failed', {
          requestId,
          error: result.error,
          correlationId: result.correlationId,
        });

        res.status(400).json({
          success: false,
          code: 'RATES_ERROR',
          message: result.error || 'Failed to get rates',
          correlationId: result.correlationId,
        });
      }
    } catch (error) {
      logError('FedEx rates endpoint error', {
        error: error as Error,
        requestId,
      });

      throw createError.internalServerError('Shipping service error');
    }
  });

  /**
   * POST /api/fedex/availability
   * Check service availability
   */
  static getServiceAvailability = asyncHandler(async (req: FedExAvailabilityRequest, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('FedEx availability request', { 
      requestId,
      packageCount: req.body.packages?.length || 0,
      shipperZip: req.body.shipperAddress?.postalCode,
      recipientZip: req.body.recipientAddress?.postalCode,
    });

    // Input validation (similar to rates)
    const { shipperAddress, recipientAddress, packages } = req.body;

    if (!shipperAddress || !recipientAddress || !packages || !Array.isArray(packages)) {
      throw createError.badRequest('Missing required fields: shipperAddress, recipientAddress, packages');
    }

    FedexController.validateAddress(shipperAddress, 'shipper');
    FedexController.validateAddress(recipientAddress, 'recipient');

    packages.forEach((pkg, index) => {
      if (!pkg.weight || typeof pkg.weight.value !== 'number' || pkg.weight.value <= 0) {
        throw createError.badRequest(`Package ${index + 1}: Invalid weight`);
      }
    });

    try {
      const result = await FedexService.getServiceAvailability(req.body);

      if (result.success) {
        logInfo('FedEx availability retrieved successfully', {
          requestId,
          serviceCount: result.data?.length || 0,
          transactionId: result.transactionId,
          correlationId: result.correlationId,
        });

        res.status(200).json({
          success: true,
          message: 'Service availability retrieved successfully',
          data: {
            services: result.data,
            transactionId: result.transactionId,
            correlationId: result.correlationId,
          },
        });
      } else {
        logWarn('FedEx availability request failed', {
          requestId,
          error: result.error,
          correlationId: result.correlationId,
        });

        res.status(400).json({
          success: false,
          code: 'AVAILABILITY_ERROR',
          message: result.error || 'Failed to check service availability',
          correlationId: result.correlationId,
        });
      }
    } catch (error) {
      logError('FedEx availability endpoint error', {
        error: error as Error,
        requestId,
      });

      throw createError.internalServerError('Shipping service error');
    }
  });

  /**
   * POST /api/fedex/ship/label
   * Create shipment and generate label
   */
  static createShipmentLabel = asyncHandler(async (req: FedExShipmentRequest, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('FedEx shipment creation request', { 
      requestId,
      serviceType: req.body.serviceType,
      packageCount: req.body.packages?.length || 0,
    });

    // Input validation
    const { shipper, recipient, packages, serviceType } = req.body;

    if (!shipper || !recipient || !packages || !serviceType) {
      throw createError.badRequest('Missing required fields: shipper, recipient, packages, serviceType');
    }

    if (!Array.isArray(packages) || packages.length === 0) {
      throw createError.badRequest('At least one package is required');
    }

    // Validate shipper and recipient
    FedexController.validateParty(shipper, 'shipper');
    FedexController.validateParty(recipient, 'recipient');

    // Validate service type
    const validServiceTypes: FedExServiceType[] = [
      'FEDEX_GROUND', 'GROUND_HOME_DELIVERY', 'FEDEX_EXPRESS_SAVER',
      'FEDEX_2_DAY', 'FEDEX_2_DAY_AM', 'STANDARD_OVERNIGHT',
      'PRIORITY_OVERNIGHT', 'FIRST_OVERNIGHT'
    ];

    if (!validServiceTypes.includes(serviceType)) {
      throw createError.badRequest(`Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`);
    }

    // Validate packages
    packages.forEach((pkg, index) => {
      FedexController.validatePackage(pkg, index);
    });

    try {
      const result = await FedexService.createShipment(req.body);

      if (result.success) {
        logInfo('FedEx shipment created successfully', {
          requestId,
          trackingNumber: result.data?.trackingNumber,
          serviceType: result.data?.serviceType,
          transactionId: result.transactionId,
          correlationId: result.correlationId,
        });

        res.status(200).json({
          success: true,
          message: 'Shipment created and label generated successfully',
          data: {
            trackingNumber: result.data?.trackingNumber,
            labelUrl: result.data?.labelUrl,
            serviceType: result.data?.serviceType,
            deliveryDate: result.data?.deliveryDate,
            totalCharge: result.data?.totalCharge,
            currency: result.data?.currency,
            transactionId: result.transactionId,
            correlationId: result.correlationId,
            ...(env.NODE_ENV === 'development' && {
              labelBase64: result.data?.labelBase64,
            }),
          },
        });
      } else {
        logWarn('FedEx shipment creation failed', {
          requestId,
          error: result.error,
          correlationId: result.correlationId,
        });

        res.status(400).json({
          success: false,
          code: 'SHIPMENT_ERROR',
          message: result.error || 'Failed to create shipment',
          correlationId: result.correlationId,
        });
      }
    } catch (error) {
      logError('FedEx shipment endpoint error', {
        error: error as Error,
        requestId,
      });

      throw createError.internalServerError('Shipping service error');
    }
  });

  /**
   * GET /api/fedex/health
   * Get FedEx service health status
   */
  static getHealthStatus = asyncHandler(async (req: Request, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('FedEx health check', { requestId });

    try {
      const healthStatus = FedexService.getHealthStatus();

      res.status(200).json({
        success: true,
        service: 'FedexService',
        status: healthStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError('FedEx health check error', {
        error: error as Error,
        requestId,
      });

      res.status(500).json({
        success: false,
        service: 'FedexService',
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Private validation helpers

  private static validateAddress(address: unknown, type: string): void {
    const addr = address as Record<string, unknown>;
    if (!addr.streetLines || !Array.isArray(addr.streetLines) || addr.streetLines.length === 0) {
      throw createError.badRequest(`${type} address: streetLines is required`);
    }

    if (!addr.city || typeof addr.city !== 'string') {
      throw createError.badRequest(`${type} address: city is required`);
    }

    if (!addr.stateOrProvinceCode || typeof addr.stateOrProvinceCode !== 'string') {
      throw createError.badRequest(`${type} address: stateOrProvinceCode is required`);
    }

    if (!addr.postalCode || typeof addr.postalCode !== 'string') {
      throw createError.badRequest(`${type} address: postalCode is required`);
    }

    if (!addr.countryCode || typeof addr.countryCode !== 'string') {
      throw createError.badRequest(`${type} address: countryCode is required`);
    }

    // Validate US postal codes
    if (addr.countryCode === 'US' && !/^\d{5}(-\d{4})?$/.test(addr.postalCode as string)) {
      throw createError.badRequest(`${type} address: Invalid US postal code format`);
    }
  }

  private static validateParty(party: unknown, type: string): void {
    const partyObj = party as Record<string, unknown>;
    if (!partyObj.address) {
      throw createError.badRequest(`${type}: address is required`);
    }

    if (!partyObj.contact) {
      throw createError.badRequest(`${type}: contact is required`);
    }

    FedexController.validateAddress(partyObj.address, type);

    const contact = partyObj.contact as Record<string, unknown>;
    // Validate contact
    if (!contact.personName || typeof contact.personName !== 'string') {
      throw createError.badRequest(`${type} contact: personName is required`);
    }

    if (!contact.phoneNumber || typeof contact.phoneNumber !== 'string') {
      throw createError.badRequest(`${type} contact: phoneNumber is required`);
    }

    // Validate phone number format (basic)
    if (!/[\d\s\-\+\(\)]{10,}/.test(contact.phoneNumber)) {
      throw createError.badRequest(`${type} contact: Invalid phone number format`);
    }

    // Validate email if provided
    if (contact.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.emailAddress as string)) {
      throw createError.badRequest(`${type} contact: Invalid email format`);
    }
  }

  private static validatePackage(pkg: unknown, index: number): void {
    const packageObj = pkg as Record<string, unknown>;
    const weight = packageObj.weight as Record<string, unknown>;
    
    if (!weight || typeof weight.value !== 'number' || weight.value <= 0) {
      throw createError.badRequest(`Package ${index + 1}: Invalid weight`);
    }

    if (!weight.units || !['LB', 'KG'].includes(weight.units as string)) {
      throw createError.badRequest(`Package ${index + 1}: Weight units must be LB or KG`);
    }

    if (weight.value > 150) {
      throw createError.badRequest(`Package ${index + 1}: Weight exceeds maximum (150 lbs/kg)`);
    }

    // Validate dimensions if provided
    if (packageObj.dimensions) {
      const dimensions = packageObj.dimensions as Record<string, unknown>;
      const { length, width, height, units } = dimensions;
      
      if (!units || !['IN', 'CM'].includes(units as string)) {
        throw createError.badRequest(`Package ${index + 1}: Dimension units must be IN or CM`);
      }

      if (typeof length !== 'number' || typeof width !== 'number' || typeof height !== 'number' ||
          length <= 0 || width <= 0 || height <= 0) {
        throw createError.badRequest(`Package ${index + 1}: Invalid dimensions`);
      }

      // Basic size limits (inches)
      const maxDimension = units === 'IN' ? 108 : 274; // ~108 inches = 274 cm
      if (length > maxDimension || width > maxDimension || height > maxDimension) {
        throw createError.badRequest(`Package ${index + 1}: Exceeds maximum dimension limits`);
      }
    }

    // Validate declared value if provided
    if (packageObj.declaredValue) {
      const declaredValue = packageObj.declaredValue as Record<string, unknown>;
      if (typeof declaredValue.amount !== 'number' || declaredValue.amount < 0) {
        throw createError.badRequest(`Package ${index + 1}: Invalid declared value amount`);
      }

      if (!declaredValue.currency || typeof declaredValue.currency !== 'string') {
        throw createError.badRequest(`Package ${index + 1}: Declared value currency is required`);
      }
    }
  }
}

export default FedexController;
