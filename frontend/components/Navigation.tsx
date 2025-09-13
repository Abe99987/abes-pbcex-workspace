import { useState } from 'react';
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
  CreditCard,
  ArrowLeftRight,
  Download,
  Upload,
  Landmark,
  QrCode,
  Calendar,
  Repeat,
  ShoppingCart,
  Shield,
  Settings,
} from 'lucide-react';
import { TickerTape } from '@/components/tradingview';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

// Buy Crypto dropdown
const buyCryptoItems: NavItem[] = [
  {
    name: 'Quick Buy (Placeholder)',
    href: '/markets/BINANCE:BTCUSDT',
    icon: CreditCard,
    description: 'Fiat → asset in one step',
  },
  {
    name: 'Quick Convert (Placeholder)',
    href: '/wallet/assets',
    icon: ArrowLeftRight,
    description: 'Swap between assets instantly',
  },
  {
    name: 'Buy with Card (Placeholder)',
    href: '/wallet/spending',
    icon: CreditCard,
    description: 'Visa/Mastercard checkout',
  },
  {
    name: 'Deposit Crypto (Placeholder)',
    href: '/wallet/assets',
    icon: Download,
    description: 'On-chain deposit addresses',
  },
];

// Trade dropdown
const tradeItems: NavItem[] = [
  {
    name: 'Spot (USD) (Placeholder)',
    href: '/markets',
    icon: LineChart,
    description: 'USD-quoted markets',
  },
  {
    name: 'Spot (USDC) (Placeholder)',
    href: '/markets',
    icon: LineChart,
    description: 'USDC-quoted markets',
  },
  {
    name: 'Coin-to-Coin (Placeholder)',
    href: '/markets/BINANCE:BTCUSDT',
    icon: ArrowLeftRight,
    description: 'BTC/ETH quote pairs',
  },
  {
    name: 'DCA (Placeholder)',
    href: '/wallet/assets',
    icon: Repeat,
    description: 'Automated recurring purchases',
  },
];

// Markets dropdown
const marketsItems: NavItem[] = [
  {
    name: 'Analytics',
    href: '/markets/analytics',
    icon: BarChart3,
    description: 'Overview & key metrics dashboard',
  },
  {
    name: 'Tutorials (Placeholder)',
    href: '/disclosures',
    icon: FileText,
    description: 'How-to guides',
  },
  {
    name: 'Education (Learn) (Placeholder)',
    href: '/legal',
    icon: FileText,
    description: 'Courses & long-form',
  },
];

// Shop dropdown (link metals to symbols)
const shopItems: NavItem[] = [
  {
    name: 'Shop All (Placeholder)',
    href: '/markets',
    icon: ShoppingCart,
    description: 'View all commodities',
  },
  {
    name: 'Buy Physical Gold',
    href: '/markets/OANDA:XAUUSD',
    icon: DollarSign,
    description: 'Gold',
  },
  {
    name: 'Buy Physical Silver',
    href: '/markets/OANDA:XAGUSD',
    icon: DollarSign,
    description: 'Silver',
  },
  {
    name: 'Buy Physical Platinum',
    href: '/markets/OANDA:XPTUSD',
    icon: DollarSign,
    description: 'Platinum',
  },
  {
    name: 'Buy Physical Palladium',
    href: '/markets/OANDA:XPDUSD',
    icon: DollarSign,
    description: 'Palladium',
  },
  {
    name: 'Buy Physical Copper',
    href: '/markets/COMEX:HG1!',
    icon: DollarSign,
    description: 'Copper',
  },
];

// Send / Receive dropdown
const transferItems: NavItem[] = [
  {
    name: 'Send to PBCEx User (Placeholder)',
    href: '/wallet/assets',
    icon: Upload,
    description: 'Free & instant transfers',
  },
  {
    name: 'Crypto Withdrawal (Placeholder)',
    href: '/wallet/transactions',
    icon: ArrowLeftRight,
    description: 'Send on-chain',
  },
  {
    name: 'Bank Transfers (SWIFT/WISE-ready) (Placeholder)',
    href: '/wallet/transactions',
    icon: Landmark,
    description: 'Domestic & international',
  },
  {
    name: 'Pay with QR Code (Placeholder)',
    href: '/wallet/spending',
    icon: QrCode,
    description: 'Merchant QR',
  },
  {
    name: 'Receive with QR Code (Placeholder)',
    href: '/wallet/spending',
    icon: QrCode,
    description: 'Your QR',
  },
  {
    name: 'Spend with Visa Card (Placeholder)',
    href: '/wallet/spending',
    icon: CreditCard,
    description: 'Use card',
  },
  {
    name: 'Set up Bill Pay (Placeholder)',
    href: '/wallet/spending',
    icon: Calendar,
    description: 'Schedule utilities & vendors',
  },
  {
    name: 'Request a Payment (Placeholder)',
    href: '/wallet/transactions',
    icon: FileText,
    description: 'Create invoice/QR',
  },
  {
    name: 'Set up Recurring Transfers (Placeholder)',
    href: '/wallet/transactions',
    icon: Repeat,
    description: 'Automate payouts & savings',
  },
];

