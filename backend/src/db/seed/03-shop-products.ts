/**
 * Development Shop Products Seeder
 * 
 * Creates sample products for all metals (AU, AG, PT, PD, CU) in the shop.
 */

export const shopProductsSeedData = [
  {
    table: 'shop_products',
    data: [
      // Gold (AU) Products
      {
        id: 'prod_au_bar_1oz',
        sku: 'AU-BAR-1OZ-GENERIC',
        name: '1 oz Gold Bar',
        metal: 'AU',
        category: 'BARS',
        subcategory: 'GENERIC',
        weight: '1.000000',
        weight_unit: 'oz',
        purity: '0.9999',
        dimensions: '50.0x28.6x2.5mm',
        description: 'Generic 1 oz gold bar, .9999 fine gold',
        manufacturer: 'Generic',
        price_premium_bps: 300, // 3% premium over spot
        available: true,
        inventory_count: 100,
        images: JSON.stringify(['/images/products/gold-bar-1oz.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod_au_coin_eagle',
        sku: 'AU-COIN-EAGLE-1OZ',
        name: 'American Gold Eagle 1 oz',
        metal: 'AU',
        category: 'COINS',
        subcategory: 'GOVERNMENT',
        weight: '1.000000',
        weight_unit: 'oz',
        purity: '0.9167',
        dimensions: '32.7mm diameter x 2.87mm thick',
        description: 'Official US Mint American Gold Eagle coin',
        manufacturer: 'US Mint',
        price_premium_bps: 500, // 5% premium
        available: true,
        inventory_count: 50,
        images: JSON.stringify(['/images/products/gold-eagle.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      // Silver (AG) Products
      {
        id: 'prod_ag_bar_10oz',
        sku: 'AG-BAR-10OZ-GENERIC',
        name: '10 oz Silver Bar',
        metal: 'AG',
        category: 'BARS',
        subcategory: 'GENERIC',
        weight: '10.000000',
        weight_unit: 'oz',
        purity: '0.999',
        dimensions: '127.0x63.5x9.5mm',
        description: 'Generic 10 oz silver bar, .999 fine silver',
        manufacturer: 'Generic',
        price_premium_bps: 400, // 4% premium
        available: true,
        inventory_count: 200,
        images: JSON.stringify(['/images/products/silver-bar-10oz.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod_ag_coin_eagle',
        sku: 'AG-COIN-EAGLE-1OZ',
        name: 'American Silver Eagle 1 oz',
        metal: 'AG',
        category: 'COINS',
        subcategory: 'GOVERNMENT',
        weight: '1.000000',
        weight_unit: 'oz',
        purity: '0.999',
        dimensions: '40.6mm diameter x 2.98mm thick',
        description: 'Official US Mint American Silver Eagle coin',
        manufacturer: 'US Mint',
        price_premium_bps: 600, // 6% premium
        available: true,
        inventory_count: 500,
        images: JSON.stringify(['/images/products/silver-eagle.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      // Platinum (PT) Products
      {
        id: 'prod_pt_bar_1oz',
        sku: 'PT-BAR-1OZ-PAMP',
        name: '1 oz Platinum Bar - PAMP Suisse',
        metal: 'PT',
        category: 'BARS',
        subcategory: 'BRANDED',
        weight: '1.000000',
        weight_unit: 'oz',
        purity: '0.9995',
        dimensions: '40.0x24.0x2.5mm',
        description: 'PAMP Suisse 1 oz platinum bar with assay card',
        manufacturer: 'PAMP Suisse',
        price_premium_bps: 700, // 7% premium
        available: true,
        inventory_count: 25,
        images: JSON.stringify(['/images/products/platinum-bar-pamp.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      // Palladium (PD) Products  
      {
        id: 'prod_pd_bar_1oz',
        sku: 'PD-BAR-1OZ-GENERIC',
        name: '1 oz Palladium Bar',
        metal: 'PD',
        category: 'BARS',
        subcategory: 'GENERIC',
        weight: '1.000000',
        weight_unit: 'oz',
        purity: '0.9995',
        dimensions: '40.0x24.0x2.5mm',
        description: 'Generic 1 oz palladium bar, .9995 fine palladium',
        manufacturer: 'Generic',
        price_premium_bps: 800, // 8% premium
        available: true,
        inventory_count: 15,
        images: JSON.stringify(['/images/products/palladium-bar.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      // Copper (CU) Products
      {
        id: 'prod_cu_bar_5lb',
        sku: 'CU-BAR-5LB-GENERIC',
        name: '5 lb Copper Bar',
        metal: 'CU',
        category: 'BARS',
        subcategory: 'GENERIC',
        weight: '5.000000',
        weight_unit: 'lb',
        purity: '0.999',
        dimensions: '152.4x76.2x25.4mm',
        description: 'Generic 5 pound copper bar, .999 fine copper',
        manufacturer: 'Generic',
        price_premium_bps: 1500, // 15% premium (higher for base metals)
        available: true,
        inventory_count: 100,
        images: JSON.stringify(['/images/products/copper-bar-5lb.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod_cu_round_1oz',
        sku: 'CU-ROUND-1OZ-GENERIC',
        name: '1 oz Copper Round',
        metal: 'CU',
        category: 'ROUNDS',
        subcategory: 'GENERIC',
        weight: '1.000000',
        weight_unit: 'oz',
        purity: '0.999',
        dimensions: '39mm diameter x 3mm thick',
        description: 'Generic 1 oz copper round, .999 fine copper',
        manufacturer: 'Generic',
        price_premium_bps: 2000, // 20% premium
        available: true,
        inventory_count: 1000,
        images: JSON.stringify(['/images/products/copper-round.jpg']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
  }
];
