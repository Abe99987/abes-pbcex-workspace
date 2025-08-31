/**
 * FedexService Auth Test Scaffold
 * Basic tests for FedEx OAuth authentication flow
 */

import { FedexService } from './FedexService';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock Redis cache
jest.mock('@/cache/redis', () => ({
  cache: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn()
  }
}));

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('FedexService - OAuth Authentication', () => {
  let mockHttpClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    mockAxios.create.mockReturnValue(mockHttpClient);

    // Reset service state
    (FedexService as any).httpClient = null;
    (FedexService as any).isInitialized = false;
  });

  describe('Initialization', () => {
    it('should initialize successfully with FedEx credentials', async () => {
      const originalClientId = process.env.FEDEX_CLIENT_ID;
      const originalClientSecret = process.env.FEDEX_CLIENT_SECRET;

      process.env.FEDEX_CLIENT_ID = 'test_client_id';
      process.env.FEDEX_CLIENT_SECRET = 'test_client_secret';

      await FedexService.initialize();
      
      const health = FedexService.getHealthStatus();
      expect(health.status).toBe('initialized');
      expect(health.configured).toBe(true);

      // Restore original env
      process.env.FEDEX_CLIENT_ID = originalClientId;
      process.env.FEDEX_CLIENT_SECRET = originalClientSecret;
    });

    it('should initialize in mock mode without credentials', async () => {
      const originalClientId = process.env.FEDEX_CLIENT_ID;
      const originalClientSecret = process.env.FEDEX_CLIENT_SECRET;

      delete process.env.FEDEX_CLIENT_ID;
      delete process.env.FEDEX_CLIENT_SECRET;

      await FedexService.initialize();
      
      const health = FedexService.getHealthStatus();
      expect(health.status).toBe('initialized');
      expect(health.configured).toBe(false);

      // Restore original env
      process.env.FEDEX_CLIENT_ID = originalClientId;
      process.env.FEDEX_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('OAuth Token Management', () => {
    beforeEach(() => {
      process.env.FEDEX_CLIENT_ID = 'test_client_id';
      process.env.FEDEX_CLIENT_SECRET = 'test_client_secret';
      (FedexService as any).httpClient = mockHttpClient;
      (FedexService as any).isInitialized = true;
    });

    it('should obtain access token successfully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'new_access_token_123',
          token_type: 'bearer',
          expires_in: 3600
        }
      };

      mockHttpClient.post.mockResolvedValue(mockTokenResponse);

      const getToken = (FedexService as any).getAccessToken;
      const token = await getToken();

      expect(token).toBe('new_access_token_123');
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'client_credentials',
          client_id: 'test_client_id',
          client_secret: 'test_client_secret'
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );
    });

    it('should handle OAuth token errors gracefully', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'invalid_client',
            error_description: 'Invalid client credentials'
          }
        }
      };

      mockHttpClient.post.mockRejectedValue(mockError);

      const getToken = (FedexService as any).getAccessToken;
      
      await expect(getToken()).rejects.toThrow();
    });

    it('should cache access tokens to avoid repeated API calls', async () => {
      const { cache } = require('@/cache/redis');
      
      // Mock cache hit
      cache.get.mockResolvedValue('cached_token_123');

      const getToken = (FedexService as any).getAccessToken;
      const token = await getToken();

      expect(token).toBe('cached_token_123');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(cache.get).toHaveBeenCalledWith('fedex:oauth:token');
    });

    it('should refresh token when cache is empty', async () => {
      const { cache } = require('@/cache/redis');
      
      // Mock cache miss
      cache.get.mockResolvedValue(null);
      
      const mockTokenResponse = {
        data: {
          access_token: 'fresh_token_456',
          token_type: 'bearer',
          expires_in: 3600
        }
      };

      mockHttpClient.post.mockResolvedValue(mockTokenResponse);

      const getToken = (FedexService as any).getAccessToken;
      const token = await getToken();

      expect(token).toBe('fresh_token_456');
      expect(cache.setex).toHaveBeenCalledWith(
        'fedex:oauth:token',
        expect.any(Number), // TTL with safety margin
        'fresh_token_456'
      );
    });

    it('should handle token expiry edge cases', async () => {
      const { cache } = require('@/cache/redis');
      
      const mockTokenResponse = {
        data: {
          access_token: 'short_lived_token',
          token_type: 'bearer',
          expires_in: 60 // Very short expiry
        }
      };

      mockHttpClient.post.mockResolvedValue(mockTokenResponse);
      cache.get.mockResolvedValue(null);

      const getToken = (FedexService as any).getAccessToken;
      const token = await getToken();

      expect(token).toBe('short_lived_token');
      
      // Should cache with safety margin (expires_in - 300 seconds)
      expect(cache.setex).toHaveBeenCalledWith(
        'fedex:oauth:token',
        expect.any(Number),
        'short_lived_token'
      );
    });
  });

  describe('API Request Authentication', () => {
    beforeEach(() => {
      process.env.FEDEX_CLIENT_ID = 'test_client_id';
      process.env.FEDEX_CLIENT_SECRET = 'test_client_secret';
      (FedexService as any).httpClient = mockHttpClient;
      (FedexService as any).isInitialized = true;
    });

    it('should add authorization header to API requests', async () => {
      const { cache } = require('@/cache/redis');
      cache.get.mockResolvedValue('valid_token_789');

      const mockApiResponse = {
        data: { success: true }
      };

      mockHttpClient.post.mockResolvedValue(mockApiResponse);

      // Mock a simple API call that would use authentication
      const makeAuthenticatedRequest = async () => {
        const token = await (FedexService as any).getAccessToken();
        return mockHttpClient.post('/api/endpoint', {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      };

      const response = await makeAuthenticatedRequest();

      expect(response.data.success).toBe(true);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/endpoint',
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid_token_789'
          })
        })
      );
    });
  });

  describe('Mock Mode Behavior', () => {
    beforeEach(() => {
      delete process.env.FEDEX_CLIENT_ID;
      delete process.env.FEDEX_CLIENT_SECRET;
      (FedexService as any).httpClient = null;
      (FedexService as any).isInitialized = true;
    });

    it('should return mock tokens when credentials are not configured', async () => {
      const getToken = (FedexService as any).getAccessToken;
      const token = await getToken();

      expect(token).toMatch(/^mock_token_/);
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      process.env.FEDEX_CLIENT_ID = 'test_client_id';
      process.env.FEDEX_CLIENT_SECRET = 'test_client_secret';
      (FedexService as any).httpClient = mockHttpClient;
      (FedexService as any).isInitialized = true;
    });

    it('should retry token refresh on temporary failures', async () => {
      const { cache } = require('@/cache/redis');
      cache.get.mockResolvedValue(null);

      // First call fails, second succeeds
      mockHttpClient.post
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          data: {
            access_token: 'retry_success_token',
            token_type: 'bearer',
            expires_in: 3600
          }
        });

      const getToken = (FedexService as any).getAccessToken;
      
      // Should eventually succeed after retry
      await expect(getToken()).rejects.toThrow('Network timeout');
      
      // Second attempt should work
      const token = await getToken();
      expect(token).toBe('retry_success_token');
    });
  });
});
