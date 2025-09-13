import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRequireAdmin } from '@/hooks/useAuth';
import { apiClient } from '@/utils/api';

interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function AuditLog() {
  const { user: adminUser } = useRequireAdmin();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [filters, setFilters] = useState({
    actor: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });

  const pageSize = 20;

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual admin audit endpoint
      const response = await apiClient.get('/admin/audit', {
        params: {
          page: currentPage,
          limit: pageSize,
          actor: filters.actor || undefined,
          action: filters.action || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      });

      if (response.status === 200) {
        // For now, use mock data
        const mockData: AuditLogEntry[] = Array.from(
          { length: 20 },
          (_, i) => ({
            id: `audit-${currentPage}-${i + 1}`,
            actor: `user-${Math.floor(Math.random() * 100)}@example.com`,
            action:
              [
                'LOGIN',
                'LOGOUT',
                'PASSWORD_CHANGE',
                'KYC_SUBMIT',
                'TRADE_PLACE',
              ][Math.floor(Math.random() * 5)] || 'LOGIN',
            resource:
              ['auth', 'user', 'kyc', 'trade', 'wallet'][
                Math.floor(Math.random() * 5)
              ] || 'auth',
            details: 'User action performed',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            timestamp: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            metadata: {
              sessionId: `session-${Math.floor(Math.random() * 1000)}`,
              requestId: `req-${Math.floor(Math.random() * 10000)}`,
            },
          })
        );

        setAuditLogs(mockData);
        setTotalEntries(100); // Mock total
        setTotalPages(5);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      // Use mock data on error
      const mockData: AuditLogEntry[] = Array.from({ length: 20 }, (_, i) => ({
        id: `audit-${currentPage}-${i + 1}`,
        actor: `user-${Math.floor(Math.random() * 100)}@example.com`,
        action:
          ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'KYC_SUBMIT', 'TRADE_PLACE'][
            Math.floor(Math.random() * 5)
          ] || 'LOGIN',
        resource:
          ['auth', 'user', 'kyc', 'trade', 'wallet'][
            Math.floor(Math.random() * 5)
          ] || 'auth',
        details: 'User action performed',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        timestamp: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        metadata: {
          sessionId: `session-${Math.floor(Math.random() * 1000)}`,
          requestId: `req-${Math.floor(Math.random() * 10000)}`,
        },
      }));

      setAuditLogs(mockData);
      setTotalEntries(100);
      setTotalPages(5);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      actor: '',
      action: '',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-green-100 text-green-800';
      case 'LOGOUT':
        return 'bg-blue-100 text-blue-800';
      case 'PASSWORD_CHANGE':
        return 'bg-yellow-100 text-yellow-800';
      case 'KYC_SUBMIT':
        return 'bg-purple-100 text-purple-800';
      case 'TRADE_PLACE':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Audit Log</h1>
          <div className='flex space-x-3'>
            <button
              onClick={fetchAuditLogs}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Refresh
            </button>
            <button
              onClick={clearFilters}
              className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>Filters</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div>
              <label
                htmlFor='actor'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Actor
              </label>
              <input
                type='text'
                id='actor'
                placeholder='Filter by actor...'
                value={filters.actor}
                onChange={e => handleFilterChange('actor', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label
                htmlFor='action'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Action
              </label>
              <select
                id='action'
                value={filters.action}
                onChange={e => handleFilterChange('action', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>All Actions</option>
                <option value='LOGIN'>Login</option>
                <option value='LOGOUT'>Logout</option>
                <option value='PASSWORD_CHANGE'>Password Change</option>
                <option value='KYC_SUBMIT'>KYC Submit</option>
                <option value='TRADE_PLACE'>Trade Place</option>
              </select>
            </div>
            <div>
              <label
                htmlFor='dateFrom'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                From Date
              </label>
              <input
                type='date'
                id='dateFrom'
                value={filters.dateFrom}
                onChange={e => handleFilterChange('dateFrom', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label
                htmlFor='dateTo'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                To Date
              </label>
              <input
                type='date'
                id='dateTo'
                value={filters.dateTo}
                onChange={e => handleFilterChange('dateTo', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Audit Entries ({totalEntries})
            </h3>
          </div>

          {loading ? (
            <div className='p-6 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-2 text-gray-600'>Loading audit logs...</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Timestamp
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actor
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Action
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Resource
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        IP Address
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {auditLogs.map(entry => (
                      <tr key={entry.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatTimestamp(entry.timestamp)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {entry.actor}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(entry.action)}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {entry.resource}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {entry.ipAddress}
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-900'>
                          <div
                            className='max-w-xs truncate'
                            title={entry.details}
                          >
                            {entry.details}
                          </div>
                          {entry.metadata && (
                            <div className='text-xs text-gray-500 mt-1'>
                              Session: {entry.metadata.sessionId}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
                <div className='flex-1 flex justify-between sm:hidden'>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-gray-700'>
                      Showing page{' '}
                      <span className='font-medium'>{currentPage}</span> of{' '}
                      <span className='font-medium'>{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const page =
                            Math.max(
                              1,
                              Math.min(totalPages - 4, currentPage - 2)
                            ) + i;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
