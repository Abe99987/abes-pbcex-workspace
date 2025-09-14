import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Plus, Minus } from 'lucide-react';

const Balances = () => {
  const balances = [
    { asset: 'USD', amount: '12,450.00', value: '$12,450.00', type: 'Funding' },
    { asset: 'USDC', amount: '8,320.00', value: '$8,320.00', type: 'Funding' },
    { asset: 'BTC', amount: '0.185', value: '$12,558.50', type: 'Funding' },
    { asset: 'ETH', amount: '5.2', value: '$17,808.00', type: 'Funding' },
    { asset: 'PAXG', amount: '24.5', value: '$50,182.25', type: 'Trading' },
  ];

  return (
    <div className='min-h-screen bg-background overflow-y-auto'>
      <Navigation />
      
      <div className='container mx-auto px-6 py-8'>
        <div className='max-w-4xl mx-auto space-y-6'>
          <div>
            <h1 className='text-2xl font-bold text-white mb-2'>Balances & Funding</h1>
            <p className='text-gray-400'>Manage your account balances and transfer between funding and trading accounts</p>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            {/* Funding Account */}
            <Card className='bg-gray-900 border-gray-800'>
              <CardHeader>
                <CardTitle className='text-white flex items-center justify-between'>
                  Funding Account
                  <Badge variant='secondary' className='text-xs'>Available for transfer</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {balances.filter(b => b.type === 'Funding').map((balance, index) => (
                  <div key={index} className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
                    <div>
                      <div className='font-medium text-white'>{balance.asset}</div>
                      <div className='text-sm text-gray-400'>{balance.amount} {balance.asset}</div>
                    </div>
                    <div className='text-right'>
                      <div className='font-mono text-white'>{balance.value}</div>
                      <Button size='sm' variant='outline' className='mt-1 h-6 text-xs'>
                        <ArrowUpDown className='w-3 h-3 mr-1' />
                        Transfer
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Trading Account */}
            <Card className='bg-gray-900 border-gray-800'>
              <CardHeader>
                <CardTitle className='text-white flex items-center justify-between'>
                  Trading Account
                  <Badge variant='secondary' className='text-xs'>Active trading balance</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {balances.filter(b => b.type === 'Trading').map((balance, index) => (
                  <div key={index} className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
                    <div>
                      <div className='font-medium text-white'>{balance.asset}</div>
                      <div className='text-sm text-gray-400'>{balance.amount} {balance.asset}</div>
                    </div>
                    <div className='text-right'>
                      <div className='font-mono text-white'>{balance.value}</div>
                      <Button size='sm' variant='outline' className='mt-1 h-6 text-xs'>
                        <ArrowUpDown className='w-3 h-3 mr-1' />
                        Transfer
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Add more assets to trading */}
                <div className='p-3 border-2 border-dashed border-gray-700 rounded-lg text-center'>
                  <Button variant='ghost' size='sm' className='text-gray-400 hover:text-white'>
                    <Plus className='w-4 h-4 mr-1' />
                    Transfer from Funding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className='bg-gray-900 border-gray-800'>
            <CardHeader>
              <CardTitle className='text-white'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Button variant='outline' className='h-12'>
                  <Plus className='w-4 h-4 mr-2' />
                  Deposit Funds
                </Button>
                <Button variant='outline' className='h-12'>
                  <Minus className='w-4 h-4 mr-2' />
                  Withdraw Funds  
                </Button>
                <Button variant='outline' className='h-12'>
                  <ArrowUpDown className='w-4 h-4 mr-2' />
                  Transfer Between Accounts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Balances;