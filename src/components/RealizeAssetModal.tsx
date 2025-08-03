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
import { MapPin, Package, Shield, Clock, AlertTriangle, DollarSign, ExternalLink } from "lucide-react";
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
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    routingNumber: "",
    bankName: ""
  });
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Asset-specific user balances and configurations
  const getAssetConfig = () => {
    switch (asset.symbol) {
      case "AU": 
        return { 
          userBalance: 15.75, 
          unit: "grams", 
          formats: [
            { id: "bar", name: "Gold Bar", description: "Pure 24k gold bars in standard weights", minAmount: 1.0, icon: "🥇" },
            { id: "coins", name: "Gold Coins", description: "American Eagle or Maple Leaf coins", minAmount: 0.1, icon: "🪙" },
            { id: "goldback", name: "Goldback Notes", description: "Gold-layered currency notes", minAmount: 0.05, icon: "💵" }
          ]
        };
      case "AG": 
        return { 
          userBalance: 245.30, 
          unit: "grams", 
          formats: [
            { id: "bar", name: "Silver Bar", description: "Pure .999 silver bars", minAmount: 10.0, icon: "🥈" },
            { id: "coins", name: "Silver Coins", description: "American Eagle or Maple Leaf coins", minAmount: 1.0, icon: "🪙" },
            { id: "rounds", name: "Silver Rounds", description: "Generic silver rounds", minAmount: 1.0, icon: "⚪" }
          ]
        };
      case "LYD": 
        return { 
          userBalance: 1250.00, 
          unit: "LYD", 
          formats: [
            { id: "cash", name: "Physical Cash", description: "Libyan Dinar banknotes", minAmount: 50, icon: "💴" },
            { id: "bank", name: "Bank Transfer", description: "Direct transfer to Libyan bank", minAmount: 100, icon: "🏦" }
          ]
        };
      case "OIL": 
        return { 
          userBalance: 2.5, 
          unit: "barrels", 
          formats: [
            { id: "sell", name: "Sell to Market", description: "Convert back to USD at current price", minAmount: 0.01, icon: "💰" },
            { id: "delivery", name: "Physical Delivery", description: "Bulk industrial delivery (licensing required)", minAmount: 100, icon: "🚛" }
          ]
        };
      default: 
        return { userBalance: 0, unit: "units", formats: [] };
    }
  };

  const assetConfig = getAssetConfig();

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
    const units = parseFloat(amount) || 0;
    
    if (asset.symbol === "LYD") {
      if (format === "cash") {
        const notes50 = Math.floor(units / 50);
        const notes20 = Math.floor((units % 50) / 20);
        const remainder = units % 20;
        return `${notes50 > 0 ? `${notes50}x 50 LYD` : ''}${notes20 > 0 ? ` + ${notes20}x 20 LYD` : ''}${remainder > 0 ? ` + ${remainder} LYD coins` : ''}`;
      } else {
        return `${units.toFixed(2)} LYD bank transfer`;
      }
    } else if (asset.symbol === "OIL") {
      if (format === "sell") {
        return `${units.toFixed(3)} barrels → $${(units * 78.20).toFixed(2)} USD`;
      } else {
        return `${units.toFixed(3)} barrels physical delivery`;
      }
    } else if (asset.symbol === "AU") {
      if (format === "bar") {
        const bars = Math.floor(units);
        const remainder = units - bars;
        return `${bars}x 1g bar${bars !== 1 ? 's' : ''}${remainder > 0 ? ` + ${remainder.toFixed(3)}g note` : ''}`;
      } else if (format === "coins") {
        const coins = Math.floor(units / 0.1);
        const remainder = units - (coins * 0.1);
        return `${coins}x 0.1g coin${coins !== 1 ? 's' : ''}${remainder > 0 ? ` + ${remainder.toFixed(3)}g note` : ''}`;
      } else {
        return `${units.toFixed(3)}g in Goldback notes`;
      }
    } else if (asset.symbol === "AG") {
      if (format === "bar") {
        const bars = Math.floor(units / 10);
        const remainder = units - (bars * 10);
        return `${bars}x 10g bar${bars !== 1 ? 's' : ''}${remainder > 0 ? ` + ${remainder.toFixed(1)}g remainder` : ''}`;
      } else {
        const coins = Math.floor(units);
        return `${coins}x 1g coin${coins !== 1 ? 's' : ''}`;
      }
    }
    return `${units.toFixed(3)} ${assetConfig.unit}`;
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deliveryText = asset.symbol === "LYD" && format === "bank"
      ? "via bank transfer"
      : asset.symbol === "OIL" && format === "sell"
      ? "converted to USD"
      : deliveryMethod === "ship" 
      ? `via insured ${address.carrier.toUpperCase()}`
      : `at ${selectedBranch?.name}`;
    
    toast({
      title: "Realization Confirmed!",
      description: `${amount} ${assetConfig.unit} of ${asset.name} will be ${asset.symbol === "OIL" && format === "sell" ? "sold" : "delivered"} ${deliveryText}`,
    });
    
    setIsConfirming(false);
    onClose();
    setStep(1);
    setAmount("");
  };

  const insuranceFee = (asset.symbol === "AU" || asset.symbol === "AG") ? parseFloat(amount) * 0.02 || 0 : 0; // 2% insurance for precious metals
  const selectedFormat = assetConfig.formats.find(f => f.id === format);

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
                <span className="font-bold text-lg">{assetConfig.userBalance.toFixed(3)} {assetConfig.unit}</span>
              </div>
            </CardContent>
          </Card>

          {step === 1 && (
            <>
              {/* Amount Input */}
              <div className="space-y-3">
                <Label>Amount to Realize ({assetConfig.unit})</Label>
                <Input
                  type="number"
                  placeholder="0.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={assetConfig.userBalance}
                  step={asset.symbol === "OIL" ? "0.001" : "0.01"}
                  className="text-lg"
                />
                <div className="text-sm text-muted-foreground">
                  Maximum: {assetConfig.userBalance.toFixed(3)} {assetConfig.unit} available
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label>
                  {asset.symbol === "LYD" ? "Select Redemption Method" : 
                   asset.symbol === "OIL" ? "Select Action" : "Select Format"}
                </Label>
                <RadioGroup value={format} onValueChange={setFormat}>
                  {assetConfig.formats.map((fmt) => (
                    <div key={fmt.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={fmt.id} id={fmt.id} />
                      <div className="text-2xl">{fmt.icon}</div>
                      <div className="flex-1">
                        <Label htmlFor={fmt.id} className="font-medium">{fmt.name}</Label>
                        <div className="text-sm text-muted-foreground">{fmt.description}</div>
                        <div className="text-xs text-muted-foreground">Min: {fmt.minAmount} {assetConfig.unit}</div>
                      </div>
                      {fmt.id === "delivery" && (
                        <Badge variant="outline" className="text-xs">Requires License</Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Special warnings for oil delivery */}
              {asset.symbol === "OIL" && format === "delivery" && (
                <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <strong className="text-yellow-800">Oil Delivery Notice</strong><br />
                        <span className="text-yellow-700">
                          Physical oil delivery requires special licensing & logistics coordination.
                          Available for bulk industrial clients only (minimum 100 barrels).
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {amount && selectedFormat && parseFloat(amount) >= selectedFormat.minAmount && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <strong>
                        {asset.symbol === "OIL" && format === "sell" ? "Sale" : "Redemption"} Preview:
                      </strong><br />
                      {getRedemptionBreakdown()}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={() => setStep(2)}
                disabled={
                  !amount || 
                  !selectedFormat || 
                  parseFloat(amount) < selectedFormat.minAmount || 
                  parseFloat(amount) > assetConfig.userBalance ||
                  (asset.symbol === "OIL" && format === "sell") // Skip to confirmation for oil sale
                }
                className="w-full"
                size="lg"
              >
                {asset.symbol === "OIL" && format === "sell" ? "Sell to Market" : "Continue to Delivery"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Handle Oil Sale Directly */}
              {asset.symbol === "OIL" && format === "sell" ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="font-bold text-green-800 mb-2">Market Sale Confirmation</h3>
                    <p className="text-green-700 mb-4">
                      Your {amount} barrels of oil will be sold at the current market rate of $78.20 per barrel.
                    </p>
                    <div className="text-lg font-bold text-green-800">
                      You will receive: ${((parseFloat(amount) || 0) * 78.20).toFixed(2)} USD
                    </div>
                  </CardContent>
                </Card>
              ) : (
              /* Standard Delivery Flow */
              <Tabs value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ship" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Ship to Me
                  </TabsTrigger>
                  <TabsTrigger value="pickup" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Branch Pickup
                  </TabsTrigger>
                  {asset.symbol === "LYD" && (
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Bank Transfer
                    </TabsTrigger>
                  )}
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

                {asset.symbol === "LYD" && (
                  <TabsContent value="bank" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                          placeholder="Central Bank of Libya"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                          placeholder="123456789"
                        />
                      </div>
                      <div>
                        <Label htmlFor="routingNumber">SWIFT/Routing Code</Label>
                        <Input
                          id="routingNumber"
                          value={bankDetails.routingNumber}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                          placeholder="CBLYLYTX"
                        />
                      </div>
                    </div>
                    
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="text-sm">
                            <strong>Secure Bank Transfer</strong><br />
                            All transfers are processed through verified Libyan banking networks with full compliance.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
              )}

              {/* Summary */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>
                      {asset.symbol === "OIL" && format === "sell" ? "Oil to sell:" : 
                       `${asset.symbol} to realize:`}
                    </span>
                    <span className="font-medium">{amount} {assetConfig.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {asset.symbol === "LYD" ? "Method:" : "Format:"}
                    </span>
                    <span>{selectedFormat?.name}</span>
                  </div>
                  {insuranceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Insurance fee:</span>
                      <span>${insuranceFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {asset.symbol === "OIL" && format === "sell" ? "Processing time:" : "Delivery estimate:"}
                    </span>
                    <span>
                      {asset.symbol === "OIL" && format === "sell" ? "Instant" :
                       asset.symbol === "LYD" && deliveryMethod === "bank" ? "1-2 business days" :
                       deliveryMethod === "ship" ? "2-3 business days" : "Available immediately"}
                    </span>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <strong>
                      {asset.symbol === "OIL" && format === "sell" ? "Sale Summary:" : "You will receive:"}
                    </strong><br />
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
                    (asset.symbol === "OIL" && format === "sell" ? false :
                     deliveryMethod === "ship" && (!address.street || !address.city || !address.state || !address.zip) ||
                     deliveryMethod === "pickup" && !selectedBranch ||
                     deliveryMethod === "bank" && (!bankDetails.accountNumber || !bankDetails.bankName))
                  }
                  className="flex-1"
                  size="lg"
                >
                  {isConfirming ? "Processing..." : 
                   asset.symbol === "OIL" && format === "sell" ? "Confirm Sale" : "Confirm Realization"}
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