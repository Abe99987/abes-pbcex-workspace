import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DepositModal from "@/components/modals/DepositModal";
import WalletConnectModal from "@/components/modals/WalletConnectModal";
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
  Crown
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [walletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  
  // Check if we're on trading page for theme adaptation
  const isTrading = location.pathname === '/trading' || location.pathname === '/coin-trading';

  const menuItems = [
    {
      label: "Trade",
      icon: CandlestickChart,
      items: [
        { label: "USDC Trading", description: "Settle in USDC", href: "/trading" },
        { label: "COIN Trading", description: "Settle in PAXG, XAG, OSP, BTC, ETH, SOL, XRP, SUI", href: "/coin-trading" },
        { label: "FX Trading", description: "USD, EUR, GBP, AED, LYD, JPY" },
        { label: "Margin Trading", description: "Coming Soon" },
        { label: "DCA", description: "Dollar Cost Average Strategies" },
        { label: "Trade Analytics" },
        { label: "Market Reports" },
        { label: "News" }
      ]
    },
    {
      label: "Wallet",
      icon: Wallet,
      items: [
        { 
          label: "My Assets", 
          description: "Buy, Sell, Realize, Send/Receive, Spend, Transfer",
          onClick: () => navigate('/my-assets')
        },
        { label: "Transaction History" },
        { label: "Order History" },
        { 
          label: "PnL", 
          description: "Profit and Loss",
          onClick: () => navigate('/pnl')
        },
        { 
          label: "Connect Wallet", 
          description: "Connect external wallets",
          onClick: () => setWalletConnectModalOpen(true)
        }
      ]
    },
    {
      label: "Realize",
      href: "/realize",
      icon: Package
    },
    {
      label: "Send/Pay",
      icon: Send,
      items: [
        { label: "Internal Transfers" },
        { label: "QR Code Payments" },
        { label: "Spend with Visa" },
        { label: "Remittances" }
      ]
    },
    {
      label: "Franchise",
      href: "/franchise",
      icon: Building2
    },
    {
      label: "Education",
      href: "/education",
      icon: BookOpen
    },
    {
      label: "Security",
      icon: Shield
    },
    {
      label: "Help",
      icon: HelpCircle
    }
  ];

  const handleMenuClick = (menu: any, item?: any) => {
    if (item?.onClick) {
      item.onClick();
    } else if (item?.href) {
      navigate(item.href);
    } else if (menu.href) {
      navigate(menu.href);
    } else if (item?.label === "Spot Trading" || item?.label === "USDC Trading") {
      navigate("/trading");
    } else if (item?.label === "Coin Trading" || item?.label === "COIN Trading") {
      navigate("/coin-trading");
    }
    // Add other navigation logic as needed
  };

  return (
    <nav className={`sticky top-0 z-50 w-full border-b ${
      isTrading 
        ? 'bg-black border-gray-800' 
        : 'border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
    }`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left - Logo */}
        <button 
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img 
            src="/lovable-uploads/85edd95a-cedc-4291-a8a7-8884e15ead12.png" 
            alt="PBCEX" 
            className="h-8 w-auto"
          />
        </button>

        {/* Desktop Navigation - Center Menu */}
        <div className="hidden lg:flex items-center space-x-1">
          {menuItems.map((menu) => (
            // Check if menu has items (dropdown) or is a direct link
            menu.items ? (
              <DropdownMenu key={menu.label}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`h-9 px-3 transition-colors ${
                      isTrading 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    onClick={() => handleMenuClick(menu)}
                  >
                    <menu.icon className="w-4 h-4 mr-2" />
                    {menu.label}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className={`w-48 z-50 ${
                    isTrading 
                      ? 'bg-gray-900 border-gray-700 text-gray-100' 
                      : 'bg-background border-border text-foreground'
                  }`}
                  align="center"
                >
                  {menu.items.map((item, index) => (
                    <div key={typeof item === 'string' ? item : item.label}>
                      <DropdownMenuItem 
                        className={`cursor-pointer flex items-center justify-between ${
                          isTrading 
                            ? 'hover:bg-gray-800 focus:bg-gray-800' 
                            : 'hover:bg-accent focus:bg-accent'
                        } ${typeof item === 'object' && item.description === 'Coming Soon' ? 'opacity-60' : ''}`}
                        onClick={() => handleMenuClick(menu, item)}
                        disabled={typeof item === 'object' && item.description === 'Coming Soon'}
                      >
                        <div className="flex items-center">
                          {typeof item === 'object' && item.icon && (
                            <item.icon className="w-4 h-4 mr-2" />
                          )}
                          <div>
                            <div>{typeof item === 'string' ? item : item.label}</div>
                            {typeof item === 'object' && item.description && (
                              <div className={`text-xs ${
                                isTrading ? 'text-gray-400' : 'text-muted-foreground'
                              }`}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                      {index < menu.items.length - 1 && (
                        (menu.label === "Wallet" && index === 0) ||
                        (menu.label === "Trade" && index === 2) ||
                        (menu.label === "Realize" && index === 5)
                      ) && (
                        <DropdownMenuSeparator className={isTrading ? 'bg-gray-700' : 'bg-border'} />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Direct link button
              <Button
                key={menu.label}
                variant="ghost"
                className={`h-9 px-3 transition-colors ${
                  isTrading 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => handleMenuClick(menu)}
              >
                <menu.icon className="w-4 h-4 mr-2" />
                {menu.label}
              </Button>
            )
          ))}
        </div>

        {/* Right - Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <Button
            size="sm"
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
                variant="ghost" 
                size="sm" 
                className={`${
                  isTrading 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="w-4 h-4 mr-1" />
                {selectedLanguage}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`z-50 ${
              isTrading 
                ? 'bg-gray-900 border-gray-700 text-gray-100' 
                : 'bg-background border-border text-foreground'
            }`}>
              <DropdownMenuItem 
                onClick={() => setSelectedLanguage("EN")}
                className={`cursor-pointer ${
                  isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
                }`}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSelectedLanguage("AR")}
                className={`cursor-pointer ${
                  isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
                }`}
              >
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSelectedLanguage("FR")}
                className={`cursor-pointer ${
                  isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
                }`}
              >
                Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className={`${
                    isTrading 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-muted text-muted-foreground'
                  } text-xs`}>
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-52 z-50 ${
              isTrading 
                ? 'bg-gray-900 border-gray-700 text-gray-100' 
                : 'bg-background border-border text-foreground'
            }`} align="end">
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <Shield className="w-4 h-4 mr-3" />
                Account & Security
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <BadgeIcon className="w-4 h-4 mr-3" />
                Identification
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <Gift className="w-4 h-4 mr-3" />
                My Coupons
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <Users className="w-4 h-4 mr-3" />
                Affiliate
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <CreditCard className="w-4 h-4 mr-3" />
                Trading Fees
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Crown className="w-4 h-4 mr-3" />
                    Sub-Account
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Beta
                  </Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <Code className="w-4 h-4 mr-3" />
                API
              </DropdownMenuItem>
              <DropdownMenuSeparator className={isTrading ? 'bg-gray-700' : 'bg-border'} />
              <DropdownMenuItem className={`cursor-pointer ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer text-red-400 ${
                isTrading ? 'hover:bg-gray-800' : 'hover:bg-accent'
              }`}>
                <LogOut className="w-4 h-4 mr-3" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className={`h-5 w-5 ${isTrading ? 'text-white' : 'text-foreground'}`} />
            </Button>
          </SheetTrigger>
          <SheetContent className={isTrading ? 'bg-gray-900 border-gray-700' : ''}>
            <div className="flex flex-col space-y-4 mt-8">
              {menuItems.map((menu) => (
                <div key={menu.label} className="space-y-2">
                  <button
                    onClick={() => handleMenuClick(menu)}
                    className={`w-full text-left transition-colors duration-200 flex items-center space-x-3 p-2 ${
                      isTrading 
                        ? 'text-gray-300 hover:text-white' 
                        : 'text-foreground hover:text-primary'
                    }`}
                  >
                    <menu.icon className="h-5 w-5" />
                    <span>{menu.label}</span>
                  </button>
                  {menu.items && menu.items.map((item) => (
                     <button
                       key={typeof item === 'string' ? item : item.label}
                       onClick={() => handleMenuClick(menu, item)}
                       className={`w-full text-left text-sm pl-10 py-2 transition-colors flex items-center ${
                         isTrading 
                           ? 'text-gray-400 hover:text-gray-200' 
                           : 'text-muted-foreground hover:text-foreground'
                       } ${typeof item === 'object' && item.description === 'Coming Soon' ? 'opacity-60' : ''}`}
                       disabled={typeof item === 'object' && item.description === 'Coming Soon'}
                     >
                       {typeof item === 'object' && item.icon && (
                         <item.icon className="w-4 h-4 mr-2" />
                       )}
                       <div>
                         <div>{typeof item === 'string' ? item : item.label}</div>
                         {typeof item === 'object' && item.description && (
                           <div className={`text-xs ${
                             isTrading ? 'text-gray-500' : 'text-muted-foreground/60'
                           }`}>
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
    </nav>
  );
};

export default Navigation;