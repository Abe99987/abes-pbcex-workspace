import React, { ReactNode } from 'react';
import { useRequireAdmin } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, isLoading } = useRequireAdmin();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // useRequireAdmin will handle redirect
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'User Management', icon: '👥' },
    { href: '/admin/health', label: 'System Health', icon: '🏥' },
    { href: '/admin/audit', label: 'Audit Log', icon: '📝' },
    { href: '/admin/governance', label: 'Governance', icon: '⚖️' },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                PBCEx Admin Terminal
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-600'>
                {user?.firstName} {user?.lastName}
              </span>
              <Link
                href='/dashboard'
                className='text-sm text-blue-600 hover:text-blue-800'
              >
                Back to Main
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* Left Sidebar */}
        <aside className='w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen'>
          <nav className='mt-8'>
            <ul className='space-y-2'>
              {navItems.map(item => {
                const isActive = router.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className='mr-3'>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-8'>
          <div className='max-w-7xl mx-auto'>{children}</div>
        </main>
      </div>
    </div>
  );
}
