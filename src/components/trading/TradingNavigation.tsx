import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
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
  Users,
  BookOpen,
  ShoppingCart,
  CreditCard,
  BarChart3,
  GraduationCap,
  ArrowLeftRight,
  Repeat,
  Bitcoin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TradingNavigation = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('EN');

  const menuItems = [
    {
      label: 'Buy Crypto',
      icon: Bitcoin,
      items: [
        {
          title: 'Quick Buy',
          description: 'Fiat → asset in one step',
          href: '/buy',
        },
        {
          title: 'Quick Convert',
          description: 'Swap between assets instantly',
          href: '/convert',
        },
        {
          title: 'Buy with Card',
          description: 'Visa/Mastercard checkout',
          href: '/buy/card',
        },
        {
          title: 'Deposit Crypto',
          description: 'On-chain deposit addresses',
          href: '/deposit',
        },
      ],
    },
    {
      label: 'Trade',
      icon: TrendingUp,
      items: [
        {
          title: 'Spot (USD)',
          description: 'USD-quoted markets',
          href: '/trading/spot-usd',
        },
        {
          title: 'Spot (USDC)',
          description: 'USDC-quoted markets',
          href: '/trading/spot-usdc',
        },
        {
          title: 'Coin-to-Coin',
          description: 'BTC/ETH quote pairs',
          href: '/trading/coin',
        },
        {
          title: 'DCA',
          description: 'Automated recurring purchases',
          href: '/trade/dca',
        },
      ],
    },
    {
      label: 'Markets',
      icon: BarChart3,
      items: [
        {
          title: 'Analytics',
          description: 'Overview & key metrics dashboard',
          href: '/markets/analytics',
        },
        {
          title: 'Tutorials',
          description: 'How-to guides for trading',
          href: '/education',
        },
        {
          title: 'Education (Learn X)',
          description: 'Courses & long-form content',
          href: '/education',
        },
      ],
    },
    {
      label: 'Shop',
      icon: ShoppingCart,
      items: [
        {
          title: 'Shop All',
          description: 'View all commodities',
          href: '/shop',
        },
        {
          title: 'Buy Physical Gold',
          description: 'Coins & bars with insured shipping',
          href: '/shop/GOLD',
        },
        {
          title: 'Buy Physical Silver',
          description: 'Coins & bars with insured shipping',
          href: '/shop/SILVER',
        },
        {
          title: 'Buy Physical Platinum',
          description: 'Coins & bars with insured shipping',
          href: '/shop/PLATINUM',
        },
        {
          title: 'Buy Physical Palladium',
          description: 'Coins & bars with insured shipping',
          href: '/shop/PALLADIUM',
        },
        {
          title: 'Buy Physical Copper',
          description: 'Rounds & bars',
          href: '/shop/COPPER',
        },
      ],
    },
    {
      label: 'Send / Receive',
      icon: ArrowLeftRight,
      items: [
        {
          title: 'Send to PBCEx User',
          description: 'Free & instant transfers',
          href: '/send/internal',
        },
        {
          title: 'Crypto Withdrawal',
          description: 'Send on-chain to external wallet',
          href: '/send/crypto',
        },
        {
          title: 'Bank Transfers (SWIFT/WISE-ready)',
          description: 'Domestic & international wires',
          href: '/send/bank',
        },
        {
          title: 'Pay with QR Code',
          description: 'Merchant payments via QR',
          href: '/pay/qr',
        },
        {
          title: 'Receive with QR Code',
          description: 'Your QR for incoming payments',
          href: '/receive/qr',
        },
        {
          title: 'Spend with Visa Card',
          description: 'Use card at any merchant',
          href: '/card/spend',
        },
        {
          title: 'Set up Bill Pay',
          description: 'Schedule utilities & vendors',
          href: '/pay/bills',
        },
        {
          title: 'Request a Payment',
          description: 'Create an invoice/QR',
          href: '/pay/request',
        },
        {
          title: 'Set up Recurring Transfers',
          description: 'Automate payouts & savings',
          href: '/send/recurring',
        },
      ],
    },
    {
      label: 'My Account',
      icon: User,
      items: [
        {
          title: 'Balances & Funding',
          description: 'Overview, deposit, withdraw',
          href: '/my-assets',
        },
        {
          title: 'Cards',
          description: 'Manage virtual & physical cards',
          href: '/card/spend',
        },
        {
          title: 'Transaction History',
          description: 'All account transfers',
          href: '/transaction-history',
        },
        {
          title: 'Order History',
          description: 'Trades & executions',
          href: '/order-history',
        },
        { title: 'PnL', description: 'Profit and loss', href: '/pnl' },
        {
          title: 'Connect Wallet',
          description: 'Link external wallets',
          href: '/wallet',
        },
        {
          title: 'Security',
          description: '2FA, sessions, passkeys',
          href: '/account/security',
        },
        {
          title: 'Settings & Profile',
          description: 'Preferences and KYC',
          href: '/account',
        },
        {
          title: 'Support',
          description: 'Help center & contact',
          href: '/support/help-center',
        },
      ],
    },
  ];

  return (
    <nav className='sticky top-0 z-50 h-16 bg-[#0A0A0A] border-b border-[#23262A] flex items-center justify-between px-6'>
      {/* Left - Logo */}
      <div className='flex items-center space-x-2'>
        <button
          onClick={() => navigate('/')}
          className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
        >
          <img
            src='/brand/pbcex-logo.svg'
            alt='PBCEx'
            className='h-8 w-auto object-contain'
          />
        </button>
      </div>

      {/* Center - Navigation Menu */}
      <div className='hidden lg:flex items-center space-x-6'>
        {menuItems.map(menu => (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='h-12 px-4 text-[#F2F3F5] hover:text-[#F2F3F5] hover:bg-[#111214] transition-colors border-b-2 border-transparent hover:border-yellow-500 rounded-none'
              >
                <menu.icon className='w-4 h-4 mr-2' />
                {menu.label}
                <ChevronDown className='w-3 h-3 ml-1' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-80 bg-[#111214] border-[#23262A] text-[#F2F3F5] shadow-2xl'
              align='center'
              sideOffset={8}
            >
              <div className='py-2'>
                {menu.items.map((item, index) => (
                  <div key={typeof item === 'string' ? item : item.title}>
                    <DropdownMenuItem
                      className='px-4 py-3 hover:bg-[#15171A] focus:bg-[#15171A] cursor-pointer'
                      onClick={() =>
                        typeof item === 'object' && item.href
                          ? navigate(item.href)
                          : undefined
                      }
                    >
                      <div className='flex flex-col space-y-1'>
                        <div className='text-[#F2F3F5] font-medium text-sm'>
                          {typeof item === 'string' ? item : item.title}
                        </div>
                        {typeof item === 'object' && item.description && (
                          <div className='text-[#C8CDD3] text-xs leading-relaxed'>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                    {index < menu.items.length - 1 && (
                      <div className='mx-4 border-b border-[#23262A]' />
                    )}
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <div className='lg:hidden'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='text-[#C8CDD3] hover:text-[#F2F3F5] hover:bg-[#111214]'
            >
              <User className='w-5 h-5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-64 bg-[#111214] border-[#23262A] text-[#F2F3F5] shadow-2xl'
            align='end'
            sideOffset={8}
          >
            <div className='py-2'>
              {menuItems.map((menu, menuIndex) => (
                <div key={menu.label}>
                  <div className='px-4 py-2 text-[#C8CDD3] text-xs font-semibold uppercase tracking-wider'>
                    {menu.label}
                  </div>
                  {menu.items.map((item, itemIndex) => (
                    <DropdownMenuItem
                      key={item.title}
                      className='px-4 py-2 hover:bg-[#15171A] focus:bg-[#15171A] cursor-pointer'
                      onClick={() => navigate(item.href)}
                    >
                      <div className='flex flex-col space-y-1'>
                        <div className='text-[#F2F3F5] font-medium text-sm'>
                          {item.title}
                        </div>
                        <div className='text-[#C8CDD3] text-xs leading-relaxed'>
                          {item.description}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {menuIndex < menuItems.length - 1 && (
                    <div className='mx-4 my-2 border-b border-[#23262A]' />
                  )}
                </div>
              ))}
              <DropdownMenuItem
                className='px-4 py-2 hover:bg-[#15171A] focus:bg-[#15171A] cursor-pointer'
                onClick={() => navigate('/support/help-center')}
              >
                <div className='flex items-center space-x-2'>
                  <HelpCircle className='w-4 h-4' />
                  <span className='text-[#F2F3F5] font-medium text-sm'>
                    Help
                  </span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right - Help, Deposit, Language */}
      <div className='hidden lg:flex items-center space-x-4'>
        <Button
          variant='ghost'
          size='sm'
          className='text-[#F2F3F5] hover:text-[#F2F3F5] hover:bg-[#111214]'
          onClick={() => navigate('/support/help-center')}
        >
          <HelpCircle className='w-4 h-4 mr-2' />
          Help
        </Button>

        <Button
          size='sm'
          className='bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2'
        >
          Deposit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='text-[#C8CDD3] hover:text-[#F2F3F5] hover:bg-[#111214]'
            >
              <Globe className='w-4 h-4 mr-2' />
              {selectedLanguage}
              <ChevronDown className='w-3 h-3 ml-1' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='bg-[#111214] border-[#23262A] text-[#F2F3F5]'>
            <DropdownMenuItem
              onClick={() => setSelectedLanguage('EN')}
              className='hover:bg-[#15171A] cursor-pointer'
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedLanguage('AR')}
              className='hover:bg-[#15171A] cursor-pointer'
            >
              العربية
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedLanguage('FR')}
              className='hover:bg-[#15171A] cursor-pointer'
            >
              Français
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default TradingNavigation;
