import { useState, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, getUserDisplayName } from '@/hooks/useAuth';
import {
  ChevronDown,
  User,
  Wallet,
  BarChart3,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
  LogOut,
  LineChart,
} from 'lucide-react';
import { TickerTape } from '@/components/tradingview';

interface NavItem {
  name: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  description?: string;
}

const walletItems: NavItem[] = [
  {
    name: 'My Assets',
    href: '/wallet/assets',
    icon: Wallet,
    description: 'View and manage your portfolio',
  },
  {
    name: 'My Spending',
    href: '/wallet/spending',
    icon: DollarSign,
    description: 'Track spending and budgets',
  },
  {
    name: 'Transaction History',
    href: '/wallet/transactions',
    icon: FileText,
    description: 'View all deposits and withdrawals',
  },
  {
    name: 'Order History',
    href: '/wallet/orders',
    icon: Clock,
    description: 'Track your trading activity',
  },
  {
    name: 'PnL',
    href: '/wallet/pnl',
    icon: TrendingUp,
    description: 'Profit & loss analytics',
  },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className='bg-white shadow-sm border-b border-gray-200'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 justify-between'>
          {/* Logo and main nav */}
          <div className='flex'>
            <div className='flex flex-shrink-0 items-center'>
              <Link
                href='/dashboard'
                className='text-xl font-bold text-gray-900'
              >
                PBCEx
              </Link>
            </div>
            <div className='hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8'>
              <Link
                href='/dashboard'
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  router.pathname === '/dashboard'
                    ? 'border-b-2 border-blue-500 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </Link>

              {/* Markets Link */}
              <Link
                href='/markets'
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  router.pathname.startsWith('/markets')
                    ? 'border-b-2 border-blue-500 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LineChart className='mr-1 h-4 w-4' />
                Markets
              </Link>

              {/* Wallet Dropdown */}
              <div className='relative'>
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    router.pathname.startsWith('/wallet')
                      ? 'border-b-2 border-blue-500 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Wallet
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {walletDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-80 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {walletItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setWalletDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50'
                      >
                        <div className='flex items-start space-x-3'>
                          <item.icon className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <div className='font-medium text-gray-900'>
                              {item.name}
                            </div>
                            {item.description && (
                              <div className='text-gray-500 text-xs'>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className='hidden sm:ml-6 sm:flex sm:items-center'>
            <div className='relative'>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className='flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                <div className='flex items-center space-x-2 px-3 py-2'>
                  <User className='h-5 w-5 text-gray-400' />
                  <span className='text-sm font-medium text-gray-700'>
                    {getUserDisplayName(user)}
                  </span>
                  <ChevronDown className='h-4 w-4 text-gray-400' />
                </div>
              </button>
              {userDropdownOpen && (
                <div className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5'>
                  <Link
                    href='/account/profile'
                    onClick={() => setUserDropdownOpen(false)}
                    className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    Your Profile
                  </Link>
                  <Link
                    href='/account/settings'
                    onClick={() => setUserDropdownOpen(false)}
                    className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Tape Widget */}
      <div className='border-t border-gray-200 bg-gray-50'>
        <TickerTape displayMode='adaptive' className='h-16' />
      </div>
    </nav>
  );
}
