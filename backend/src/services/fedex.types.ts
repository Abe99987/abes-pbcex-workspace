/**
 * FedEx API Types for PBCEx
 * TypeScript interfaces for FedEx OAuth, Rates, Service Availability, and Open Ship APIs
 * Based on FedEx Developer API v1.0.0 JSON endpoints
 */

// Base types
export interface FedExError {
  code: string;
  message: string;
  parameterName?: string;
}

export interface FedExResponse<T> {
  transactionId?: string;
  customerTransactionId?: string;
  data?: T;
  errors?: FedExError[];
}

// OAuth Token Types
export interface FedExOAuthRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
}

export interface FedExOAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

// Address Types
export interface FedExAddress {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
  residential?: boolean;
}

export interface FedExContact {
  personName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  companyName?: string;
}

export interface FedExParty {
  address: FedExAddress;
  contact?: FedExContact;
}

// Package/Shipment Types
export interface FedExDimensions {
  length: number;
  width: number;
  height: number;
  units: 'IN' | 'CM';
}

export interface FedExWeight {
  units: 'LB' | 'KG';
  value: number;
}

export interface FedExPackage {
  weight: FedExWeight;
  dimensions?: FedExDimensions;
  groupPackageCount?: number;
  declaredValue?: {
    currency: string;
    amount: number;
  };
}

// Rate Service Types
export interface FedExRateRequest {
  accountNumber: {
    value: string;
  };
  requestedShipment: {
    shipper: FedExParty;
    recipient: FedExParty;
    shipDateStamp: string; // YYYY-MM-DD
    serviceType?: string;
    packagingType?: string;
    pickupType?: 'DROPOFF_AT_FEDEX_LOCATION' | 'CONTACT_FEDEX_TO_SCHEDULE';
    requestedPackageLineItems: Array<{
      sequenceNumber: number;
      groupPackageCount: number;
      weight: FedExWeight;
      dimensions?: FedExDimensions;
      declaredValue?: {
        currency: string;
        amount: number;
      };
    }>;
    rateRequestType?: Array<'ACCOUNT' | 'LIST'>;
    preferredCurrency?: string;
  };
  carrierCodes?: Array<'FDXE' | 'FDXG'>;
}

export interface FedExRateDetail {
  serviceType: string;
  serviceName: string;
  packagingType: string;
  ratedShipmentDetails: Array<{
    rateType: string;
    ratedWeightMethod: string;
    totalDiscounts: number;
    totalBaseCharge: number;
    totalNetCharge: number;
    totalNetFedExCharge: number;
    shipmentRateDetail: {
      currency: string;
      rateZone: string;
      dimDivisor: number;
      fuelSurchargePercent: number;
      totalSurcharges: number;
      totalFreightDiscount: number;
      surcharges: Array<{
        type: string;
        description: string;
        amount: number;
      }>;
    };
  }>;
  commit?: {
    commodityName: string;
    dateDetail?: {
      dayOfWeek: string;
      dayCxsFormat: string;
    };
  };
  operationalDetail?: {
    ursaPrefixCode: string;
    ursaSuffixCode: string;
    originLocationId: string;
    originLocationNumber: number;
    destinationLocationId: string;
    destinationLocationNumber: number;
    destinationServiceArea: string;
    deliveryDay: string;
    deliveryDate: string;
    deliveryTime: string;
    cutOffTime: string;
    originServiceArea: string;
    transitTime: string;
    packagingType: string;
    astraDescription: string;
  };
}

export interface FedExRateResponse {
  transactionId: string;
  customerTransactionId: string;
  output: {
    rateReplyDetails: FedExRateDetail[];
    quoteDate: string;
    encoded: boolean;
  };
}

// Service Availability Types
export interface FedExServiceAvailabilityRequest {
  requestedShipment: {
    shipDatestamp: string;
    shipTimeStamp?: string;
    pickupType?: 'DROPOFF_AT_FEDEX_LOCATION' | 'CONTACT_FEDEX_TO_SCHEDULE';
    serviceType?: string;
    packagingType?: string;
    shipper: FedExParty;
    recipient: FedExParty;
    shippingChargesPayment?: {
      paymentType: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
      payor?: {
        responsibleParty: FedExParty;
      };
    };
    requestedPackageLineItems: Array<{
      sequenceNumber: number;
      weight: FedExWeight;
      dimensions?: FedExDimensions;
    }>;
  };
  carrierCodes?: Array<'FDXE' | 'FDXG'>;
}

export interface FedExServiceAvailabilityResponse {
  transactionId: string;
  output: {
    options: Array<{
      serviceType: string;
      serviceName: string;
      packagingType: string;
      commit?: {
        dateDetail: {
          dayOfWeek: string;
          dayCxsFormat: string;
        };
        commodityName: string;
      };
      operationalDetail: {
        originLocationId: string;
        commitDays: Array<string>;
        serviceCode: string;
        astraDescription: string;
        airportId: string;
        scac: string;
      };
    }>;
  };
}

