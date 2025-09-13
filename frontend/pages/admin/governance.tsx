import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRequireAdmin } from '@/hooks/useAuth';
import { apiClient } from '@/utils/api';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: string;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  conditions: Record<string, any>;
  resources: string[];
  actions: string[];
  roles: string[];
}

export default function Governance() {
  const { user: adminUser } = useRequireAdmin();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'roles' | 'permissions' | 'policies'
  >('roles');

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual admin governance endpoints
      // For now, use mock data

      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'SUPER_ADMIN',
          description: 'Full system access with all permissions',
          permissions: [],
          userCount: 1,
          createdAt: '2025-01-01T00:00:00Z',
          isSystem: true,
        },
        {
          id: '2',
          name: 'ADMIN',
          description:
            'Administrative access to manage users and system settings',
          permissions: [],
          userCount: 3,
          createdAt: '2025-01-01T00:00:00Z',
          isSystem: true,
        },
        {
          id: '3',
          name: 'MODERATOR',
          description: 'Moderate user content and handle support requests',
          permissions: [],
          userCount: 5,
          createdAt: '2025-01-02T00:00:00Z',
          isSystem: false,
        },
        {
          id: '4',
          name: 'USER',
          description: 'Standard user with basic trading and wallet access',
          permissions: [],
          userCount: 150,
          createdAt: '2025-01-01T00:00:00Z',
          isSystem: true,
        },
      ];

      const mockPermissions: Permission[] = [
        {
          id: '1',
          name: 'USER_READ',
          description: 'Read user information',
          resource: 'user',
          action: 'read',
          category: 'User Management',
        },
        {
          id: '2',
          name: 'USER_WRITE',
          description: 'Create, update, and delete users',
          resource: 'user',
          action: 'write',
          category: 'User Management',
        },
        {
          id: '3',
          name: 'SYSTEM_READ',
          description: 'Read system configuration and health',
          resource: 'system',
          action: 'read',
          category: 'System Management',
        },
        {
          id: '4',
          name: 'SYSTEM_WRITE',
          description: 'Modify system configuration',
          resource: 'system',
          action: 'write',
          category: 'System Management',
        },
        {
          id: '5',
          name: 'AUDIT_READ',
          description: 'Read audit logs',
          resource: 'audit',
          action: 'read',
          category: 'Audit & Compliance',
        },
        {
          id: '6',
          name: 'TRADE_READ',
          description: 'Read trading data and history',
          resource: 'trade',
          action: 'read',
          category: 'Trading',
        },
        {
          id: '7',
          name: 'TRADE_WRITE',
          description: 'Place and manage trades',
          resource: 'trade',
          action: 'write',
          category: 'Trading',
        },
        {
          id: '8',
          name: 'WALLET_READ',
          description: 'Read wallet balances and transactions',
          resource: 'wallet',
          action: 'read',
          category: 'Wallet',
        },
        {
          id: '9',
          name: 'WALLET_WRITE',
          description: 'Perform wallet operations',
          resource: 'wallet',
          action: 'write',
          category: 'Wallet',
        },
      ];

      const mockPolicies: Policy[] = [
        {
          id: '1',
          name: 'Admin Full Access',
          description: 'Super admins have access to everything',
          effect: 'ALLOW',
          conditions: {},
          resources: ['*'],
          actions: ['*'],
          roles: ['SUPER_ADMIN'],
        },
        {
          id: '2',
          name: 'User Self Management',
          description: 'Users can manage their own profile',
          effect: 'ALLOW',
          conditions: { userId: '${user.id}' },
          resources: ['user'],
          actions: ['read', 'update'],
          roles: ['USER', 'ADMIN', 'MODERATOR'],
        },
        {
          id: '3',
          name: 'Trading Access',
          description: 'Users can access trading features',
          effect: 'ALLOW',
          conditions: { kycStatus: 'APPROVED' },
          resources: ['trade', 'wallet'],
          actions: ['read', 'write'],
          roles: ['USER', 'ADMIN', 'MODERATOR'],
        },
        {
          id: '4',
          name: 'Audit Log Access',
          description: 'Admins can view audit logs',
          effect: 'ALLOW',
          conditions: {},
          resources: ['audit'],
          actions: ['read'],
          roles: ['ADMIN', 'SUPER_ADMIN'],
        },
      ];

      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setPolicies(mockPolicies);
    } catch (error) {
      console.error('Failed to fetch governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionCount = (roleName: string) => {
    // Mock permission mapping - in real app this would come from the backend
    const permissionMap: Record<string, string[]> = {
      SUPER_ADMIN: [
        'USER_READ',
        'USER_WRITE',
        'SYSTEM_READ',
        'SYSTEM_WRITE',
        'AUDIT_READ',
        'TRADE_READ',
        'TRADE_WRITE',
        'WALLET_READ',
        'WALLET_WRITE',
      ],
      ADMIN: [
        'USER_READ',
        'USER_WRITE',
        'SYSTEM_READ',
        'AUDIT_READ',
        'TRADE_READ',
        'WALLET_READ',
      ],
      MODERATOR: ['USER_READ', 'TRADE_READ', 'WALLET_READ'],
      USER: ['TRADE_READ', 'TRADE_WRITE', 'WALLET_READ', 'WALLET_WRITE'],
    };
    return permissionMap[roleName]?.length || 0;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'User Management':
        return 'bg-blue-100 text-blue-800';
      case 'System Management':
        return 'bg-green-100 text-green-800';
      case 'Audit & Compliance':
        return 'bg-purple-100 text-purple-800';
      case 'Trading':
        return 'bg-yellow-100 text-yellow-800';
      case 'Wallet':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
          <h1 className='text-2xl font-bold text-gray-900'>
            Governance & Access Control
          </h1>
          <div className='flex space-x-3'>
            <button
              onClick={fetchGovernanceData}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { id: 'roles', label: 'Roles', count: roles.length },
              {
                id: 'permissions',
                label: 'Permissions',
                count: permissions.length,
              },
              { id: 'policies', label: 'Policies', count: policies.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className='ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium'>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900'>
                System Roles
              </h3>
              <p className='text-sm text-gray-600 mt-1'>
                Roles define sets of permissions that can be assigned to users
              </p>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Role
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Description
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Permissions
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Users
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {roles.map(role => (
                    <tr key={role.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='text-sm font-medium text-gray-900'>
                            {role.name}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900 max-w-xs'>
                          {role.description}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          {getPermissionCount(role.name)} permissions
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {role.userCount}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            role.isSystem
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {role.isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900'>
                System Permissions
              </h3>
              <p className='text-sm text-gray-600 mt-1'>
                Permissions define what actions can be performed on specific
                resources
              </p>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Permission
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Description
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Resource
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Action
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {permissions.map(permission => (
                    <tr key={permission.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {permission.name}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900 max-w-xs'>
                          {permission.description}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {permission.resource}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {permission.action}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(permission.category)}`}
                        >
                          {permission.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900'>
                Access Policies
              </h3>
              <p className='text-sm text-gray-600 mt-1'>
                Policies define access rules that combine roles, resources, and
                conditions
              </p>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Policy
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Description
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Effect
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Resources
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Roles
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {policies.map(policy => (
                    <tr key={policy.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {policy.name}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900 max-w-xs'>
                          {policy.description}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            policy.effect === 'ALLOW'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {policy.effect}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {policy.resources.map((resource, index) => (
                            <span
                              key={index}
                              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {policy.roles.map((role, index) => (
                            <span
                              key={index}
                              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <span className='text-blue-400'>ℹ️</span>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-blue-800'>
                Read-Only View
              </h3>
              <div className='mt-2 text-sm text-blue-700'>
                <p>
                  This is a read-only view of the current governance
                  configuration. To modify roles, permissions, or policies,
                  please use the admin API endpoints or contact a system
                  administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
