import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpDown,
  Plus,
  Minus,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  EyeOff,
  MoreHorizontal,
} from 'lucide-react';

const Overview = () => {
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);

  // Mock data
  const totalEquity = 125847.32;
  const totalEquityUsd = totalEquity;
  const equityChange = 2.34;
  const isEquityPositive = equityChange > 0;

  const accounts = [
    {
      name: 'Funding Account',
      description: 'Available for deposits and withdrawals',
      totalUsd: 45230.89,
      assets: [
        { symbol: 'USD', amount: '12,450.00', value: 12450.00 },
        { symbol: 'USDC', amount: '8,320.50', value: 8320.50 },
        { symbol: 'BTC', amount: '0.185', value: 12558.79 },
        { symbol: 'ETH', amount: '3.2', value: 11901.60 },
      ]
    },
    {
      name: 'Trading Account (Spot)',
      description: 'Available for trading',
      totalUsd: 80616.43,
      assets: [
        { symbol: 'PAXG', amount: '24.5', value: 50182.25 },
        { symbol: 'XAG', amount: '487.2', value: 12108.12 },
        { symbol: 'BTC', amount: '0.267', value: 18126.06 },
        { symbol: 'USDC', amount: '200.00', value: 200.00 },
      ]
    }
  ];

  const recentTransactions = [
    {
      id: 'tx1',
      type: 'Deposit',
      asset: 'USDC',
      amount: '+5,000.00',
      status: 'Completed',
      time: '2 hours ago',
      isPositive: true,
    },
    {
      id: 'tx2',
      type: 'Trade',
      asset: 'BTC/USDC',
      amount: '+0.025 BTC',
      status: 'Completed',
      time: '4 hours ago',
      isPositive: true,
    },
    {
      id: 'tx3',
      type: 'Transfer',
      asset: 'PAXG',
      amount: '-2.5',
      status: 'Completed',
      time: '1 day ago',
      isPositive: false,
    },
    {
      id: 'tx4',
      type: 'Withdrawal',
      asset: 'USD',
      amount: '-1,000.00',
      status: 'Processing',
      time: '2 days ago',
      isPositive: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Processing':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Account Overview - PBCEx | Balances & Funding</title>
        <meta
          name='description'
          content='View your account balances, manage funding, and track your portfolio performance on PBCEx.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-6'>
        <div className='max-w-7xl mx-auto'>
          
          {/* Left Navigation - Desktop */}
          <div className='hidden lg:block'>
            <div className='flex gap-8'>
              <div className='w-48 flex-shrink-0'>
                <nav className='space-y-1'>
                  <button className='w-full text-left px-3 py-2 text-sm font-medium bg-primary/10 text-primary rounded-md'>
                    Overview
                  </button>
                  <button className='w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md'>
                    Funding
                  </button>
                  <button className='w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md'>
                    Spot
                  </button>
                  <button className='w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md'>
                    Earn
                  </button>
                </nav>
              </div>

              <div className='flex-1 space-y-6'>
                {/* Total Equity Header */}
                <Card className='bg-card/50 border-border/50'>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-6'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <h1 className='text-lg font-medium text-muted-foreground'>Total Equity</h1>
                          <button
                            onClick={() => setShowBalances(!showBalances)}
                            className='text-muted-foreground hover:text-foreground'
                          >
                            {showBalances ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
                          </button>
                        </div>
                        <div className='flex items-baseline gap-3'>
                          {showBalances ? (
                            <>
                              <div className='text-3xl font-bold text-foreground'>
                                ${totalEquityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              <Badge variant={isEquityPositive ? 'default' : 'destructive'} className='flex items-center gap-1'>
                                {isEquityPositive ? <TrendingUp className='w-3 h-3' /> : <TrendingDown className='w-3 h-3' />}
                                {isEquityPositive ? '+' : ''}{equityChange}%
                              </Badge>
                            </>
                          ) : (
                            <div className='text-3xl font-bold text-muted-foreground'>****</div>
                          )}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          ≈ {showBalances ? `${totalEquityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` : '****'}
                        </div>
                      </div>
                      
                      <div className='flex gap-3'>
                        <Button onClick={() => navigate('/deposit')} className='bg-primary hover:bg-primary/90'>
                          <Plus className='w-4 h-4 mr-2' />
                          Deposit
                        </Button>
                        <Button variant='outline' onClick={() => navigate('/send/crypto')}>
                          <Minus className='w-4 h-4 mr-2' />
                          Withdraw
                        </Button>
                        <Button variant='outline' onClick={() => navigate('/balances')}>
                          <ArrowUpDown className='w-4 h-4 mr-2' />
                          Transfer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* My Accounts */}
                <Card className='bg-card/50 border-border/50'>
                  <CardHeader>
                    <CardTitle className='text-foreground flex items-center justify-between'>
                      My Accounts
                      <Button variant='ghost' size='sm'>
                        <RefreshCw className='w-4 h-4' />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {accounts.map((account, index) => (
                      <div key={index} className='p-4 bg-muted/30 rounded-lg border border-border/50'>
                        <div className='flex items-center justify-between mb-3'>
                          <div>
                            <h3 className='font-medium text-foreground'>{account.name}</h3>
                            <p className='text-sm text-muted-foreground'>{account.description}</p>
                          </div>
                          <div className='text-right'>
                            <div className='text-lg font-semibold text-foreground'>
                              {showBalances ? `$${account.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '****'}
                            </div>
                            <Button variant='outline' size='sm' className='mt-1'>
                              <ArrowUpDown className='w-3 h-3 mr-1' />
                              Transfer
                            </Button>
                          </div>
                        </div>
                        
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                          {account.assets.map((asset, assetIndex) => (
                            <div key={assetIndex} className='text-center p-2 bg-background/50 rounded border border-border/30'>
                              <div className='text-xs text-muted-foreground mb-1'>{asset.symbol}</div>
                              <div className='text-sm font-medium text-foreground'>
                                {showBalances ? asset.amount : '****'}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {showBalances ? `$${asset.value.toLocaleString()}` : '****'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className='lg:hidden space-y-6'>
            {/* Mobile Navigation Chips */}
            <div className='flex gap-2 overflow-x-auto pb-2'>
              <Button variant='default' size='sm' className='whitespace-nowrap'>Overview</Button>
              <Button variant='outline' size='sm' className='whitespace-nowrap'>Funding</Button>
              <Button variant='outline' size='sm' className='whitespace-nowrap'>Spot</Button>
              <Button variant='outline' size='sm' className='whitespace-nowrap'>Earn</Button>
            </div>

            {/* Mobile Total Equity */}
            <Card className='bg-card/50 border-border/50'>
              <CardContent className='p-4'>
                <div className='text-center space-y-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-center gap-2'>
                      <h1 className='text-base font-medium text-muted-foreground'>Total Equity</h1>
                      <button onClick={() => setShowBalances(!showBalances)}>
                        {showBalances ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
                      </button>
                    </div>
                    {showBalances ? (
                      <>
                        <div className='text-2xl font-bold text-foreground'>
                          ${totalEquityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <Badge variant={isEquityPositive ? 'default' : 'destructive'}>
                          {isEquityPositive ? '+' : ''}{equityChange}%
                        </Badge>
                      </>
                    ) : (
                      <div className='text-2xl font-bold text-muted-foreground'>****</div>
                    )}
                  </div>
                  
                  <div className='grid grid-cols-3 gap-2'>
                    <Button size='sm' onClick={() => navigate('/deposit')}>
                      <Plus className='w-3 h-3 mr-1' />
                      Deposit
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Minus className='w-3 h-3 mr-1' />
                      Withdraw
                    </Button>
                    <Button variant='outline' size='sm'>
                      <ArrowUpDown className='w-3 h-3 mr-1' />
                      Transfer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Accounts */}
            {accounts.map((account, index) => (
              <Card key={index} className='bg-card/50 border-border/50'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h3 className='font-medium text-foreground'>{account.name}</h3>
                      <p className='text-sm text-muted-foreground'>{account.description}</p>
                    </div>
                    <div className='text-right'>
                      <div className='font-semibold text-foreground'>
                        {showBalances ? `$${account.totalUsd.toLocaleString()}` : '****'}
                      </div>
                      <Button variant='outline' size='sm' className='mt-1'>
                        Transfer
                      </Button>
                    </div>
                  </div>
                  
                  <div className='grid grid-cols-2 gap-2'>
                    {account.assets.map((asset, assetIndex) => (
                      <div key={assetIndex} className='text-center p-2 bg-background/50 rounded'>
                        <div className='text-xs text-muted-foreground'>{asset.symbol}</div>
                        <div className='text-sm font-medium'>{showBalances ? asset.amount : '****'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Transactions - Desktop Right Rail */}
          <div className='hidden lg:block fixed right-6 top-24 w-80'>
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center justify-between text-base'>
                  Recent Transactions
                  <Button variant='ghost' size='sm' onClick={() => navigate('/transactions')}>
                    <ExternalLink className='w-3 h-3' />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 max-h-96 overflow-y-auto'>
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className='flex items-center justify-between p-2 hover:bg-muted/30 rounded'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-sm font-medium text-foreground'>{tx.type}</span>
                        <Badge className={getStatusColor(tx.status)} variant='outline'>
                          {tx.status}
                        </Badge>
                      </div>
                      <div className='text-xs text-muted-foreground'>{tx.asset}</div>
                      <div className='text-xs text-muted-foreground'>{tx.time}</div>
                    </div>
                    <div className={`text-sm font-mono ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions - Mobile */}
          <div className='lg:hidden'>
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center justify-between'>
                  Recent Transactions
                  <Button variant='ghost' size='sm' onClick={() => navigate('/transactions')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {recentTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className='flex items-center justify-between p-2 bg-muted/30 rounded'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-sm font-medium'>{tx.type}</span>
                        <Badge className={getStatusColor(tx.status)} variant='outline'>
                          {tx.status}
                        </Badge>
                      </div>
                      <div className='text-xs text-muted-foreground'>{tx.asset} • {tx.time}</div>
                    </div>
                    <div className={`text-sm font-mono ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;