import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building2, Wallet } from "lucide-react";
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
  const [amountType, setAmountType] = useState<"usd" | "grams">("usd");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Mock real-time price (in practice, this would come from an API)
  const pricePerGram = asset.symbol === "AU" ? 75.50 : 0.85;
  const currentPrice = parseFloat(asset.price.replace(/[$,]/g, ""));

  const calculateConversion = () => {
    if (!amount) return { grams: 0, usd: 0 };
    
    if (amountType === "usd") {
      const usdAmount = parseFloat(amount);
      const grams = usdAmount / pricePerGram;
      return { grams: grams, usd: usdAmount };
    } else {
      const grams = parseFloat(amount);
      const usd = grams * pricePerGram;
      return { grams: grams, usd: usd };
    }
  };

  const conversion = calculateConversion();

  const handleConfirm = async () => {
    if (!amount || conversion.usd === 0) return;
    
    setIsConfirming(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Purchase Successful!",
      description: `${conversion.grams.toFixed(3)}g of ${asset.name} added to your wallet`,
    });
    
    setIsConfirming(false);
    onClose();
    setAmount("");
  };

  const paymentMethods = [
    { id: "wallet", label: "USD Wallet", icon: Wallet, description: "Instant transfer" },
    { id: "bank", label: "Bank Transfer", icon: Building2, description: "1-2 business days" },
    { id: "card", label: "Debit/Credit Card", icon: CreditCard, description: "Instant (2.9% fee)" },
  ];

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
                  <div className="text-sm text-muted-foreground">${pricePerGram.toFixed(2)}/gram</div>
                </div>
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
                  placeholder={amountType === "usd" ? "0.00" : "0.000"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <RadioGroup
                value={amountType}
                onValueChange={(value) => setAmountType(value as "usd" | "grams")}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="usd" id="usd" />
                  <Label htmlFor="usd" className="text-sm">USD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grams" id="grams" />
                  <Label htmlFor="grams" className="text-sm">Grams</Label>
                </div>
              </RadioGroup>
            </div>
            
            {amount && (
              <div className="text-sm text-muted-foreground">
                {amountType === "usd" 
                  ? `≈ ${conversion.grams.toFixed(3)} grams`
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
                    <span className="font-medium">{conversion.grams.toFixed(3)}g {asset.symbol}</span>
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirm}
            disabled={!amount || conversion.usd === 0 || isConfirming}
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