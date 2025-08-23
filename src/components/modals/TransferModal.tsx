import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  direction: "funding-to-trading" | "trading-to-funding";
  prefilledAmount?: string;
  prefilledAsset?: string;
}

const TransferModal = ({ isOpen, onClose, direction, prefilledAmount = "", prefilledAsset = "" }: TransferModalProps) => {
  const [amount, setAmount] = useState(prefilledAmount);
  const [selectedAsset, setSelectedAsset] = useState(prefilledAsset || "USD");
  const [targetSynthetic, setTargetSynthetic] = useState("XAU-s");
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Mock balances (in practice, this would come from API)
  const fundingBalances = {
    USD: 12450.00,
    USDC: 8500.00,
    USDT: 3200.00,
    PAXG: 2.5, // ounces
  };

  const tradingBalances = {
    "XAU-s": 3.2,
    "XAG-s": 125.5,
    "XPT-s": 1.8,
    "XPD-s": 0.9,
    "XCU-s": 2.1, // tons
  };

  // Mock conversion rates (in practice, from oracle)
  const conversionRates = {
    "XAU-s": 2048.50, // Gold per oz
    "XAG-s": 24.85,   // Silver per oz
    "XPT-s": 924.80,  // Platinum per oz
    "XPD-s": 1280.40, // Palladium per oz
    "XCU-s": 8420.00, // Copper per ton
  };

  const getConversionDetails = () => {
    const amountNum = parseFloat(amount) || 0;
    
    if (direction === "funding-to-trading") {
      if (selectedAsset === "PAXG") {
        // PAXG to XAU-s (1:1)
        return {
          from: `${amountNum} PAXG`,
          to: `${amountNum} XAU-s`,
          rate: "1:1",
          description: "PAXG converts directly to XAU-s at 1:1 ratio"
        };
      } else {
        // USD/USDC/USDT to synthetic
        const synthPrice = conversionRates[targetSynthetic] || 1;
        const synthAmount = amountNum / synthPrice;
        return {
          from: `$${amountNum.toFixed(2)} ${selectedAsset}`,
          to: `${synthAmount.toFixed(6)} ${targetSynthetic}`,
          rate: `$${synthPrice.toFixed(2)} per ${targetSynthetic}`,
          description: `Convert cash to synthetic at current oracle mark`
        };
      }
    } else {
      // Trading to Funding
      if (selectedAsset === "XAU-s") {
        return {
          from: `${amountNum} XAU-s`,
          to: `${amountNum} PAXG`,
          rate: "1:1",
          description: "XAU-s converts to PAXG at 1:1 ratio"
        };
      } else {
        const synthPrice = conversionRates[selectedAsset] || 1;
        const usdAmount = amountNum * synthPrice;
        return {
          from: `${amountNum} ${selectedAsset}`,
          to: `$${usdAmount.toFixed(2)} USD`,
          rate: `$${synthPrice.toFixed(2)} per ${selectedAsset}`,
          description: `Burn synthetic and receive USD at current oracle mark`
        };
      }
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const conversion = getConversionDetails();
    
    toast({
      title: "Transfer Completed",
      description: `Converted ${conversion.from} → ${conversion.to}`,
    });
    
    setIsConfirming(false);
    onClose();
    setAmount("");
    setSelectedAsset("USD");
    setTargetSynthetic("XAU-s");
  };

  const conversion = getConversionDetails();
  const maxBalance = direction === "funding-to-trading" 
    ? fundingBalances[selectedAsset as keyof typeof fundingBalances] 
    : tradingBalances[selectedAsset as keyof typeof tradingBalances];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Transfer {direction === "funding-to-trading" ? "Funding → Trading" : "Trading → Funding"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Direction Indicator */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {direction === "funding-to-trading" ? "From: Funding (Spot/Vault)" : "From: Trading (Synthetic)"}
                </span>
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {direction === "funding-to-trading" ? "To: Trading (Synthetic)" : "To: Funding (Spot/Vault)"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Asset Selection */}
          <div className="space-y-3">
            <Label>
              {direction === "funding-to-trading" ? "From Asset" : "Burn Synthetic"}
            </Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {direction === "funding-to-trading" ? (
                  <>
                    <SelectItem value="USD">USD (${fundingBalances.USD.toLocaleString()})</SelectItem>
                    <SelectItem value="USDC">USDC (${fundingBalances.USDC.toLocaleString()})</SelectItem>
                    <SelectItem value="USDT">USDT (${fundingBalances.USDT.toLocaleString()})</SelectItem>
                    <SelectItem value="PAXG">PAXG ({fundingBalances.PAXG} oz)</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="XAU-s">XAU-s ({tradingBalances["XAU-s"]} oz)</SelectItem>
                    <SelectItem value="XAG-s">XAG-s ({tradingBalances["XAG-s"]} oz)</SelectItem>
                    <SelectItem value="XPT-s">XPT-s ({tradingBalances["XPT-s"]} oz)</SelectItem>
                    <SelectItem value="XPD-s">XPD-s ({tradingBalances["XPD-s"]} oz)</SelectItem>
                    <SelectItem value="XCU-s">XCU-s ({tradingBalances["XCU-s"]} tons)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Target Synthetic Selection (only for Funding → Trading with cash) */}
          {direction === "funding-to-trading" && selectedAsset !== "PAXG" && (
            <div className="space-y-3">
              <Label>Convert to Synthetic</Label>
              <Select value={targetSynthetic} onValueChange={setTargetSynthetic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAU-s">XAU-s (Gold)</SelectItem>
                  <SelectItem value="XAG-s">XAG-s (Silver)</SelectItem>
                  <SelectItem value="XPT-s">XPT-s (Platinum)</SelectItem>
                  <SelectItem value="XPD-s">XPD-s (Palladium)</SelectItem>
                  <SelectItem value="XCU-s">XCU-s (Copper)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-3">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              max={maxBalance}
              className="text-lg"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Available: {maxBalance?.toLocaleString()} {selectedAsset}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAmount(maxBalance?.toString() || "0")}
                className="h-6 px-2 text-xs"
              >
                Max
              </Button>
            </div>
          </div>

          {/* Conversion Preview */}
          {amount && parseFloat(amount) > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Conversion:</span>
                    <span className="text-sm text-blue-700">{conversion.rate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">{conversion.from}</span>
                    <ArrowUpDown className="w-3 h-3 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{conversion.to}</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    {conversion.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* External Withdrawal Warning */}
          {direction === "trading-to-funding" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Note:</strong> Withdrawals are available from Funding only. 
                    Converted assets will be available for external withdrawal.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversion Info */}
          <div className="text-xs text-muted-foreground">
            Converted to internal trading tokens.
          </div>

          {/* Action Button */}
          <Button
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (maxBalance || 0) || isConfirming}
            className="w-full"
            size="lg"
          >
            {isConfirming ? "Processing..." : `Transfer ${conversion.from} → ${conversion.to}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;