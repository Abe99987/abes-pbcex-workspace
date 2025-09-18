/**
 * Preview Mode Utilities
 * Helpers to detect and handle preview/development environments
 */

export const isPreviewMode = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check various preview indicators
  return (
    window.location?.hostname === 'localhost' ||
    window.location?.hostname?.includes('preview') ||
    window.location?.hostname?.includes('lovable') ||
    process.env.NODE_ENV === 'development' ||
    process.env.PREVIEW_MODE === 'true'
  );
};

export const getPreviewConfig = async () => {
  if (!isPreviewMode()) return null;

  try {
    const response = await fetch('/preview-config.json');
    return await response.json();
  } catch (error) {
    console.warn('Preview config not available:', error);
    return {
      previewMode: true,
      features: {
        trading: false,
        payments: false,
        externalIntegrations: false,
        vaultRedemption: false,
      },
    };
  }
};

export const mockApiCall = <T>(
  mockData: T,
  delay: number = 500
): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockData), delay);
  });
};

export const withPreviewFallback = <T>(
  apiCall: () => Promise<T>,
  mockData: T
): Promise<T> => {
  if (isPreviewMode()) {
    return mockApiCall(mockData);
  }
  return apiCall();
};

/**
 * Safe environment variable access with fallbacks
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof process === 'undefined') return fallback;
  if (!process.env) return fallback;
  return process.env[key] || fallback;
};

/**
 * Guard for external service initialization
 */
export const withServiceGuard = <T>(
  serviceInitializer: () => T,
  mockService: T
): T => {
  if (isPreviewMode()) {
    console.log(`Preview mode: using mock service instead of real service`);
    return mockService;
  }

  try {
    return serviceInitializer();
  } catch (error) {
    console.warn('Service initialization failed, using mock:', error);
    return mockService;
  }
};
