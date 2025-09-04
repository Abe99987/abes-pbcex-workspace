export interface CommodityMeta {
  // Core Identity
  displayName: string;
  symbol: string;
  category: 'Precious metal' | 'Base metal' | 'Energy' | 'Other';
  commonUnits: string[];
  purityGrades: string[];
  availableForms: string[];
  minOrder: { value: number; unit: string };
  minBulkOrder: { value: number; unit: string };
  lotSizeIncrements: { value: number; unit: string };

  // Market Data
  referencePriceFeed: { vendor: string; code: string };
  volatilityClass: 'Stable' | 'Normal' | 'Volatile';
  quoteCurrency: string;
  basisNotes?: string;

  // Fulfillment & Logistics
  deliverySLA: { domestic: string; international: string };
  carriers: string[];
  vaultsOrWarehouses: Array<{
    name: string;
    city: string;
    country: string;
    type: string;
  }>;
  custodyModel: string;
  assayPolicy: string;
  redemption: string;
  exportRestrictions: string[];

  // Pricing & Fees
  makerFee: number;
  takerFee: number;
  physicalSpread: { buyBps: number; sellBps: number };
  storageFees?: { pctPerYear: number };
  shippingOptions: string[];
  insuranceIncluded: boolean;

  // Settlement & Orders
  acceptedTender: string[];
  supportedOrderTypes: string[];
  barterRules: { allow: boolean; note: string };
  priceLockWindowMins: number;

  // Risk & Hedging
  hedgeMethod: string[];
  hedgeLatencyTarget: string;
  providerCoMM: boolean;
  inventoryPolicy: string;

  // Compliance
  conformityStandards: string[];
  auditFrequency: string;
  auditorName: string;
  chainOfCustodyDocs: Array<{ title: string; url: string; type: string }>;
  disclosures: string[];
  documents: Array<{ title: string; url: string; type: string }>;
}

export type CommoditySymbol = 'XAU' | 'XAG' | 'XPT' | 'XPD' | 'XCU';
