import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const TradingFooter = () => {
  return (
    <div className="h-12 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 text-sm">
      {/* Left - Account Balance */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Available USD:</span>
          <span className="text-white font-medium">$12,450.00</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Gold Balance:</span>
          <span className="text-gold font-medium">24.5g</span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-3 h-3 text-slate-500 hover:text-slate-300" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Your tokenized gold holdings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Silver Balance:</span>
          <span className="text-slate-300 font-medium">156.2g</span>
        </div>
      </div>

      {/* Center - Open Positions Summary */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Open Positions:</span>
          <Badge variant="outline" className="border-green-500 text-green-400">
            3 Long
          </Badge>
          <Badge variant="outline" className="border-red-500 text-red-400">
            1 Short
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Total PnL:</span>
          <span className="text-green-400 font-medium">+$147.82</span>
        </div>
      </div>

      {/* Right - Market Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-slate-400">Market Open</span>
        </div>
        
        <div className="text-slate-500 text-xs">
          Last Update: 18:45:32 UTC
        </div>
      </div>
    </div>
  );
};

export default TradingFooter;