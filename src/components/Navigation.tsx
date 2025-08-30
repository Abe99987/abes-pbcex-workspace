import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Home,
  Send,
  Building2,
  BookOpen,
  BarChart3,
  Coins,
  CandlestickChart,
  History,
  PieChart,
  TrendingDown,
  ArrowUpDown,
  Receipt,
  Package,
  Truck,
  MapPin,
  Settings,
  LogOut,
  CreditCard,
  Users,
  Gift,
  Target,
  Code,
  Badge as BadgeIcon,
  Crown,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  // Check if we're on trading page for theme adaptation
  const isTrading =
    location.pathname === '/trading' || location.pathname === '/coin-trading';

  const menuItems: MenuItem[] = [
    {
      label: 'Trade',
      icon: CandlestickChart,
      items: [
        {
          label: 'USDC Trading',
          description: 'Settle in USDC',
          href: '/trading',
        },
        {
          label: 'COIN Trading',
          description: 'Settle in PAXG, XAG, OSP, BTC, ETH, SOL, XRP, SUI',
          href: '/coin-trading',
        },
        { label: 'FX Trading', description: 'USD, EUR, GBP, AED, LYD, JPY' },
        { label: 'Margin Trading', description: 'Coming Soon' },
        { label: 'DCA', description: 'Dollar Cost Average Strategies' },
        { label: 'Trade Analytics' },
        { label: 'Market Reports' },
        { label: 'News' },
      ],
    },
    {
      label: 'Wallet',
      icon: Wallet,
      items: [
        {
          label: 'My Assets',
          description: 'Buy, Sell, Realize, Send/Receive, Spend, Transfer',
          onClick: () => navigate('/my-assets'),
        },
        {
          label: 'My Spending',
          description: 'Track expenses, categories, and savings goals',
          onClick: () => navigate('/my-spending'),
        },
        {
          label: 'Transaction History',
          description: 'View all account transactions and transfers',
          onClick: () => navigate('/transaction-history'),
        },
        {
          label: 'Order History',
          description: 'Track all trading orders and execution',
          onClick: () => navigate('/order-history'),
        },
        {
          label: 'PnL',
          description: 'Profit and Loss',
          onClick: () => navigate('/pnl'),
        },
        {
          label: 'Connect Wallet',
          description: 'Connect external wallets',
          onClick: () => setWalletConnectModalOpen(true),
        },
      ],
    },
    {
      label: 'Shop',
      icon: Package,
      items: [
        { label: 'Shop All', href: '/shop', description: 'View all commodities' },
        { label: 'Buy Physical Gold', href: '/shop/XAU' },
        { label: 'Buy Physical Silver', href: '/shop/XAG' },
        { label: 'Buy Physical Platinum', href: '/shop/XPT' },
        { label: 'Buy Physical Palladium', href: '/shop/XPD' },
        { label: 'Buy Physical Copper', href: '/shop/XCU' },
        { label: 'Oil — Coming Soon', href: '/realize' },
        { label: 'Natural Gas — Coming Soon', href: '/realize' },
        { label: 'Lithium — Coming Soon', href: '/realize' },
      ],
    },
    {
      label: 'Send/Pay',
      icon: Send,
      items: [
        { label: 'Send to PBcex User' },
        { label: 'External Transfers (Bank / Crypto Withdrawal)' },
        { label: 'Remittances (via Wise)' },
        { label: 'Pay with QR Code' },
        { label: 'Spend with Visa Card' },
        { label: 'Set Up Bill Pay' },
        { label: 'Request a Payment' },
        { label: 'Set Up Recurring Transfers' },
        { label: 'Bank Wire Transfer' },
      ],
    },
    {
      label: 'Franchise',
      href: '/franchise',
      icon: Building2,
    },
    {
      label: 'Learn',
      href: '/education',
      icon: BookOpen,
    },
    {
      label: 'Security',
      href: '/support/security',
      icon: Shield,
    },
    {
      label: 'Help',
      icon: HelpCircle,
      items: [
        { label: 'Help Center', href: '/support/help-center' },
        { label: 'Security', href: '/support/security' },
        { label: 'Compliance', href: '/support/compliance' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ];

  const handleMenuClick = (menu: MenuItem, item?: MenuItem | string) => {
    if (typeof item === 'object' && item?.onClick) {
      item.onClick();
    } else if (typeof item === 'object' && item?.href) {
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
          : 'border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      }`}
    >
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        {/* Left - Logo */}
        <button
          onClick={() => navigate('/')}
          className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
        >
          <img
            src='/lovable-uploads/85edd95a-cedc-4291-a8a7-8884e15ead12.png'
            alt='PBCEX'
            className='h-8 w-auto'
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
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                      : 'bg-background border-border text-foreground'
                  }`}
                  align='center'
                >
                  {menu.items.map((item, index) => (
                    <div key={typeof item === 'string' ? item : item.label}>
                      <DropdownMenuItem
                        className={`cursor-pointer flex items-center justify-between ${
                          isTrading
                            ? 'hover:bg-gray-800 focus:bg-gray-800'
                            : 'hover:bg-accent focus:bg-accent'
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
                                    : 'text-muted-foreground'
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
                            className={isTrading ? 'bg-gray-700' : 'bg-border'}
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
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
          <Button
            size='sm'
            className={`${
              isTrading
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            onClick={() => setDepositModalOpen(true)}
          >
            Deposit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className={`${
                  isTrading
                    ? 'text-gray-300 hover:text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className='w-4 h-4 mr-1' />
                {selectedLanguage}
                <ChevronDown className='w-3 h-3 ml-1' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={`z-50 ${
                isTrading
                  ? 'bg-gray-900 border-gray-700 text-gray-100'
                  : 'bg-background border-border text-foreground'
              }`}
            >
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('EN')}
                className={`cursor-pointer ${
                  isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
                }`}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('AR')}
                className={`cursor-pointer ${
                  isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
                }`}
              >
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedLanguage('FR')}
                className={`cursor-pointer ${
                  isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
                }`}
              >
                Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant='ghost'
            size='sm'
            className={`p-2 ${
              isTrading
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            onClick={() => setAuthModalOpen(true)}
          >
            <User className='w-4 h-4' />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className='md:hidden'>
            <Button variant='ghost' size='icon'>
              <Menu
                className={`h-5 w-5 ${isTrading ? 'text-white' : 'text-foreground'}`}
              />
            </Button>
          </SheetTrigger>
          <SheetContent
            className={isTrading ? 'bg-gray-900 border-gray-700' : ''}
          >
            <div className='flex flex-col space-y-4 mt-8'>
              {menuItems.map(menu => (
                <div key={menu.label} className='space-y-2'>
                  <button
                    onClick={() => handleMenuClick(menu)}
                    className={`w-full text-left transition-colors duration-200 flex items-center space-x-3 p-2 ${
                      isTrading
                        ? 'text-gray-300 hover:text-white'
                        : 'text-foreground hover:text-primary'
                    }`}
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
                        className={`w-full text-left text-sm pl-10 py-2 transition-colors flex items-center ${
                          isTrading
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-muted-foreground hover:text-foreground'
                        } ${(typeof item === 'object' && item.label && item.label.includes('Coming Soon')) || (typeof item === 'string' && item.includes('Coming Soon')) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                              className={`text-xs ${
                                isTrading
                                  ? 'text-gray-500'
                                  : 'text-muted-foreground/60'
                              }`}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              ))}
              <Button
                className={`mt-4 ${
                  isTrading
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary hover:bg-primary/90'
                }`}
                onClick={() => setDepositModalOpen(true)}
              >
                Deposit
              </Button>
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
