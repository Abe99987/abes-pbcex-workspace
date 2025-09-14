import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DepositModal from '@/components/modals/DepositModal';
import WalletConnectModal from '@/components/modals/WalletConnectModal';
import AuthModal from '@/components/modals/AuthModal';
import {
  Menu,
  ChevronDown,
  User,
  Globe,
  Wallet,
  TrendingUp,
  Shield,
  HelpCircle,
  Send,
  Building2,
  BookOpen,
  BarChart3,
  Coins,
  CandlestickChart,
  History,
  TrendingDown,
  Receipt,
  Package,
  Settings,
  LogOut,
  CreditCard,
  Key,
  FileText,
  Bell,
  UserCheck,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ThemeToggle from './ThemeToggle';
import pbcexLogo from '@/assets/pbcex-logo.png';

interface MenuItem {
  label: string;
  icon?: React.ElementType;
  items?: (MenuItem | string)[];
  href?: string;
  onClick?: () => void;
  description?: string;
}

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [walletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  // Check auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if we're on trading page for theme adaptation
  const isTrading =
    location.pathname === '/trading' || location.pathname === '/coin-trading';

  // Get menu items - My Account is always visible
  const menuItems: MenuItem[] = [
    {
      label: 'Buy Crypto',
      icon: Coins,
      items: [
        {
          label: 'Quick Buy',
          href: '/buy',
          description: 'Fiat → asset in one step',
        },
        {
          label: 'Quick Convert',
          href: '/convert',
          description: 'Swap between assets instantly',
        },
        {
          label: 'Buy with Card',
          href: '/buy/card',
          description: 'Visa/Mastercard checkout',
        },
        {
          label: 'Deposit Crypto',
          href: '/deposit',
          description: 'On-chain deposit addresses',
        },
      ],
    },
    {
      label: 'Trade',
      icon: CandlestickChart,
      items: [
        {
          label: 'Spot (USD) (Placeholder)',
          href: '/trading',
          description: 'USD-quoted markets',
        },
        {
          label: 'Spot (USDC) — stablecoin trading (USDC/USDT)',
          href: '/trading/spot-usdc',
          description: 'USDC/USDT markets',
        },
        {
          label: 'Coin-to-Coin — settle in any coin',
          href: '/trading/coin',
          description: 'Direct crypto & metals trading',
        },
        {
          label: 'DCA — set up auto-buy',
          href: '/trading/dca',
          description: 'Automated recurring purchases',
        },
      ],
    },
    {
      label: 'Markets',
      icon: BarChart3,
      href: '/markets',
      items: [
        {
          label: 'Analytics',
          href: '/markets?tab=overview',
          description: 'Overview & key metrics dashboard',
        },
        {
          label: 'Tutorials',
          href: '/markets/tutorials',
          description: 'How-to guides',
        },
        {
          label: 'Education (Learn) (Placeholder)',
          href: '/education',
          description: 'Courses & long-form',
        },
      ],
    },
    {
      label: 'Shop',
      icon: Package,
      items: [
        {
          label: 'Shop All (Placeholder)',
          href: '/shop',
          description: 'View all commodities',
        },
        {
          label: 'Buy Physical Gold',
          href: '/shop/gold',
          description: 'Gold',
        },
        {
          label: 'Buy Physical Silver',
          href: '/shop/silver',
          description: 'Silver',
        },
        {
          label: 'Buy Physical Platinum',
          href: '/shop/platinum',
          description: 'Platinum',
        },
        {
          label: 'Buy Physical Palladium',
          href: '/shop/palladium',
          description: 'Palladium',
        },
        {
          label: 'Buy Physical Copper',
          href: '/shop/copper',
          description: 'Copper',
        },
      ],
    },
    {
      label: 'Send / Receive',
      icon: Send,
      items: [
        {
          label: 'Send to PBCEx User (Placeholder)',
          href: '/send/internal',
          description: 'Free & instant transfers',
        },
        {
          label: 'Crypto Withdrawal (Placeholder)',
          href: '/send/crypto',
          description: 'Send on-chain',
        },
        {
          label: 'Bank Transfers (SWIFT/WISE-ready) (Placeholder)',
          href: '/send/bank',
          description: 'Domestic & international',
        },
        {
          label: 'Pay with QR Code (Placeholder)',
          href: '/pay/qr',
          description: 'Merchant QR',
        },
        {
          label: 'Receive with QR Code (Placeholder)',
          href: '/receive/qr',
          description: 'Your QR',
        },
        {
          label: 'Spend with Visa Card (Placeholder)',
          href: '/card/spend',
          description: 'Use card',
        },
        {
          label: 'Set up Bill Pay (Placeholder)',
          href: '/pay/bills',
          description: 'Schedule utilities & vendors',
        },
        {
          label: 'Request a Payment (Placeholder)',
          href: '/pay/request',
          description: 'Create invoice/QR',
        },
        {
          label: 'Set up Recurring Transfers (Placeholder)',
          href: '/send/recurring',
          description: 'Automate payouts & savings',
        },
      ],
    },
    {
      label: 'My Account',
      icon: User,
      items: [
        {
          label: 'Balances & Funding',
          href: '/balances',
          description: 'Overview, deposit, withdraw',
        },
        {
          label: 'My Assets',
          href: '/my-assets',
          description: 'Portfolio overview & holdings',
        },
        {
          label: 'My Spending',
          href: '/my-spending',
          description: 'Spending analysis & budgets',
        },
        {
          label: 'Transaction History',
          href: '/transactions',
          description: 'All account transfers',
        },
        {
          label: 'Order History',
          href: '/orders',
          description: 'Trades & executions',
        },
        {
          label: 'PnL',
          href: '/pnl',
          description: 'Profit and loss',
        },
        {
          label: 'Connect Wallet',
          href: '/connect-wallet',
          description: 'Link external wallets',
        },
        {
          label: 'Settings & Profile',
          href: '/settings',
          description: 'Preferences and KYC',
        },
        {
          label: 'Security',
          href: '/security',
          description: '2FA, sessions, passkeys',
        },
        {
          label: 'Support',
          href: '/support',
          description: 'Help center',
        },
      ],
    },
  ];

  const handleMenuClick = (menu: MenuItem, item?: MenuItem | string) => {
    if (typeof item === 'object' && item?.onClick) {
      item.onClick();
    } else if (typeof item === 'object' && item?.href) {
      // Navigate to the intended page - auth modal will overlay if needed
      // Remove signup redirect behavior
      navigate(item.href);
    } else if (menu.href) {
      navigate(menu.href);
    } else if (
      typeof item === 'object' &&
      (item?.label === 'Spot Trading' || item?.label === 'USDC Trading')
    ) {
      navigate('/trading');
    } else if (
      typeof item === 'object' &&
      (item?.label === 'Coin Trading' || item?.label === 'COIN Trading')
    ) {
      navigate('/coin-trading');
    }
    // Add other navigation logic as needed
  };

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b ${
        isTrading
          ? 'bg-black border-gray-800'
          : 'bg-[#0A0A0A] border-gray-800'
      }`}
    >
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        {/* Left - Logo */}
        <button
          onClick={() => navigate('/')}
          className='hover:opacity-80 transition-opacity'
        >
          <img
            src={pbcexLogo}
            alt="PBCEx"
            className="h-8 w-auto"
          />
        </button>

        {/* Desktop Navigation - Center Menu */}
        <div className='hidden lg:flex items-center space-x-1'>
          {menuItems.map(menu =>
            // Check if menu has items (dropdown) or is a direct link
            menu.items ? (
              <DropdownMenu key={menu.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className={`h-9 px-3 transition-colors ${
                      isTrading
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => handleMenuClick(menu)}
                  >
                    <menu.icon className='w-4 h-4 mr-2' />
                    {menu.label}
                    <ChevronDown className='w-3 h-3 ml-1' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={`w-48 z-50 ${
                    isTrading
                      ? 'bg-gray-900 border-gray-700 text-gray-100'
                      : 'bg-gray-900 border-gray-700 text-gray-100'
                  }`}
                  align='center'
                >
                  {menu.items.map((item, index) => (
                    <div key={typeof item === 'string' ? item : item.label}>
                      <DropdownMenuItem
                        className={`cursor-pointer flex items-center justify-between ${
                          isTrading
                            ? 'hover:bg-gray-800 focus:bg-gray-800'
                            : 'hover:bg-gray-800 focus:bg-gray-800'
                        } ${(typeof item === 'object' && item.label && item.label.includes('Coming Soon')) || (typeof item === 'string' && item.includes('Coming Soon')) ? 'opacity-50 text-muted-foreground cursor-not-allowed' : ''}`}
                        onClick={e => {
                          const isComingSoon =
                            (typeof item === 'object' &&
                              item.label &&
                              item.label.includes('Coming Soon')) ||
                            (typeof item === 'string' &&
                              item.includes('Coming Soon'));
                          if (isComingSoon) {
                            e.preventDefault();
                            return;
                          }
                          handleMenuClick(menu, item);
                        }}
                      >
                        <div className='flex items-center'>
                          {typeof item === 'object' && item.icon && (
                            <item.icon className='w-4 h-4 mr-2' />
                          )}
                          <div>
                            <div>
                              {typeof item === 'string' ? item : item.label}
                            </div>
                            {typeof item === 'object' && item.description && (
                              <div
                                className={`text-xs ${
                                  isTrading
                                    ? 'text-gray-400'
                                    : 'text-gray-400'
                                }`}
                              >
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                      {index < menu.items.length - 1 &&
                        ((menu.label === 'Wallet' && index === 0) ||
                          (menu.label === 'Trade' && index === 2) ||
                          (menu.label === 'Realize' && index === 5)) && (
                          <DropdownMenuSeparator
                            className={isTrading ? 'bg-gray-700' : 'bg-gray-700'}
                          />
                        )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Direct link button
              <Button
                key={menu.label}
                variant='ghost'
                className={`h-9 px-3 transition-colors ${
                  isTrading
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                onClick={() => handleMenuClick(menu)}
              >
                <menu.icon className='w-4 h-4 mr-2' />
                {menu.label}
              </Button>
            )
          )}
        </div>

        {/* Right - Actions */}
        <div className='hidden md:flex items-center space-x-3'>
          {/* Deposit Button */}
          <Button
            size='sm'
            className={`${
              isTrading
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-black font-medium'
            }`}
            onClick={() => setDepositModalOpen(true)}
          >
            Deposit
          </Button>

          {/* Auth Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='bg-gray-800 border-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900'
                  aria-label='Account menu'
                >
                  Account
                  <ChevronDown className='w-3 h-3 ml-1' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-56 bg-gray-900 border-gray-700 text-gray-100 shadow-lg'
              >
                <DropdownMenuItem
                  onClick={() => navigate('/my-assets')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <User className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>My Assets</div>
                    <div className='text-xs text-gray-400'>Buy, Sell, Realize; Send/Receive, Spend, Transfer</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/my-spending')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <CreditCard className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>My Spending</div>
                    <div className='text-xs text-gray-400'>Track expenses, categories, and savings goals</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/balances')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <UserCheck className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Balances & Funding</div>
                    <div className='text-xs text-gray-400'>Overview, deposit, withdraw</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/transactions')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <History className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Transaction History</div>
                    <div className='text-xs text-gray-400'>All account transfers</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/orders')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <Receipt className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Order History</div>
                    <div className='text-xs text-gray-400'>Trades & executions</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/pnl')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <TrendingUp className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>PnL</div>
                    <div className='text-xs text-gray-400'>Profit & loss analytics</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/wallet')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <Wallet className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Connect Wallet</div>
                    <div className='text-xs text-gray-400'>External wallets</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/support/security')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <Shield className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Security (Placeholder)</div>
                    <div className='text-xs text-gray-400'>2FA & sessions</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/account')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <Settings className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Settings & Profile (Placeholder)</div>
                    <div className='text-xs text-gray-400'>Preferences & KYC</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/support/help-center')}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
                >
                  <HelpCircle className='mr-2 h-4 w-4' />
                  <div>
                    <div className='font-medium'>Support (Placeholder)</div>
                    <div className='text-xs text-gray-400'>Help center</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className='bg-gray-700' />
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/');
                  }}
                  className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-red-400'
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size='sm'
              className='bg-amber-500 hover:bg-amber-600 text-black font-medium focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900'
              onClick={() => setAuthModalOpen(true)}
              aria-label='Sign up or log in'
            >
              Sign Up
            </Button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-gray-300 hover:text-white hover:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900'
              >
                <Globe className='w-4 h-4 mr-1' />
                {selectedLanguage}
                <ChevronDown className='w-3 h-3 ml-1' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='z-50 bg-gray-900 border-gray-700 text-gray-100'
            >
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('EN')}
                className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('AR')}
                className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
              >
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('ZH')}
                className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
              >
                中文
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('ES')}
                className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
              >
                Español
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('FR')}
                className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
              >
                Français
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('HI')}
                className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'
              >
                हिन्दी
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className='md:hidden'>
            <Button variant='ghost' size='icon'>
              <Menu
                className={`h-5 w-5 ${isTrading ? 'text-white' : 'text-white'}`}
              />
            </Button>
          </SheetTrigger>
          <SheetContent
            className='bg-gray-900 border-gray-700'
          >
            <div className='flex flex-col space-y-4 mt-8'>
              {menuItems.map(menu => (
                <div key={menu.label} className='space-y-2'>
                  <button
                    onClick={() => handleMenuClick(menu)}
                    className='w-full text-left transition-colors duration-200 flex items-center space-x-3 p-2 text-gray-300 hover:text-white'
                  >
                    <menu.icon className='h-5 w-5' />
                    <span>{menu.label}</span>
                  </button>
                  {menu.items &&
                    menu.items.map(item => (
                      <button
                        key={typeof item === 'string' ? item : item.label}
                        onClick={e => {
                          const isComingSoon =
                            (typeof item === 'object' &&
                              item.label &&
                              item.label.includes('Coming Soon')) ||
                            (typeof item === 'string' &&
                              item.includes('Coming Soon'));
                          if (isComingSoon) {
                            e.preventDefault();
                            return;
                          }
                          handleMenuClick(menu, item);
                        }}
                        className={`w-full text-left text-sm pl-10 py-2 transition-colors flex items-center text-gray-400 hover:text-gray-200 ${(typeof item === 'object' && item.label && item.label.includes('Coming Soon')) || (typeof item === 'string' && item.includes('Coming Soon')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {typeof item === 'object' && item.icon && (
                          <item.icon className='w-4 h-4 mr-2' />
                        )}
                        <div>
                          <div>
                            {typeof item === 'string' ? item : item.label}
                          </div>
                          {typeof item === 'object' && item.description && (
                            <div
                              className='text-xs text-gray-500'
                            >
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              ))}
              <div className='flex flex-col space-y-3 mt-4'>
                <Button
                  className='bg-amber-500 hover:bg-amber-600 text-black font-medium'
                  onClick={() => setDepositModalOpen(true)}
                >
                  Deposit
                </Button>
                {user ? (
                  <Button
                    variant='outline'
                    className='bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    onClick={() => navigate('/my-assets')}
                  >
                    Account ▾
                  </Button>
                ) : (
                  <Button
                    className='bg-amber-500 hover:bg-amber-600 text-black font-medium'
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign Up
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
      />
      <WalletConnectModal
        open={walletConnectModalOpen}
        onOpenChange={setWalletConnectModalOpen}
      />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </nav>
  );
};

export default Navigation;