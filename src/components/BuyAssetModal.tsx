import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building2, Wallet, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BuyAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    name: string;
    price: string;
    symbol: string;
    icon: string;
  };
}

const BuyAssetModal = ({ isOpen, onClose, asset }: BuyAssetModalProps) => {
  const [amount, setAmount] = useState("");
  const [amountType, setAmountType] = useState<"usd" | "grams" | "units">("usd");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  // Token mapping
  const getTokenInfo = () => {
    switch (asset.symbol) {
      case "AU": return { name: "PAXG", fullName: "Pax Gold", explorer: "https://etherscan.io/token/0x45804880de22913dafe09f4980848ece6ecbaf78" };
      case "AG": return { name: "PBC-S", fullName: "PBCex Silver Token", explorer: "https://etherscan.io/token/0x..." };
      case "LYD": return { name: "PBC-L", fullName: "PBCex Libyan Dinar", explorer: "https://etherscan.io/token/0x..." };
      case "OIL": return { name: "PBC-O", fullName: "PBCex Oil Token", explorer: "https://etherscan.io/token/0x..." };
      default: return { name: "TOKEN", fullName: "Token", explorer: "#" };
    }
  };

  // Asset-specific pricing and units
  const getAssetConfig = () => {
    switch (asset.symbol) {
      case "AU": 
        return { 
          pricePerUnit: 75.50, 
          unit: "gram", 
          unitLabel: "grams",
          minAmount: 0.001,
          description: "Pure 24k gold backed by PAXG tokens"
        };
      case "AG": 
        return { 
          pricePerUnit: 0.85, 
          unit: "gram", 
          unitLabel: "grams",
          minAmount: 0.1,
          description: "Pure silver backed by PBC-S tokens"
        };
      case "LYD": 
        return { 
          pricePerUnit: 0.207, 
          unit: "LYD", 
          unitLabel: "LYD",
          minAmount: 1,
          description: "Tokenized Libyan Dinar for easy cross-border transfers"
        };
      case "OIL": 
        return { 
          pricePerUnit: 78.20, 
          unit: "barrel", 
          unitLabel: "barrels",
          minAmount: 0.01,
          description: "Tokenized oil contracts backed by real crude oil futures"
        };
      default: 
        return { 
          pricePerUnit: 1, 
          unit: "unit", 
          unitLabel: "units",
          minAmount: 1,
          description: "Digital asset token"
        };
    }
  };

  const assetConfig = getAssetConfig();
  const tokenInfo = getTokenInfo();

  const calculateConversion = () => {
    if (!amount) return { units: 0, usd: 0 };
    
    if (amountType === "usd") {
      const usdAmount = parseFloat(amount);
      const units = usdAmount / assetConfig.pricePerUnit;
      return { units: units, usd: usdAmount };
    } else {
      const units = parseFloat(amount);
      const usd = units * assetConfig.pricePerUnit;
      return { units: units, usd: usd };
    }
  };

  const conversion = calculateConversion();

  const handleConfirm = async () => {
    if (!amount || conversion.usd === 0) return;
    
    setIsConfirming(true);
    
    try {
      // Backend API Integration
      // TODO: Replace with actual Supabase client calls
      // const { data: tradeData } = await supabase
      //   .from('trades')
      //   .insert({
      //     user_id: user.id,
      //     asset_symbol: asset.symbol,
      //     amount: conversion.units,
      //     price_usd: conversion.usd,
      //     trade_type: 'buy',
      //     payment_method: paymentMethod,
      //     status: 'pending'
      //   });
      
      // TODO: Update user wallet balances
      // const { data: walletUpdate } = await supabase
      //   .from('wallet_balances')
      //   .upsert({
      //     user_id: user.id,
      //     asset_symbol: asset.symbol,
      //     balance: currentBalance + conversion.units
      //   });
      
      // Simulate API call with debounced pricing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowToken(true);
      
      toast({
        title: "Purchase Successful!",
        description: `${conversion.units.toFixed(assetConfig.unit === "barrel" ? 3 : 3)} ${assetConfig.unit}${conversion.units !== 1 ? 's' : ''} of ${asset.name} added to your wallet`,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const paymentMethods = [
    { id: "wallet", label: "USD Wallet", icon: Wallet, description: "Instant transfer" },
    { id: "bank", label: "Bank Transfer", icon: Building2, description: "1-2 business days" },
    { id: "card", label: "Debit/Credit Card", icon: CreditCard, description: "Instant (2.9% fee)" },
  ];

  if (showToken) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Purchase Complete
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-green-800 mb-2">
                  You now hold {conversion.units.toFixed(3)} {tokenInfo.name}
                </div>
                <div className="text-sm text-green-600 mb-3">
                  {tokenInfo.fullName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Token minted on Ethereum blockchain
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(tokenInfo.explorer, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Blockchain
              </Button>
              <Button 
                onClick={() => {
                  onClose();
                  setShowToken(false);
                  setAmount("");
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{asset.icon}</span>
            Buy {asset.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Real-time Price Display */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <div className="text-right">
                  <div className="font-bold text-lg">{asset.price}</div>
                  <div className="text-sm text-muted-foreground">
                    ${assetConfig.pricePerUnit.toFixed(asset.symbol === "LYD" ? 3 : 2)}/{assetConfig.unit}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {assetConfig.description}
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label>Amount</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={amountType === "usd" ? "0.00" : `0.${"0".repeat(asset.symbol === "OIL" ? 3 : 3)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={assetConfig.minAmount}
                  step={asset.symbol === "OIL" ? "0.001" : "0.01"}
                  className="text-lg"
                />
              </div>
              <RadioGroup
                value={amountType}
                onValueChange={(value) => setAmountType(value as "usd" | "units")}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="usd" id="usd" />
                  <Label htmlFor="usd" className="text-sm">USD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="units" id="units" />
                  <Label htmlFor="units" className="text-sm">{assetConfig.unitLabel}</Label>
                </div>
              </RadioGroup>
            </div>
            
            {amount && (
              <div className="text-sm text-muted-foreground">
                {amountType === "usd" 
                  ? `≈ ${conversion.units.toFixed(3)} ${assetConfig.unitLabel}`
                  : `≈ $${conversion.usd.toFixed(2)} USD`
                }
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <method.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={method.id} className="font-medium">{method.label}</Label>
                    <div className="text-sm text-muted-foreground">{method.description}</div>
                  </div>
                  {method.id === "card" && (
                    <Badge variant="outline">+2.9%</Badge>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Summary */}
          {amount && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>You will receive:</span>
                    <span className="font-medium">
                      {conversion.units.toFixed(3)} {tokenInfo.name} 
                      <span className="text-muted-foreground ml-1">
                        ({conversion.units.toFixed(3)} {assetConfig.unitLabel})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total cost:</span>
                    <span className="font-medium">${conversion.usd.toFixed(2)}</span>
                  </div>
                  {paymentMethod === "card" && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Processing fee:</span>
                      <span>${(conversion.usd * 0.029).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    Backed by {tokenInfo.fullName} tokens on Ethereum
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirm}
            disabled={!amount || conversion.usd === 0 || isConfirming || parseFloat(amount) < assetConfig.minAmount}
            className="w-full"
            size="lg"
          >
            {isConfirming ? "Processing..." : "Confirm Purchase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyAssetModal;