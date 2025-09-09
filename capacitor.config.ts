import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000';

const config: CapacitorConfig = {
  appId: 'com.pbcex.app',
  appName: 'PBCEx',
  webDir: 'dist',
  server: {
    url: serverUrl,
    cleartext: true,
  },
};

export default config;


