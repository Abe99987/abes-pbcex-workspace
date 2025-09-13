import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRequireAdmin } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useRequireAdmin();

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Welcome Header */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Welcome to Admin Terminal
          </h2>
          <p className='text-gray-600'>
            Manage users, monitor system health, and oversee platform
            operations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <span className='text-2xl'>👥</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Total Users</p>
                <p className='text-2xl font-semibold text-gray-900'>-</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <span className='text-2xl'>✅</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Active Users
                </p>
                <p className='text-2xl font-semibold text-gray-900'>-</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 rounded-lg'>
                <span className='text-2xl'>⚠️</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Pending KYC</p>
                <p className='text-2xl font-semibold text-gray-900'>-</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <span className='text-2xl'>📊</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  System Status
                </p>
                <p className='text-2xl font-semibold text-green-600'>Healthy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className='bg-white rounded-lg shadow'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Recent Activity
            </h3>
          </div>
          <div className='p-6'>
            <div className='text-center text-gray-500 py-8'>
              <span className='text-4xl'>📝</span>
              <p className='mt-2'>No recent activity to display</p>
              <p className='text-sm'>
                Activity will appear here as users interact with the platform
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-lg shadow'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>Quick Actions</h3>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <button className='flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
                <span className='mr-2'>👥</span>
                View All Users
              </button>
              <button className='flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'>
                <span className='mr-2'>🏥</span>
                Check System Health
              </button>
              <button className='flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'>
                <span className='mr-2'>📝</span>
                View Audit Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
