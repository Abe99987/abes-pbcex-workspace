export interface AssetFormat {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  icon: string;
}

export interface AssetConfig {
  unit: string;
  formats: AssetFormat[];
}

export const ASSET_FORMATS: Record<string, AssetConfig> = {
  XAU: {
    unit: 'grams',
    formats: [
      {
        id: 'bar',
        name: 'Gold Bar',
        description:
          'Pure 24k gold bars in standard weights. Lower premium (closer to spot).',
        minAmount: 1.0,
        icon: '🥇',
      },
      {
        id: 'coins',
        name: 'Gold Coins',
        description:
          'American Eagle or Maple Leaf coins. Higher premium (collectability & mint costs).',
        minAmount: 0.1,
        icon: '🪙',
      },
      {
        id: 'goldback',
        name: 'Goldbacks',
        description: 'Gold-layered currency notes for small transactions.',
        minAmount: 0.05,
        icon: '💵',
      },
    ],
  },
  XAG: {
    unit: 'grams',
    formats: [
      {
        id: 'bar',
        name: 'Silver Bar',
        description: 'Pure .999 silver bars. Lower premium (closer to spot).',
        minAmount: 10.0,
        icon: '🥈',
      },
      {
        id: 'coins',
        name: 'Silver Coins',
        description:
          'American Eagle or Maple Leaf coins. Higher premium (collectability & mint costs).',
        minAmount: 1.0,
        icon: '🪙',
      },
      {
        id: 'rounds',
        name: 'Silver Rounds',
        description: 'Generic silver rounds with lower premiums.',
        minAmount: 1.0,
        icon: '⚪',
      },
    ],
  },
  XPT: {
    unit: 'grams',
    formats: [
      {
        id: 'bar',
        name: 'Platinum Bar',
        description:
          'Pure .9995 platinum bars. Lower premium (closer to spot).',
        minAmount: 1.0,
        icon: '⚪',
      },
      {
        id: 'coins',
        name: 'Platinum Coins',
        description:
          'American Eagle platinum coins. Higher premium (collectability & mint costs).',
        minAmount: 0.1,
        icon: '🪙',
      },
    ],
  },
  XPD: {
    unit: 'grams',
    formats: [
      {
        id: 'bar',
        name: 'Palladium Bar',
        description:
          'Pure .9995 palladium bars. Lower premium (closer to spot).',
        minAmount: 1.0,
        icon: '⚫',
      },
      {
        id: 'coins',
        name: 'Palladium Coins',
        description:
          'Canadian Maple Leaf palladium coins. Higher premium (collectability & mint costs).',
        minAmount: 0.1,
        icon: '🪙',
      },
    ],
  },
  XCU: {
    unit: 'tons',
    formats: [
      {
        id: 'ingots',
        name: 'Ingots',
        description: 'High-grade copper ingots for industrial use.',
        minAmount: 1.0,
        icon: '🟤',
      },
      {
        id: 'cathodes',
        name: 'Cathodes',
        description: 'Pure copper cathodes meeting LME standards.',
        minAmount: 1.0,
        icon: '🔶',
      },
      {
        id: 'coils',
        name: 'Coils',
        description: 'Copper wire coils for electrical applications.',
        minAmount: 1.0,
        icon: '🔄',
      },
    ],
  },
  OIL: {
    unit: 'barrels',
    formats: [
      {
        id: 'delivery',
        name: 'Physical Delivery',
        description: 'Bulk industrial delivery (licensing required).',
        minAmount: 500000,
        icon: '🚛',
      },
    ],
  },
};
