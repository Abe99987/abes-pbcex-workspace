import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ScaleOrderModal from './ScaleOrderModal';
import { FEATURE_FLAGS } from '@/config/features';

interface OrderPanelProps {
  pair: string;
  settlementAsset?: string;
  settlementMode?: 'usd' | 'usdc' | 'coin';
}

const OrderPanel = ({ pair, settlementAsset, settlementMode = 'usd' }: OrderPanelProps) => {
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(settlementAsset || 'PAXG');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock provider accepted assets
  const mockProviderAssets = ['PAXG', 'XAU-s', 'USD', 'USDC'];

  const handleSubmitOrder = (side: 'buy' | 'sell') => {
    if (!price || !amount) {
      toast({
        title: 'Invalid Order',
        description: 'Please enter both price and amount',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Order Placed',
      description: `${side.toUpperCase()} order for ${amount} ${pair.split('/')[0]} at $${price}`,
    });

    setPrice('');
    setAmount('');
  };

  const total =
    price && amount
      ? (parseFloat(price) * parseFloat(amount)).toFixed(2)
      : '0.00';

  return (
    <div className='h-full bg-black'>
      {/* Header */}
      <div className='p-3 border-b border-gray-800'>
        <h3 className='text-sm font-semibold text-white mb-3'>Place Order</h3>

        {/* Settlement Display */}
        <div className='mb-4'>
          {settlementMode === 'coin' ? (
            <div>
              <Label className='text-gray-300 text-xs mb-2 block'>Settle in:</Label>
              <Select value={selectedSettlement} onValueChange={setSelectedSettlement}>
                <SelectTrigger className='bg-gray-900 border-gray-700 text-white text-sm h-9'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-gray-900 border-gray-700'>
                  <SelectItem value='PAXG' className='text-white hover:bg-gray-800'>PAXG (Gold)</SelectItem>
                  <SelectItem value='XAG' className='text-white hover:bg-gray-800'>XAG (Silver)</SelectItem>
                  <SelectItem value='BTC' className='text-white hover:bg-gray-800'>BTC</SelectItem>
                  <SelectItem value='ETH' className='text-white hover:bg-gray-800'>ETH</SelectItem>
                  <SelectItem value='SOL' className='text-white hover:bg-gray-800'>SOL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className='text-xs text-gray-400'>
              Settling in {settlementMode === 'usd' ? 'USD' : 'USDC'}
            </div>
          )}
        </div>

        {/* Trading Balance Display */}
        <div className='mb-4 p-2 bg-gray-900/50 rounded border border-gray-700'>
          <div className='text-xs text-gray-400 mb-1'>
            Trading balance — {settlementMode === 'coin' ? selectedSettlement : settlementMode === 'usd' ? 'USD' : 'USDC'}:
          </div>
          <div className='text-sm font-mono text-white'>
            {settlementMode === 'usd' ? '$12,450.00' : 
             settlementMode === 'usdc' ? '12,450.00 USDC' : 
             selectedSettlement === 'PAXG' ? '24.5 PAXG' : 
             selectedSettlement === 'BTC' ? '0.185 BTC' : '5.2 ETH'}
          </div>
        </div>

        {/* Order Type Selection */}
        <div className='grid grid-cols-3 gap-1 bg-gray-900 rounded-md p-1 mb-4'>
          <Button
            variant={orderType === 'limit' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setOrderType('limit')}
            className='text-xs h-8'
          >
            Limit
          </Button>
          <Button
            variant={orderType === 'market' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setOrderType('market')}
            className='text-xs h-8'
          >
            Market
          </Button>
          <Button
            variant={orderType === 'scale' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => {
              setOrderType('scale');
              setScaleModalOpen(true);
            }}
            className='text-xs h-8'
          >
            Scale
          </Button>
        </div>

        {/* Direct Fulfill Button */}
        <div className='mb-4'>
          <Button
            disabled
            variant='ghost'
            size='sm'
            className='w-full text-xs h-8 text-gray-500 border border-gray-700 hover:bg-gray-800'
            title='Only available for 100-ton+ wholesale commodity trades'
          >
            Direct Fill
          </Button>
        </div>
      </div>

      <div className='p-3 space-y-3'>
        {/* Provider Accepts Pills */}
        {FEATURE_FLAGS.providerMarketplaceMock && orderType !== 'scale' && (
          <div className='mb-4'>
            <Label className='text-gray-300 text-xs'>Provider accepts:</Label>
            <div className='flex flex-wrap gap-1 mt-1'>
              {mockProviderAssets.map(asset => (
                <Badge key={asset} variant='secondary' className='text-xs'>
                  {asset}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Source of funds selector */}
        {orderType !== 'scale' && (
          <div>
            <Label className='text-gray-300 text-xs mb-2 block'>
              Source of funds
            </Label>
            
            {/* Trading Balances Summary */}
            <div className='p-2 bg-gray-900/50 rounded border border-gray-700 mb-2 text-xs'>
              <div className='text-gray-400 mb-1'>Trading balances:</div>
              <div className='flex flex-wrap gap-2'>
                <span className={`${settlementMode === 'usd' || (settlementMode === 'coin' && selectedSettlement === 'USD') ? 'text-yellow-400' : 'text-gray-300'}`}>
                  USD $12,450
                </span>
                <span className='text-gray-500'>•</span>
                <span className={`${settlementMode === 'usdc' || (settlementMode === 'coin' && selectedSettlement === 'USDC') ? 'text-yellow-400' : 'text-gray-300'}`}>
                  USDC 12,450
                </span>
              </div>
            </div>
            
            {/* Transfer Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/balances')}
              className='w-full text-xs h-8 border-gray-600 hover:bg-gray-800'
            >
              Transfer from Funding
            </Button>
          </div>
        )}

        {/* Price Input */}
        {orderType !== 'market' && orderType !== 'scale' && (
          <div>
            <Label htmlFor='price' className='text-gray-300 text-xs'>
              Price (USD)
            </Label>
            <Input
              id='price'
              type='number'
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder='2,380.50'
              className='mt-1 bg-gray-900 border-gray-700 text-white text-sm h-9'
            />
          </div>
        )}

        {/* Amount Input */}
        {orderType !== 'scale' && (
          <div>
            <div className='flex justify-between items-center mb-1'>
              <Label htmlFor='amount' className='text-gray-300 text-xs'>
                Amount (grams)
              </Label>
              <div className='flex space-x-1'>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-xs h-5 px-1 text-gray-400'
                >
                  25%
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-xs h-5 px-1 text-gray-400'
                >
                  50%
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-xs h-5 px-1 text-gray-400'
                >
                  75%
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-xs h-5 px-1 text-gray-400'
                >
                  Max
                </Button>
              </div>
            </div>
            <Input
              id='amount'
              type='number'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder='0.00'
              className='bg-gray-900 border-gray-700 text-white text-sm h-9'
            />
          </div>
        )}

        {/* Advanced Options */}
        {orderType !== 'scale' && (
          <div>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs text-gray-400 hover:text-white p-0 h-6'
            >
              + Set Take Profit / Stop Loss
            </Button>
          </div>
        )}

        {/* Total */}
        {orderType !== 'scale' && (
          <div className='p-2 bg-gray-900 rounded border border-gray-700'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-400 text-xs'>Total:</span>
              <span className='text-white font-mono text-sm'>${total}</span>
            </div>
          </div>
        )}

        {/* Buy/Sell Buttons */}
        {orderType !== 'scale' && (
          <div className='space-y-2'>
            <Button
              onClick={() => handleSubmitOrder('buy')}
              className='w-full bg-green-600 hover:bg-green-700 text-white font-medium h-10'
              disabled={!amount || (!price && orderType === 'limit')}
            >
              Buy {pair.split('/')[0]}
            </Button>
            <Button
              onClick={() => handleSubmitOrder('sell')}
              className='w-full bg-red-600 hover:bg-red-700 text-white font-medium h-10'
              disabled={!amount || (!price && orderType === 'limit')}
            >
              Sell {pair.split('/')[0]}
            </Button>
          </div>
        )}

        {/* Scale Order Message */}
        {orderType === 'scale' && (
          <div className='text-center py-8'>
            <p className='text-gray-400 text-sm mb-2'>Scale Order Mode</p>
            <p className='text-xs text-gray-500'>
              Configure your scale order in the modal above
            </p>
          </div>
        )}
      </div>

      {/* Balance Info */}
      <div className='p-3 border-t border-gray-800 bg-gray-900/50'>
        <div className='space-y-1 text-xs'>
          <div className='flex justify-between'>
            <span className='text-gray-400'>Available USD:</span>
            <span className='text-white font-mono'>$12,450.00</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-400'>Available Gold:</span>
            <span className='text-gold font-mono'>24.5g</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-400'>Buying Power:</span>
            <span className='text-green-400 font-mono'>$12,450.00</span>
          </div>
        </div>
      </div>

      {/* Scale Order Modal */}
      <ScaleOrderModal
        isOpen={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
        pair={pair}
      />
    </div>
  );
};

export default OrderPanel;
