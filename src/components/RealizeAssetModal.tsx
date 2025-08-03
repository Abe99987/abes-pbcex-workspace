import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Package, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BranchLocator from "./BranchLocator";

interface RealizeAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    name: string;
    price: string;
    symbol: string;
    icon: string;
  };
}

const RealizeAssetModal = ({ isOpen, onClose, asset }: RealizeAssetModalProps) => {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState("bar");
  const [deliveryMethod, setDeliveryMethod] = useState("ship");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    carrier: "fedex"
  });
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Mock user balance
  const userBalance = 15.75; // grams

  const formats = [
    {
      id: "bar",
      name: "Gold Bar",
      description: "Pure 24k gold bars in standard weights",
      minAmount: 1.0,
      icon: "🥇"
    },
    {
      id: "coins",
      name: "Gold Coins",
      description: "American Eagle or Maple Leaf coins",
      minAmount: 0.1,
      icon: "🪙"
    },
    {
      id: "goldback",
      name: "Goldback Notes",
      description: "Gold-layered currency notes",
      minAmount: 0.05,
      icon: "💵"
    }
  ];

  const getRedemptionBreakdown = () => {
    const grams = parseFloat(amount) || 0;
    if (format === "bar") {
      const bars = Math.floor(grams);
      const remainder = grams - bars;
      return `${bars}x 1g bar${bars !== 1 ? 's' : ''}${remainder > 0 ? ` + ${remainder.toFixed(3)}g note` : ''}`;
    } else if (format === "coins") {
      const coins = Math.floor(grams / 0.1);
      const remainder = grams - (coins * 0.1);
      return `${coins}x 0.1g coin${coins !== 1 ? 's' : ''}${remainder > 0 ? ` + ${remainder.toFixed(3)}g note` : ''}`;
    } else {
      return `${grams.toFixed(3)}g in Goldback notes`;
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deliveryText = deliveryMethod === "ship" 
      ? `via insured ${address.carrier.toUpperCase()}`
      : `at ${selectedBranch?.name}`;
    
    toast({
      title: "Realization Confirmed!",
      description: `${amount}g of ${asset.name} will be delivered ${deliveryText}`,
    });
    
    setIsConfirming(false);
    onClose();
    setStep(1);
    setAmount("");
  };

  const insuranceFee = parseFloat(amount) * 0.02 || 0; // 2% insurance
  const selectedFormat = formats.find(f => f.id === format);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{asset.icon}</span>
            Realize {asset.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Display */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <span className="font-bold text-lg">{userBalance.toFixed(3)}g</span>
              </div>
            </CardContent>
          </Card>

          {step === 1 && (
            <>
              {/* Amount Input */}
              <div className="space-y-3">
                <Label>Amount to Realize (grams)</Label>
                <Input
                  type="number"
                  placeholder="0.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={userBalance}
                  step="0.001"
                  className="text-lg"
                />
                <div className="text-sm text-muted-foreground">
                  Maximum: {userBalance.toFixed(3)}g available
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label>Select Format</Label>
                <RadioGroup value={format} onValueChange={setFormat}>
                  {formats.map((fmt) => (
                    <div key={fmt.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={fmt.id} id={fmt.id} />
                      <div className="text-2xl">{fmt.icon}</div>
                      <div className="flex-1">
                        <Label htmlFor={fmt.id} className="font-medium">{fmt.name}</Label>
                        <div className="text-sm text-muted-foreground">{fmt.description}</div>
                        <div className="text-xs text-muted-foreground">Min: {fmt.minAmount}g</div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {amount && selectedFormat && parseFloat(amount) >= selectedFormat.minAmount && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <strong>Redemption Preview:</strong><br />
                      {getRedemptionBreakdown()}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={() => setStep(2)}
                disabled={!amount || !selectedFormat || parseFloat(amount) < selectedFormat.minAmount || parseFloat(amount) > userBalance}
                className="w-full"
                size="lg"
              >
                Continue to Delivery
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Delivery Method */}
              <Tabs value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ship" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Ship to Me
                  </TabsTrigger>
                  <TabsTrigger value="pickup" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Branch Pickup
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ship" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={address.street}
                        onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={address.state}
                        onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={address.zip}
                        onChange={(e) => setAddress(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Carrier</Label>
                    <RadioGroup 
                      value={address.carrier} 
                      onValueChange={(value) => setAddress(prev => ({ ...prev, carrier: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fedex" id="fedex" />
                        <Label htmlFor="fedex">FedEx (2-3 business days)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ups" id="ups" />
                        <Label htmlFor="ups">UPS (2-3 business days)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="text-sm">
                          <strong>Delivery insured by Dillon Gage</strong><br />
                          Fully tracked & verified with signature required
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pickup">
                  <BranchLocator onSelectBranch={setSelectedBranch} selectedBranch={selectedBranch} />
                </TabsContent>
              </Tabs>

              {/* Summary */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Gold to realize:</span>
                    <span className="font-medium">{amount}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Format:</span>
                    <span>{selectedFormat?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Insurance fee:</span>
                    <span>${insuranceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Delivery estimate:
                    </span>
                    <span>{deliveryMethod === "ship" ? "2-3 business days" : "Available immediately"}</span>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <strong>You will receive:</strong><br />
                    {getRedemptionBreakdown()}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={
                    isConfirming || 
                    (deliveryMethod === "ship" && (!address.street || !address.city || !address.state || !address.zip)) ||
                    (deliveryMethod === "pickup" && !selectedBranch)
                  }
                  className="flex-1"
                  size="lg"
                >
                  {isConfirming ? "Processing..." : "Confirm Realization"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealizeAssetModal;