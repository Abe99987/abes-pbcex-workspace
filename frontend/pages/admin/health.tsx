import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRequireAdmin } from '@/hooks/useAuth';
import { apiClient } from '@/utils/api';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  services: {
    priceFeed: {
      status: string;
      cachedPrices: number;
      subscribers: number;
      lastUpdate: string;
      uptime: number;
    };
    notifications: {
      email: {
        status: string;
        provider: string;
      };
      sms: {
        status: string;
        provider: string;
      };
      support: {
        status: string;
        provider: string;
      };
    };
    database: {
      status: string;
    };
    redis: {
      status: string;
      details?: string;
    };
  };
  integrations: {
    phase: number;
    configured: string[];
    total: number;
    readyPercentage: number;
    placeholdersEnabled: boolean;
  };
}

export default function SystemHealth() {
  const { user: adminUser } = useRequireAdmin();
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/health');
      if (response.status === 200) {
        setHealthData(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
      case 'error':
      case 'disconnected':
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'connected':
        return '✅';
      case 'degraded':
      case 'warning':
        return '⚠️';
      case 'unhealthy':
      case 'error':
      case 'disconnected':
      case 'disabled':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !healthData) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-gray-900'>System Health</h1>
          <div className='flex items-center space-x-4'>
            {lastUpdated && (
              <span className='text-sm text-gray-500'>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchHealthData}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Refresh
            </button>
          </div>
        </div>

        {healthData && (
          <>
            {/* Overall Status */}
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    System Overview
                  </h2>
                  <p className='text-gray-600'>
                    Version {healthData.version} • {healthData.environment} •
                    Uptime: {formatUptime(healthData.uptime)}
                  </p>
                </div>
                <div className='text-right'>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}
                  >
                    <span className='mr-2'>
                      {getStatusIcon(healthData.status)}
                    </span>
                    {healthData.status.toUpperCase()}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {new Date(healthData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Core Services */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {/* Price Feed */}
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Price Feed
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.priceFeed.status)}`}
                  >
                    {getStatusIcon(healthData.services.priceFeed.status)}
                  </span>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span className='font-medium'>
                      {healthData.services.priceFeed.status}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Cached Prices:</span>
                    <span className='font-medium'>
                      {healthData.services.priceFeed.cachedPrices}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Subscribers:</span>
                    <span className='font-medium'>
                      {healthData.services.priceFeed.subscribers}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Last Update:</span>
                    <span className='font-medium'>
                      {new Date(
                        healthData.services.priceFeed.lastUpdate
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database */}
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Database
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.database.status)}`}
                  >
                    {getStatusIcon(healthData.services.database.status)}
                  </span>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span className='font-medium'>
                      {healthData.services.database.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Redis */}
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>Redis</h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.redis.status)}`}
                  >
                    {getStatusIcon(healthData.services.redis.status)}
                  </span>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span className='font-medium'>
                      {healthData.services.redis.status}
                    </span>
                  </div>
                  {healthData.services.redis.details && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Details:</span>
                      <span className='font-medium'>
                        {healthData.services.redis.details}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Notifications
                  </h3>
                </div>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Email:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.notifications.email.status)}`}
                    >
                      {getStatusIcon(
                        healthData.services.notifications.email.status
                      )}{' '}
                      {healthData.services.notifications.email.provider}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>SMS:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.notifications.sms.status)}`}
                    >
                      {getStatusIcon(
                        healthData.services.notifications.sms.status
                      )}{' '}
                      {healthData.services.notifications.sms.provider}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Support:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.notifications.support.status)}`}
                    >
                      {getStatusIcon(
                        healthData.services.notifications.support.status
                      )}{' '}
                      {healthData.services.notifications.support.provider}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Memory Usage
                  </h3>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>RSS:</span>
                    <span className='font-medium'>
                      {formatBytes(healthData.memory.rss)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Heap Total:</span>
                    <span className='font-medium'>
                      {formatBytes(healthData.memory.heapTotal)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Heap Used:</span>
                    <span className='font-medium'>
                      {formatBytes(healthData.memory.heapUsed)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>External:</span>
                    <span className='font-medium'>
                      {formatBytes(healthData.memory.external)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Integrations */}
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Integrations
                  </h3>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Phase:</span>
                    <span className='font-medium'>
                      {healthData.integrations.phase}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Ready:</span>
                    <span className='font-medium'>
                      {healthData.integrations.readyPercentage}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Configured:</span>
                    <span className='font-medium'>
                      {healthData.integrations.configured.length}/
                      {healthData.integrations.total}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Placeholders:</span>
                    <span className='font-medium'>
                      {healthData.integrations.placeholdersEnabled
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
