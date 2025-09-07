import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Minimal global setup: skipping UI user creation.');
}

export default globalSetup;


