import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Clock,
  Shield,
  Info
} from 'lucide-react';

interface OrderFormProps {
  metalType: string;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  icon: string;
  minimumOrder: string;
  deliveryInfo: string;
}

const OrderForm = ({ 
  metalType, 
  symbol, 
  price, 
  change, 
  isPositive, 
  icon,
  minimumOrder,
  deliveryInfo 
}: OrderFormProps) => {
  const [quantity, setQuantity] = useState('');
  const [format, setFormat] = useState('');
  const [orderType, setOrderType] = useState('buy');

  const formats = {
    gold: ['1oz Coins', '10oz Bars', '1kg Bars', 'Goldbacks'],
    silver: ['1oz Coins', '10oz Bars', '100oz Bars', '1kg Bars'], 
    platinum: ['1oz Coins', '10oz Bars'],
    palladium: ['1oz Coins', '10oz Bars'],
    copper: ['1oz Rounds', '5lb Bars', '10lb Bars']
  };

  const getFormats = () => {
    return formats[metalType as keyof typeof formats] || ['1oz Coins', '10oz Bars'];
  };

  const calculateTotal = () => {
    const numPrice = parseFloat(price.replace(/[$,]/g, ''));
    const qty = parseFloat(quantity) || 0;
    return (numPrice * qty).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <div className='space-y-6'>
      {/* Live Price Card */}
      <Card className='bg-card/50 border-border/50'>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='text-3xl'>{icon}</span>
              <div>
                <CardTitle className='text-xl text-foreground'>
                  {metalType.charAt(0).toUpperCase() + metalType.slice(1)} ({symbol})
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Live Market Price</p>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-2xl font-bold text-primary mb-1'>{price}</div>
              <Badge variant={isPositive ? 'default' : 'destructive'} className='flex items-center gap-1 w-fit ml-auto'>
                {isPositive ? <TrendingUp className='w-3 h-3' /> : <TrendingDown className='w-3 h-3' />}
                {change}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Order Configuration */}
      <Card className='bg-card/50 border-border/50'>
        <CardHeader>
          <CardTitle className='text-foreground'>Configure Your Order</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Order Type Selection */}
          <div className='grid grid-cols-3 gap-2'>
            <Button
              variant={orderType === 'buy' ? 'default' : 'outline'}
              onClick={() => setOrderType('buy')}
              className='flex items-center gap-2'
            >
              <ShoppingCart className='w-4 h-4' />
              Buy
            </Button>
            <Button
              variant={orderType === 'sell' ? 'default' : 'outline'}
              onClick={() => setOrderType('sell')}
              className='flex items-center gap-2'
            >
              <CreditCard className='w-4 h-4' />
              Sell
            </Button>
            <Button
              variant={orderType === 'order' ? 'default' : 'outline'}
              onClick={() => setOrderType('order')}
              className='flex items-center gap-2 bg-black text-white hover:bg-black/90'
            >
              <Truck className='w-4 h-4' />
              Order
            </Button>
          </div>

          {/* Quantity Input */}
          <div className='space-y-2'>
            <Label htmlFor='quantity'>Quantity</Label>
            <Input
              id='quantity'
              type='number'
              placeholder='0.00'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className='text-lg'
            />
            <p className='text-xs text-muted-foreground'>
              Minimum order: {minimumOrder}
            </p>
          </div>

          {/* Format Selection */}
          <div className='space-y-2'>
            <Label htmlFor='format'>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder='Choose format' />
              </SelectTrigger>
              <SelectContent>
                {getFormats().map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Total */}
          {quantity && (
            <div className='p-4 bg-muted/50 rounded-lg border border-border/50'>
              <div className='flex justify-between items-center text-lg font-semibold'>
                <span>Total:</span>
                <span className='text-primary'>{calculateTotal()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Information */}
      <Card className='bg-card/50 border-border/50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-foreground'>
            <Clock className='w-5 h-5' />
            Shipping & Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-start gap-3'>
            <Shield className='w-5 h-5 text-primary mt-0.5' />
            <div>
              <p className='font-medium text-foreground'>Fully Insured Shipping</p>
              <p className='text-sm text-muted-foreground'>
                All orders are fully insured and tracked via FedEx or specialized carriers
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <Truck className='w-5 h-5 text-primary mt-0.5' />
            <div>
              <p className='font-medium text-foreground'>Delivery Timeline</p>
              <p className='text-sm text-muted-foreground'>{deliveryInfo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Button 
          size='lg' 
          className='bg-primary hover:bg-primary/90'
          disabled={!quantity || !format}
        >
          <ShoppingCart className='w-4 h-4 mr-2' />
          Buy Now
        </Button>
        <Button 
          variant='outline' 
          size='lg'
          disabled={!quantity || !format}
        >
          <CreditCard className='w-4 h-4 mr-2' />
          Sell Holdings
        </Button>
        <Button 
          variant='outline' 
          size='lg' 
          className='border-gold text-gold hover:bg-gold/10'
          disabled={!quantity || !format}
        >
          <Truck className='w-4 h-4 mr-2' />
          Order Physical
        </Button>
      </div>

      {/* Disclosure */}
      <Card className='bg-muted/30 border-border/50'>
        <CardContent className='pt-4'>
          <div className='flex items-start gap-3'>
            <Info className='w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0' />
            <div className='text-sm text-muted-foreground space-y-2'>
              <p>
                <strong>Risk Disclosure:</strong> Precious metals and commodities carry market risk. 
                Prices can fluctuate significantly based on market conditions, geopolitical events, 
                and economic factors.
              </p>
              <p>
                <strong>Storage & Delivery:</strong> Physical delivery orders cannot be canceled 
                once processed. Digital tokens can be stored in your PBCEx account or withdrawn 
                to external wallets.
              </p>
              <p>
                <strong>Fees:</strong> Trading fees, storage fees (for digital holdings), and 
                shipping costs (for physical delivery) apply. See fee schedule for details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderForm;