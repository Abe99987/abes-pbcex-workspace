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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ASSET_FORMATS } from '@/constants/assetFormats';

interface SellAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    name: string;
    price: string;
    symbol: string;
    icon: string;
  };
}

const SellAssetModal = ({ isOpen, onClose, asset }: SellAssetModalProps) => {
  const [amount, setAmount] = useState('');
  const [convertTo, setConvertTo] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Mock user balances (in practice, this would come from API)
  const getUserBalance = () => {
    switch (asset.symbol) {
      case 'XAU':
        return 15.75;
      case 'XAG':
        return 245.3;
      case 'XPT':
        return 5.25;
      case 'XPD':
        return 2.1;
      case 'XCU':
        return 1.5;
      case 'OIL':
        return 2.5;
      default:
        return 0;
    }
  };

  const getAssetConfig = () => {
    return ASSET_FORMATS[asset.symbol] || { unit: 'units', formats: [] };
  };

  const assetConfig = getAssetConfig();
  const userBalance = getUserBalance();

  // Mock spot prices
  const getSpotPrice = () => {
    switch (asset.symbol) {
      case 'XAU':
        return 2048.5; // per oz -> convert to per gram
      case 'XAG':
        return 24.85;
      case 'XPT':
        return 924.8;
      case 'XPD':
        return 1156.3;
      case 'XCU':
        return 8450.0; // per ton
      case 'OIL':
        return 76.45; // per barrel
      default:
        return 0;
    }
  };

  const calculateEstimate = () => {
    const units = parseFloat(amount) || 0;
    const spotPrice = getSpotPrice();
    let totalValue = 0;

    if (
      asset.symbol === 'XAU' ||
      asset.symbol === 'XAG' ||
      asset.symbol === 'XPT' ||
      asset.symbol === 'XPD'
    ) {
      // Convert troy oz to grams (31.1035g per oz)
      const pricePerGram = spotPrice / 31.1035;
      totalValue = units * pricePerGram;
    } else {
      totalValue = units * spotPrice;
    }

    const fee = totalValue * 0.005; // 0.5% processing fee
    const netProceeds = totalValue - fee;

    return {
      grossValue: totalValue,
      fee: fee,
      netProceeds: netProceeds,
    };
  };

  const estimate = calculateEstimate();

  const handleSell = async () => {
    setIsConfirming(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsConfirming(false);
    setIsSuccess(true);

    setTimeout(() => {
      toast({
        title: 'Sale Completed!',
        description: `${amount} ${assetConfig.unit} of ${asset.name} sold. Proceeds: $${estimate.netProceeds.toFixed(2)} ${convertTo}`,
      });
      onClose();
      setIsSuccess(false);
      setAmount('');
      setConvertTo('');
    }, 2000);
  };

  const resetModal = () => {
    setAmount('');
    setConvertTo('');
    setIsSuccess(false);
    setIsConfirming(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const isValidAmount =
    amount && parseFloat(amount) > 0 && parseFloat(amount) <= userBalance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='text-2xl'>{asset.icon}</span>
            Sell {asset.name}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className='space-y-6 py-8'>
            <Card className='bg-green-50 border-green-200'>
              <CardContent className='p-6 text-center'>
                <CheckCircle className='w-12 h-12 mx-auto mb-4 text-green-600' />
                <h3 className='font-bold text-green-800 mb-2'>
                  Sale Completed!
                </h3>
                <p className='text-green-700 mb-4'>
                  Your {amount} {assetConfig.unit} of {asset.name} has been sold
                  successfully.
                </p>
                <div className='text-lg font-bold text-green-800'>
                  Proceeds: ${estimate.netProceeds.toFixed(2)} {convertTo}
                </div>
                <div className='text-sm text-green-600 mt-2'>
                  {convertTo === 'USD'
                    ? 'Funds will be deposited to your linked bank account within 1-2 business days.'
                    : convertTo === 'USDC/USDT'
                      ? 'Stablecoins will be sent to your wallet address.'
                      : 'PBcex tokens have been credited to your account.'}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Available Balance */}
            <Card className='bg-muted/30'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Available Balance
                  </span>
                  <span className='font-bold text-lg'>
                    {userBalance.toFixed(3)} {assetConfig.unit}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Amount Input */}
            <div className='space-y-3'>
              <Label>Amount to Sell ({assetConfig.unit})</Label>
              <Input
                type='number'
                placeholder='0.000'
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={userBalance}
                step={
                  asset.symbol === 'XCU' || asset.symbol === 'OIL'
                    ? '0.001'
                    : '0.01'
                }
                className='text-lg'
              />
              <div className='text-sm text-muted-foreground'>
                Maximum: {userBalance.toFixed(3)} {assetConfig.unit} available
                <br />
                <span className='text-xs text-muted-foreground'>
                  Prices powered by TradingView (Chainlink added later).
                </span>
              </div>
            </div>

            {/* Convert To Selection */}
            <div className='space-y-3'>
              <Label>Convert To</Label>
              <Select value={convertTo} onValueChange={setConvertTo}>
                <SelectTrigger>
                  <SelectValue placeholder='Select payout method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USD'>USD (Bank Transfer)</SelectItem>
                  <SelectItem value='USDC/USDT'>
                    USDC/USDT (Stablecoins)
                  </SelectItem>
                  <SelectItem value='PBcex Tokens'>PBcex Tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live Estimate */}
            {isValidAmount && convertTo && (
              <Card className='bg-muted/30'>
                <CardContent className='p-4'>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span>Gross Value:</span>
                      <span>${estimate.grossValue.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between text-muted-foreground'>
                      <span>Processing Fee (0.5%):</span>
                      <span>-${estimate.fee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className='flex justify-between font-bold'>
                      <span>Estimated Proceeds:</span>
                      <span>
                        ${estimate.netProceeds.toFixed(2)} {convertTo}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSell}
              disabled={!isValidAmount || !convertTo || isConfirming}
              className='w-full'
              size='lg'
            >
              {isConfirming ? 'Processing Sale...' : 'Sell Now'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SellAssetModal;