// Shipment/Label Creation Types
export interface FedExShipmentRequest {
  labelResponseOptions: 'LABEL' | 'URL_ONLY';
  requestedShipment: {
    shipper: FedExParty;
    recipients: FedExParty[];
    shipDatestamp: string;
    serviceType: string;
    packagingType: string;
    pickupType?: 'DROPOFF_AT_FEDEX_LOCATION' | 'CONTACT_FEDEX_TO_SCHEDULE';
    blockInsightVisibility?: boolean;
    shippingChargesPayment: {
      paymentType: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
      payor?: {
        responsibleParty: FedExParty;
      };
    };
    labelSpecification: {
      imageType: 'PDF' | 'PNG' | 'EPL2' | 'ZPLII';
      labelStockType: 'PAPER_4X6' | 'PAPER_4X8' | 'PAPER_4X9' | 'PAPER_LETTER';
      labelPrintingOrientation?: 'TOP_EDGE_OF_TEXT_FIRST' | 'BOTTOM_EDGE_OF_TEXT_FIRST';
      labelOrder?: 'SHIPPING_LABEL_FIRST' | 'SHIPPING_LABEL_LAST';
    };
    requestedPackageLineItems: Array<{
      sequenceNumber: number;
      weight: FedExWeight;
      dimensions?: FedExDimensions;
      declaredValue?: {
        currency: string;
        amount: number;
      };
      customerReferences?: Array<{
        customerReferenceType: 'CUSTOMER_REFERENCE' | 'INVOICE_NUMBER' | 'P_O_NUMBER';
        value: string;
      }>;
    }>;
  };
  accountNumber: {
    value: string;
  };
}

export interface FedExShipmentResponse {
  transactionId: string;
  customerTransactionId: string;
  output: {
    transactionShipments: Array<{
      serviceType: string;
      shipDatestamp: string;
      serviceCategory: string;
      serviceName: string;
      masterTrackingNumber: string;
      completedPackageDetails: Array<{
        sequenceNumber: number;
        trackingNumber: string;
        groupNumber: number;
        packageDocuments: Array<{
          contentKey: string;
          copiesToPrint: number;
          contentType: string;
          shippingDocumentDisposition: string;
          imageType: string;
          resolution: number;
          encodedLabel: string; // Base64 encoded label
        }>;
        operationalDetail?: {
          ursaPrefixCode: string;
          ursaSuffixCode: string;
          originLocationId: string;
          originServiceArea: string;
          destinationLocationId: string;
          destinationServiceArea: string;
          deliveryDay: string;
          deliveryDate: string;
          commitDay: string;
          commitDate: string;
          transitTime: string;
          astraDescription: string;
          deliveryEligibilities: Array<string>;
        };
      }>;
    }>;
  };
}

// Common Service Types
export type FedExServiceType = 
  | 'FEDEX_GROUND' 
  | 'GROUND_HOME_DELIVERY'
  | 'FEDEX_EXPRESS_SAVER'
  | 'FEDEX_2_DAY'
  | 'FEDEX_2_DAY_AM' 
  | 'STANDARD_OVERNIGHT'
  | 'PRIORITY_OVERNIGHT'
  | 'FIRST_OVERNIGHT';

export type FedExPackagingType =
  | 'FEDEX_ENVELOPE'
  | 'FEDEX_BOX'  
  | 'FEDEX_SMALL_BOX'
  | 'FEDEX_MEDIUM_BOX'
  | 'FEDEX_LARGE_BOX'
  | 'FEDEX_EXTRA_LARGE_BOX'
  | 'YOUR_PACKAGING';

// Utility Types for Service Responses
export interface FedExServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string;
  correlationId: string;
}

export interface FedExRateQuote {
  serviceType: FedExServiceType;
  serviceName: string;
  packagingType: FedExPackagingType;
  totalCharge: number;
  baseCharge: number;
  currency: string;
  transitDays?: number;
  deliveryDate?: string;
  deliveryDay?: string;
  surcharges: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
}

export interface FedExServiceOption {
  serviceType: FedExServiceType;
  serviceName: string;
  packagingType: FedExPackagingType;
  deliveryDate?: string;
  deliveryDay?: string;
  transitDays?: number;
}

export interface FedExLabelResult {
  trackingNumber: string;
  labelUrl?: string;
  labelBase64?: string;
  serviceType: FedExServiceType;
  deliveryDate?: string;
  totalCharge?: number;
  currency?: string;
}

// Error handling
export interface FedExServiceError {
  code: string;
  message: string;
  field?: string;
  source: 'OAUTH' | 'RATES' | 'AVAILABILITY' | 'SHIP';
}
