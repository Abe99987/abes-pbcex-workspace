import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  Settings,
  Plus,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';

const MyCards = () => {
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [defaultSpendAsset, setDefaultSpendAsset] = useState('USDC');

  // Mock card data
  const cards = [
    {
      id: '1',
      name: 'PBCEx Gold Card',
      number: '4532 **** **** 1234',
      fullNumber: '4532 1234 5678 1234',
      type: 'Virtual',
      status: 'Active',
      spendAsset: 'USDC',
      monthlyLimit: 10000,
      spent: 2847.50,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      id: '2',
      name: 'PBCEx Silver Card',
      number: '4532 **** **** 5678',
      fullNumber: '4532 1234 5678 5678',
      type: 'Virtual',
      status: 'Active',
      spendAsset: 'BTC',
      monthlyLimit: 5000,
      spent: 1234.25,
      color: 'from-gray-400 to-gray-500',
    },
    {
      id: '3',
      name: 'PBCEx Physical Card',
      number: '4532 **** **** 9012',
      fullNumber: '4532 1234 5678 9012',
      type: 'Physical',
      status: 'Ordered',
      spendAsset: 'USDC',
      monthlyLimit: 15000,
      spent: 0,
      color: 'from-blue-500 to-blue-600',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>My Cards - PBCEx | Manage Your Payment Cards</title>
        <meta
          name='description'
          content='Manage your PBCEx payment cards, set spending limits, and configure default spend assets.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto space-y-8'>
          
          {/* Header */}
          <div className='flex justify-between items-start'>
            <div>
              <h1 className='text-3xl font-bold text-foreground mb-2'>My Cards</h1>
              <p className='text-muted-foreground'>Manage your payment cards and spending preferences</p>
            </div>
            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Request New Card
            </Button>
          </div>

          {/* Settings Section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                  <Settings className='w-5 h-5' />
                  Card Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>Show Card Numbers</p>
                    <p className='text-xs text-muted-foreground'>Display full card numbers instead of masked</p>
                  </div>
                  <Switch 
                    checked={showCardNumbers}
                    onCheckedChange={setShowCardNumbers}
                  />
                </div>
                
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-foreground'>Default Spend Asset</label>
                  <Select value={defaultSpendAsset} onValueChange={setDefaultSpendAsset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='USDC'>USDC</SelectItem>
                      <SelectItem value='BTC'>Bitcoin (BTC)</SelectItem>
                      <SelectItem value='ETH'>Ethereum (ETH)</SelectItem>
                      <SelectItem value='GOLD'>Gold Token (GOLD)</SelectItem>
                      <SelectItem value='SILVER'>Silver Token (SILVER)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Used when Smart Spend is disabled
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                  <Shield className='w-5 h-5' />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>Transaction Notifications</p>
                    <p className='text-xs text-muted-foreground'>Get notified for all card transactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>Spending Alerts</p>
                    <p className='text-xs text-muted-foreground'>Alert when approaching monthly limits</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>International Transactions</p>
                    <p className='text-xs text-muted-foreground'>Allow purchases outside your country</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards List */}
          <div className='space-y-6'>
            <h2 className='text-xl font-semibold text-foreground'>Your Cards</h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {cards.map((card) => (
                <Card key={card.id} className='bg-card/50 border-border/50 overflow-hidden'>
                  {/* Card Visual */}
                  <div className={`h-32 bg-gradient-to-r ${card.color} p-4 text-white relative`}>
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <p className='text-xs opacity-75'>PBCEx</p>
                        <p className='text-sm font-medium'>{card.name}</p>
                      </div>
                      <Badge 
                        variant={card.status === 'Active' ? 'default' : 'secondary'}
                        className='text-xs'
                      >
                        {card.status}
                      </Badge>
                    </div>
                    
                    <div className='absolute bottom-4 left-4 right-4'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-mono'>
                          {showCardNumbers ? card.fullNumber : card.number}
                        </p>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 text-white hover:bg-white/20'
                          onClick={() => setShowCardNumbers(!showCardNumbers)}
                        >
                          {showCardNumbers ? (
                            <EyeOff className='w-3 h-3' />
                          ) : (
                            <Eye className='w-3 h-3' />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <CardContent className='p-4 space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Type</span>
                      <span className='text-foreground'>{card.type}</span>
                    </div>
                    
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Spend Asset</span>
                      <div className='flex items-center gap-1'>
                        <DollarSign className='w-3 h-3' />
                        <span className='text-foreground'>{card.spendAsset}</span>
                      </div>
                    </div>
                    
                    <div className='space-y-1'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Monthly Spend</span>
                        <span className='text-foreground'>
                          ${card.spent.toLocaleString()} / ${card.monthlyLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className='w-full bg-muted rounded-full h-1.5'>
                        <div 
                          className='bg-primary h-1.5 rounded-full transition-all'
                          style={{ width: `${(card.spent / card.monthlyLimit) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className='flex gap-2 pt-2'>
                      <Button variant='outline' size='sm' className='flex-1'>
                        Manage
                      </Button>
                      {card.status === 'Active' && (
                        <Button variant='outline' size='sm' className='flex-1'>
                          Freeze
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Footer Disclosure */}
          <div className='text-xs text-muted-foreground text-center pt-8 border-t border-border'>
            <p>
              Cards are issued by licensed banking partners. Card transactions are subject to network fees and conversion rates. 
              International transactions may incur additional charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCards;