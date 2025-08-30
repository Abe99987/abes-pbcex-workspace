import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Package,
  Shield,
  Clock,
  AlertTriangle,
  DollarSign,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Branch } from "@/types/branch";
import BranchLocator from './BranchLocator';

interface BuyPhysicalModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    name: string;
    price: string;
    symbol: string;
    icon: string;
  };
}

const BuyPhysicalModal = ({
  isOpen,
  onClose,
  asset,
}: BuyPhysicalModalProps) => {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState('bar');
  const [deliveryMethod, setDeliveryMethod] = useState('ship');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('usd');
  const [priceLockedUntil, setPriceLockedUntil] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    carrier: 'fedex',
  });
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    bankName: '',
  });
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Price lock countdown effect
  useEffect(() => {
    if (priceLockedUntil && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setPriceLockedUntil(null);
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [priceLockedUntil, timeLeft]);

  // Lock price when amount is entered
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && !priceLockedUntil) {
      setPriceLockedUntil(new Date(Date.now() + 10 * 60 * 1000));
      setTimeLeft(600);
    }
  }, [amount, priceLockedUntil]);

  // Mock token balances (in practice, this would come from API)
  const getTokenBalances = () => ({
    AU: 2.5, // Gold
    AG: 100.0, // Silver
    XPT: 1.0, // Platinum
    XPD: 0.5, // Palladium
    XCU: 2.0, // Copper (tons)
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Asset-specific configurations for buying
  const getAssetConfig = () => {
    switch (asset.symbol) {
      case 'AU':
        return {
          unit: 'grams',
          formats: [
            {
              id: 'bar',
              name: 'Gold Bar',
              description:
                'Pure 24k gold bars in standard weights. Lower premium (closer to spot).',
              minAmount: 1.0,
              icon: '🥇',
            },
            {
              id: 'coins',
              name: 'Gold Coins',
              description:
                'American Eagle or Maple Leaf coins. Higher premium (collectability & mint costs).',
              minAmount: 0.1,
              icon: '🪙',
            },
            {
              id: 'goldback',
              name: 'Goldback Notes',
              description: 'Gold-layered currency notes',
              minAmount: 0.05,
              icon: '💵',
            },
          ],
        };
      case 'AG':
        return {
          unit: 'grams',
          formats: [
            {
              id: 'bar',
              name: 'Silver Bar',
              description:
                'Pure .999 silver bars. Lower premium (closer to spot).',
              minAmount: 10.0,
              icon: '🥈',
            },
            {
              id: 'coins',
              name: 'Silver Coins',
              description:
                'American Eagle or Maple Leaf coins. Higher premium (collectability & mint costs).',
              minAmount: 1.0,
              icon: '🪙',
            },
            {
              id: 'rounds',
              name: 'Silver Rounds',
              description: 'Generic silver rounds',
              minAmount: 1.0,
              icon: '⚪',
            },
          ],
        };
      case 'XPT':
        return {
          unit: 'grams',
          formats: [
            {
              id: 'bar',
              name: 'Platinum Bar',
              description:
                'Pure .9995 platinum bars. Lower premium (closer to spot).',
              minAmount: 1.0,
              icon: '⚪',
            },
            {
              id: 'coins',
              name: 'Platinum Coins',
              description:
                'American Eagle platinum coins. Higher premium (collectability & mint costs).',
              minAmount: 0.1,
              icon: '🪙',
            },
          ],
        };
      case 'XPD':
        return {
          unit: 'grams',
          formats: [
            {
              id: 'bar',
              name: 'Palladium Bar',
              description:
                'Pure .9995 palladium bars. Lower premium (closer to spot).',
              minAmount: 1.0,
              icon: '⚫',
            },
            {
              id: 'coins',
              name: 'Palladium Coins',
              description:
                'Canadian Maple Leaf palladium coins. Higher premium (collectability & mint costs).',
              minAmount: 0.1,
              icon: '🪙',
            },
          ],
        };
      case 'XCU':
        return {
          unit: 'tons',
          formats: [
            {
              id: 'ingots',
              name: 'Ingots',
              description: 'High-grade copper ingots',
              minAmount: 1.0,
              icon: '🟤',
            },
            {
              id: 'coils',
              name: 'Coils',
              description: 'Copper wire coils for industrial use',
              minAmount: 1.0,
              icon: '🔄',
            },
            {
              id: 'sheets',
              name: 'Sheets',
              description: 'Flat copper sheets',
              minAmount: 1.0,
              icon: '📄',
            },
          ],
        };
      case 'OIL':
        return {
          unit: 'barrels',
          formats: [
            {
              id: 'delivery',
              name: 'Physical Delivery',
              description: 'Bulk industrial delivery (licensing required)',
              minAmount: 500000,
              icon: '🚛',
            },
          ],
        };
      default:
        return { unit: 'units', formats: [] };
    }
  };

  const assetConfig = getAssetConfig();

  const getBuyBreakdown = () => {
    const units = parseFloat(amount) || 0;

    if (asset.symbol === 'XCU') {
      return `${units.toFixed(3)} tons of ${format === 'ingots' ? 'copper ingots' : format === 'coils' ? 'copper coils' : 'copper sheets'}`;
    } else if (asset.symbol === 'OIL') {
      return `${units.toFixed(0)} barrels of crude oil (OSP)`;
    } else if (asset.symbol === 'AU') {
      if (format === 'bar') {
        return `${units.toFixed(3)}g in gold bars`;
      } else if (format === 'coins') {
        return `${units.toFixed(3)}g in gold coins`;
      } else {
        return `${units.toFixed(3)}g in Goldback notes`;
      }
    } else if (asset.symbol === 'AG') {
      if (format === 'bar') {
        return `${units.toFixed(1)}g in silver bars`;
      } else {
        return `${units.toFixed(1)}g in silver ${format}`;
      }
    } else if (asset.symbol === 'XPT') {
      return `${units.toFixed(3)}g in platinum ${format === 'bar' ? 'bars' : 'coins'}`;
    } else if (asset.symbol === 'XPD') {
      return `${units.toFixed(3)}g in palladium ${format === 'bar' ? 'bars' : 'coins'}`;
    }
    return `${units.toFixed(3)} ${assetConfig.unit}`;
  };

  const handleConfirm = async () => {
    setIsConfirming(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const deliveryText =
      deliveryMethod === 'ship'
        ? `via insured ${address.carrier.toUpperCase()}`
        : `at ${selectedBranch?.name}`;

    const deliveryETA =
      asset.symbol === 'XCU' || asset.symbol === 'OIL'
        ? '3–5 weeks via MRST Shipping'
        : '3–5 business days (domestic), 7–14 business days (international) via FedEx';

    // Handle token burning if PBcex Tokens selected
    if (paymentMethod === 'pbcex-tokens') {
      const tokenBalances = getTokenBalances();
      const requiredAmount = parseFloat(amount) || 0;

      // Find which token to use (for demo, use any available token)
      const availableToken = Object.entries(tokenBalances).find(
        ([_, balance]) => balance >= requiredAmount
      );

      if (availableToken) {
        toast({
          title: 'Order Confirmed!',
          description: `${amount} ${assetConfig.unit} of ${asset.name} will be delivered ${deliveryText}. Payment: ${requiredAmount} PBcex ${availableToken[0]} tokens burned. ETA: ${deliveryETA}`,
        });
      }
    } else {
      toast({
        title: 'Order Confirmed!',
        description: `${amount} ${assetConfig.unit} of ${asset.name} will be delivered ${deliveryText}. ETA: ${deliveryETA}`,
      });
    }

    setIsConfirming(false);
    onClose();
    setStep(1);
    setAmount('');
    setPriceLockedUntil(null);
    setTimeLeft(600);
  };

  const insuranceFee =
    asset.symbol === 'AU' ||
    asset.symbol === 'AG' ||
    asset.symbol === 'XPT' ||
    asset.symbol === 'XPD'
      ? parseFloat(amount) * 0.02 || 0
      : 0; // 2% insurance for precious metals
  const selectedFormat = assetConfig.formats.find(f => f.id === format);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='text-2xl'>{asset.icon}</span>
            Buy {asset.name}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Price Lock Display */}
          {priceLockedUntil && (
            <Card className='border-blue-200 bg-blue-50'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Clock className='w-4 h-4 text-blue-600' />
                    <span className='text-sm font-medium text-blue-800'>
                      Price locked
                    </span>
                  </div>
                  <span className='text-sm font-bold text-blue-800'>
                    Time left: {formatTime(timeLeft)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <>
              {/* Amount Input */}
              <div className='space-y-3'>
                <Label>Amount to Buy ({assetConfig.unit})</Label>
                <Input
                  type='number'
                  placeholder='0.000'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  step={
                    asset.symbol === 'OIL'
                      ? '1000'
                      : asset.symbol === 'XCU'
                        ? '0.1'
                        : '0.01'
                  }
                  className='text-lg'
                />
                <div className='text-sm text-muted-foreground'>
                  {asset.symbol === 'XCU' && 'Minimum Order: 1 ton'}
                  {asset.symbol === 'OIL' && 'Minimum Order: 500,000 barrels'}
                  {(asset.symbol === 'AU' ||
                    asset.symbol === 'AG' ||
                    asset.symbol === 'XPT' ||
                    asset.symbol === 'XPD') &&
                    'Minimum Order: 1 gram'}
                  <br />
                  <span className='text-xs text-muted-foreground'>
                    Prices powered by TradingView (Chainlink added later).
                  </span>
                </div>
              </div>

              {/* Format Selection */}
              <div className='space-y-3'>
                <Label>
                  {asset.symbol === 'XCU' ? 'Choose Format' : 'Select Format'}
                </Label>
                <RadioGroup value={format} onValueChange={setFormat}>
                  {assetConfig.formats.map(fmt => (
                    <div
                      key={fmt.id}
                      className='flex items-center space-x-3 p-4 border rounded-lg'
                    >
                      <RadioGroupItem value={fmt.id} id={fmt.id} />
                      <div className='text-2xl'>{fmt.icon}</div>
                      <div className='flex-1'>
                        <Label htmlFor={fmt.id} className='font-medium'>
                          {fmt.name}
                        </Label>
                        <div className='text-sm text-muted-foreground'>
                          {fmt.description}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Min: {fmt.minAmount} {assetConfig.unit}
                        </div>
                      </div>
                      {fmt.id === 'delivery' && asset.symbol === 'OIL' && (
                        <Badge variant='outline' className='text-xs'>
                          Requires License
                        </Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Special warnings for oil delivery */}
              {asset.symbol === 'OIL' && (
                <Card className='border-l-4 border-l-yellow-500 bg-yellow-50'>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <AlertTriangle className='w-5 h-5 text-yellow-600 mt-0.5' />
                      <div className='text-sm'>
                        <strong className='text-yellow-800'>
                          Oil Delivery Notice
                        </strong>
                        <br />
                        <span className='text-yellow-700'>
                          Physical oil delivery requires special licensing &
                          logistics coordination. Available for bulk industrial
                          clients only (minimum 500,000 barrels). Delivery ETA:
                          3–5 weeks via MRST Shipping.
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Special info for copper */}
              {asset.symbol === 'XCU' && (
                <Card className='border-l-4 border-l-orange-500 bg-orange-50'>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <AlertTriangle className='w-5 h-5 text-orange-600 mt-0.5' />
                      <div className='text-sm'>
                        <strong className='text-orange-800'>
                          Copper Delivery Notice
                        </strong>
                        <br />
                        <span className='text-orange-700'>
                          Delivery ETA: 3–5 weeks via MRST Shipping. Minimum
                          order quantity: 1 ton per format.
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Selection */}
              <div className='space-y-3'>
                <Label>Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <div className='flex items-center space-x-3 p-4 border rounded-lg'>
                    <RadioGroupItem value='pbcex-tokens' id='pbcex-tokens' />
                    <div className='flex-1'>
                      <Label htmlFor='pbcex-tokens' className='font-medium'>
                        PBcex Tokens
                      </Label>
                      <div className='text-sm text-muted-foreground'>
                        Pay with synthetic asset tokens (cross-commodity
                        supported)
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 p-4 border rounded-lg'>
                    <RadioGroupItem value='usd' id='usd' />
                    <div className='flex-1'>
                      <Label htmlFor='usd' className='font-medium'>
                        USD
                      </Label>
                      <div className='text-sm text-muted-foreground'>
                        Pay with US Dollars
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 p-4 border rounded-lg'>
                    <RadioGroupItem value='stablecoins' id='stablecoins' />
                    <div className='flex-1'>
                      <Label htmlFor='stablecoins' className='font-medium'>
                        Stablecoins (USDC/USDT)
                      </Label>
                      <div className='text-sm text-muted-foreground'>
                        Pay with stablecoins
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 p-4 border rounded-lg'>
                    <RadioGroupItem value='paxg' id='paxg' />
                    <div className='flex-1'>
                      <Label htmlFor='paxg' className='font-medium'>
                        PAXG
                      </Label>
                      <div className='text-sm text-muted-foreground'>
                        Pay with PAXG gold tokens
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Token Balance Display for PBcex Tokens */}
              {paymentMethod === 'pbcex-tokens' && (
                <Card className='bg-muted/30'>
                  <CardContent className='p-4'>
                    <div className='text-sm'>
                      <strong>Available Token Balances:</strong>
                      <br />
                      {Object.entries(getTokenBalances()).map(
                        ([token, balance]) => (
                          <div
                            key={token}
                            className='flex justify-between mt-1'
                          >
                            <span>PBcex {token}:</span>
                            <span>
                              {balance} {token === 'XCU' ? 'tons' : 'oz'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                    {parseFloat(amount) > 0 && (
                      <div className='mt-3 pt-3 border-t'>
                        <div className='text-xs text-muted-foreground'>
                          Cross-commodity payment enabled. Any available token
                          can be used.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {amount &&
                selectedFormat &&
                parseFloat(amount) >= selectedFormat.minAmount && (
                  <Card className='bg-muted/30'>
                    <CardContent className='p-4'>
                      <div className='text-sm'>
                        <strong>Order Preview:</strong>
                        <br />
                        {getBuyBreakdown()}
                        {paymentMethod === 'pbcex-tokens' &&
                          parseFloat(amount) > 0 && (
                            <div className='mt-2 pt-2 border-t'>
                              <div className='text-green-700'>
                                Applied credit: {parseFloat(amount)} PBcex
                                tokens → $
                                {(parseFloat(amount) * 2000).toFixed(2)}
                              </div>
                            </div>
                          )}
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
                  !priceLockedUntil
                }
                className='w-full bg-gold hover:bg-gold/90 text-primary-foreground'
                size='lg'
              >
                Continue to Delivery
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Tabs value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='ship' className='flex items-center gap-2'>
                    <Package className='w-4 h-4' />
                    Ship to Me
                  </TabsTrigger>
                  <TabsTrigger
                    value='pickup'
                    className='flex items-center gap-2'
                  >
                    <MapPin className='w-4 h-4' />
                    Branch Pickup
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='ship' className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='street'>Street Address</Label>
                      <Input
                        id='street'
                        value={address.street}
                        onChange={e =>
                          setAddress(prev => ({
                            ...prev,
                            street: e.target.value,
                          }))
                        }
                        placeholder='123 Main St'
                      />
                    </div>
                    <div>
                      <Label htmlFor='city'>City</Label>
                      <Input
                        id='city'
                        value={address.city}
                        onChange={e =>
                          setAddress(prev => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder='New York'
                      />
                    </div>
                    <div>
                      <Label htmlFor='state'>State</Label>
                      <Input
                        id='state'
                        value={address.state}
                        onChange={e =>
                          setAddress(prev => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        placeholder='NY'
                      />
                    </div>
                    <div>
                      <Label htmlFor='zip'>ZIP Code</Label>
                      <Input
                        id='zip'
                        value={address.zip}
                        onChange={e =>
                          setAddress(prev => ({ ...prev, zip: e.target.value }))
                        }
                        placeholder='10001'
                      />
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <Label>Carrier</Label>
                    <RadioGroup
                      value={address.carrier}
                      onValueChange={value =>
                        setAddress(prev => ({ ...prev, carrier: value }))
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='fedex' id='fedex' />
                        <Label htmlFor='fedex'>
                          {asset.symbol === 'XCU' || asset.symbol === 'OIL'
                            ? 'MRST Shipping (3-5 weeks)'
                            : 'FedEx (2-3 business days)'}
                        </Label>
                      </div>
                      {asset.symbol !== 'XCU' && asset.symbol !== 'OIL' && (
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='ups' id='ups' />
                          <Label htmlFor='ups'>UPS (2-3 business days)</Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>

                  <Card className='border-l-4 border-l-blue-500'>
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <Shield className='w-5 h-5 text-blue-500 mt-0.5' />
                        <div className='text-sm'>
                          <strong>
                            Delivery insured by{' '}
                            {asset.symbol === 'XCU' || asset.symbol === 'OIL'
                              ? 'MRST'
                              : 'Dillon Gage'}
                          </strong>
                          <br />
                          Fully tracked & verified with signature required
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='pickup'>
                  <BranchLocator
                    onSelectBranch={setSelectedBranch}
                    selectedBranch={selectedBranch}
                  />
                </TabsContent>
              </Tabs>

              {/* Order Summary */}
              <Separator />
              <div className='space-y-4'>
                <h3 className='font-semibold'>Order Summary</h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Asset:</span>
                    <span>{asset.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Amount:</span>
                    <span>
                      {amount} {assetConfig.unit}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Format:</span>
                    <span>{selectedFormat?.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Delivery:</span>
                    <span>
                      {deliveryMethod === 'ship'
                        ? `${address.carrier.toUpperCase()} to ${address.city || 'Address'}`
                        : selectedBranch?.name || 'Branch Pickup'}
                    </span>
                  </div>
                  {insuranceFee > 0 && (
                    <div className='flex justify-between'>
                      <span>Insurance (2%):</span>
                      <span>${insuranceFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span>Payment Method:</span>
                    <span>
                      {paymentMethod === 'pbcex-tokens'
                        ? 'PBcex Tokens'
                        : paymentMethod === 'usd'
                          ? 'USD'
                          : paymentMethod === 'stablecoins'
                            ? 'USDC/USDT'
                            : 'PAXG'}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between font-semibold'>
                    <span>ETA:</span>
                    <span>
                      {asset.symbol === 'XCU' || asset.symbol === 'OIL'
                        ? '3–5 weeks'
                        : '3–5 business days (domestic)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setStep(1)}
                  className='flex-1'
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={
                    isConfirming ||
                    (deliveryMethod === 'ship' &&
                      (!address.street ||
                        !address.city ||
                        !address.state ||
                        !address.zip)) ||
                    (deliveryMethod === 'pickup' && !selectedBranch)
                  }
                  className='flex-1 bg-gold hover:bg-gold/90 text-primary-foreground'
                  size='lg'
                >
                  {isConfirming ? 'Processing...' : 'Confirm Order'}
                </Button>

                {/* Footer text */}
                <div className='text-xs text-muted-foreground text-center mt-4'>
                  Fulfilled by JM Bullion / Dillon Gage. Shipments insured &
                  tracked.
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyPhysicalModal;
