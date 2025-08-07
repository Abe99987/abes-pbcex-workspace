import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, User, Globe, Wallet, TrendingUp, Shield, HelpCircle, Home, Send, Building2, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TradingNavigation = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const menuItems = [
    {
      label: "Markets",
      icon: TrendingUp,
      items: ["Gold/USD", "Silver/USD", "Oil/USD", "LYD/USD", "All Markets"]
    },
    {
      label: "Trade",
      icon: TrendingUp,
      items: ["Spot Trading", "Copy Trading", "Order History", "Trading Analytics"]
    },
    {
      label: "Wallet",
      icon: Wallet,
      items: ["Balances", "Freeze/Unfreeze", "Transaction History", "Security Settings"]
    },
    {
      label: "Send/Pay",
      icon: Send,
      items: ["Send to PBcex User", "External Transfers (Bank / Crypto Withdrawal)", "Remittances (via Wise)", "Pay with QR Code", "Spend with Visa Card", "Set Up Bill Pay", "Request a Payment", "Set Up Recurring Transfers", "Bank Wire Transfer"]
    },
    {
      label: "Realize",
      icon: Home,
      items: ["Physical Gold", "Physical Silver", "Cash Pickup", "Bank Transfer"]
    },
    {
      label: "Franchise",
      icon: Building2,
      items: ["Open Branch", "Partner Program", "Requirements", "Support"]
    },
    {
      label: "Education",
      icon: BookOpen,
      items: ["Trading Basics", "Asset Backing", "Risk Management", "Video Tutorials"]
    },
    {
      label: "Security",
      icon: Shield,
      items: ["2FA Settings", "API Keys", "Login History", "Security Tips"]
    },
    {
      label: "Help",
      icon: HelpCircle,
      items: ["Support Center", "Live Chat", "FAQ", "Contact Us"]
    }
  ];

  return (
    <nav className="sticky top-0 z-50 h-14 bg-black border-b border-gray-800 flex items-center justify-between px-4">
      {/* Left - Logo */}
      <div className="flex items-center space-x-2">
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
      </div>

      {/* Center - Navigation Menu */}
      <div className="hidden lg:flex items-center space-x-1">
        {menuItems.map((menu) => (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-9 px-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <menu.icon className="w-4 h-4 mr-2" />
                {menu.label}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-48 bg-gray-900 border-gray-700 text-gray-100"
              align="center"
            >
              {menu.items.map((item, index) => (
                <div key={item}>
                  <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                    {item}
                  </DropdownMenuItem>
                  {index < menu.items.length - 1 && menu.label === "Wallet" && index === 1 && (
                    <DropdownMenuSeparator className="bg-gray-700" />
                  )}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {/* Right - Profile, Deposit, Language */}
      <div className="flex items-center space-x-3">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Deposit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
              <Globe className="w-4 h-4 mr-1" />
              {selectedLanguage}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-900 border-gray-700 text-gray-100">
            <DropdownMenuItem 
              onClick={() => setSelectedLanguage("EN")}
              className="hover:bg-gray-800 cursor-pointer"
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSelectedLanguage("AR")}
              className="hover:bg-gray-800 cursor-pointer"
            >
              العربية
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSelectedLanguage("FR")}
              className="hover:bg-gray-800 cursor-pointer"
            >
              Français
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-gray-700 text-gray-300 text-xs">
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-gray-900 border-gray-700 text-gray-100" align="end">
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer text-red-400">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default TradingNavigation;