// My Account (Wallet) dropdown
const walletItems: NavItem[] = [
  {
    name: 'Balances & Funding',
    href: '/wallet/assets',
    icon: Wallet,
    description: 'Balances, deposit, and funding options',
  },
  {
    name: 'Cards (Placeholder)',
    href: '/wallet/spending',
    icon: CreditCard,
    description: 'Manage cards and spending',
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
  {
    name: 'Connect Wallet (Placeholder)',
    href: '/wallet/assets',
    icon: ArrowLeftRight,
    description: 'Connect external wallet',
  },
  {
    name: 'Security (Placeholder)',
    href: '/legal/privacy',
    icon: Shield,
    description: '2FA and security settings',
  },
  {
    name: 'Settings & Profile (Placeholder)',
    href: '/dashboard',
    icon: Settings,
    description: 'Manage your profile and preferences',
  },
  {
    name: 'Support (Placeholder)',
    href: '/disclosures',
    icon: FileText,
    description: 'Help center and support',
  },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [buyDropdownOpen, setBuyDropdownOpen] = useState(false);
  const [tradeDropdownOpen, setTradeDropdownOpen] = useState(false);
  const [marketsDropdownOpen, setMarketsDropdownOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [transferDropdownOpen, setTransferDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };


  return (
    <nav className='bg-white shadow-sm border-b border-gray-200'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 justify-between'>
          {/* Logo and main nav */}
          <div className='flex'>
            <div className='flex flex-shrink-0 items-center'>
              <Link
                href={user ? '/dashboard' : '/'}
                className='text-xl font-bold text-gray-900'
              >
                PBCEx
              </Link>
            </div>
            <div className='hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8'>
              {/* Buy Crypto */}
              <div className='relative'>
                <button
                  onClick={() => setBuyDropdownOpen(!buyDropdownOpen)}
                  aria-expanded={buyDropdownOpen}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    buyDropdownOpen ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Buy Crypto
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {buyDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-96 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {buyCryptoItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setBuyDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
                      >
                        <div className='flex items-start space-x-3'>
                          <item.icon className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <div className='font-medium text-gray-900'>{item.name}</div>
                            {item.description && (
                              <div className='text-gray-500 text-xs'>{item.description}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Trade */}
              <div className='relative'>
                <button
                  onClick={() => setTradeDropdownOpen(!tradeDropdownOpen)}
                  aria-expanded={tradeDropdownOpen}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    router.pathname.startsWith('/markets') ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Trade
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {tradeDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-96 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {tradeItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setTradeDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
                      >
                        <div className='flex items-start space-x-3'>
                          <item.icon className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <div className='font-medium text-gray-900'>{item.name}</div>
                            {item.description && (
                              <div className='text-gray-500 text-xs'>{item.description}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Markets */}
              <div className='relative'>
                <button
                  onClick={() => setMarketsDropdownOpen(!marketsDropdownOpen)}
                  aria-expanded={marketsDropdownOpen}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    router.pathname.startsWith('/markets') ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LineChart className='mr-1 h-4 w-4' />
                  Markets
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {marketsDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-96 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {marketsItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMarketsDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
                      >
                        <div className='flex items-start space-x-3'>
                          <item.icon className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <div className='font-medium text-gray-900'>{item.name}</div>
                            {item.description && (
                              <div className='text-gray-500 text-xs'>{item.description}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Shop */}
              <div className='relative'>
                <button
                  onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                  aria-expanded={shopDropdownOpen}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    router.pathname.startsWith('/markets') ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Shop
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {shopDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-96 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {shopItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setShopDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
                      >
                        <div className='flex items-start space-x-3'>
                          <item.icon className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <div className='font-medium text-gray-900'>{item.name}</div>
                            {item.description && (
                              <div className='text-gray-500 text-xs'>{item.description}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Send / Receive */}
              <div className='relative'>
                <button
                  onClick={() => setTransferDropdownOpen(!transferDropdownOpen)}
                  aria-expanded={transferDropdownOpen}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    router.pathname.startsWith('/wallet') ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Send / Receive
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {transferDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-[28rem] origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {transferItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setTransferDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
                      >
                        <div className='flex items-start space-x-3'>
                          <item.icon className='h-5 w-5 text-gray-400 mt-0.5' />
                          <div>
                            <div className='font-medium text-gray-900'>{item.name}</div>
                            {item.description && (
                              <div className='text-gray-500 text-xs'>{item.description}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* My Account (Wallet) */}
              <div className='relative'>
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  aria-expanded={walletDropdownOpen}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    router.pathname.startsWith('/wallet')
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Account
                  <ChevronDown className='ml-1 h-4 w-4' />
                </button>
                {walletDropdownOpen && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-96 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5'>
                    {walletItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setWalletDropdownOpen(false)}
                        className='block px-4 py-3 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
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
            {user ? (
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
            ) : (
              <div className='flex items-center'>
                <Link href='/login' className='px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800'>Log in</Link>
              </div>
            )}
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
