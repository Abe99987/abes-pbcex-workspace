import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Shield,
  Zap,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react';

const ConnectWallet = () => {
  const connectedWallets = [
    {
      name: 'MetaMask',
      type: 'Browser Extension',
      address: '0x1234...5678',
      status: 'Connected',
      balance: '2.456 ETH',
      lastUsed: '2 hours ago',
      network: 'Ethereum Mainnet',
    },
  ];

  const availableWallets = [
    {
      name: 'Magic',
      description: 'Email-based wallet with seamless login experience',
      type: 'Email Wallet',
      icon: '🪄',
      features: ['Email login', 'Social login', 'No seed phrase'],
      popular: true,
    },
    {
      name: 'WalletConnect',
      description: 'Connect your mobile wallet or hardware wallet securely',
      type: 'Protocol',
      icon: '🔗',
      features: ['Mobile wallets', 'Hardware wallets', 'QR code connection'],
      popular: true,
    },
    {
      name: 'Coinbase Wallet',
      description: 'Self-custody wallet from Coinbase',
      type: 'Mobile/Browser',
      icon: '🔵',
      features: ['Multi-chain support', 'DeFi integration', 'NFT support'],
      popular: false,
    },
    {
      name: 'Trust Wallet',
      description: 'Mobile wallet with built-in Web3 browser',
      type: 'Mobile',
      icon: '🛡️',
      features: ['Mobile-first', 'Multi-chain', 'Staking support'],
      popular: false,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Connect Wallet - PBCEx | Link External Wallets</title>
        <meta
          name='description'
          content='Connect your external wallets to PBCEx for seamless trading and portfolio management.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto space-y-8'>
          
          {/* Header */}
          <div className='text-center space-y-4'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <div className='p-3 rounded-full bg-primary/10 border border-primary/20'>
                <Wallet className='w-8 h-8 text-primary' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-foreground'>Connect Wallet</h1>
                <p className='text-muted-foreground mt-1'>
                  Link your external wallets for seamless trading and transfers
                </p>
              </div>
            </div>
          </div>

          {/* Connected Wallets */}
          {connectedWallets.length > 0 && (
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5 text-green-400' />
                  Connected Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {connectedWallets.map((wallet, index) => (
                  <div key={index} className='p-4 bg-muted/30 rounded-lg border border-border/50'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3'>
                        <div className='p-2 rounded-lg bg-green-500/10 border border-green-500/20'>
                          <Wallet className='w-5 h-5 text-green-400' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='font-medium text-foreground'>{wallet.name}</h3>
                            <Badge className='bg-green-500/10 text-green-400 border-green-500/30'>
                              {wallet.status}
                            </Badge>
                          </div>
                          <p className='text-sm text-muted-foreground mb-2'>{wallet.type}</p>
                          <div className='space-y-1 text-sm'>
                            <div className='flex items-center gap-2'>
                              <span className='text-muted-foreground'>Address:</span>
                              <code className='text-foreground font-mono'>{wallet.address}</code>
                              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                                <Copy className='w-3 h-3' />
                              </Button>
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-muted-foreground'>Network:</span>
                              <span className='text-foreground'>{wallet.network}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-muted-foreground'>Balance:</span>
                              <span className='text-foreground font-medium'>{wallet.balance}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-muted-foreground'>Last used:</span>
                              <span className='text-foreground'>{wallet.lastUsed}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm'>
                          Disconnect
                        </Button>
                        <Button variant='ghost' size='sm'>
                          <ExternalLink className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Available Wallets */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>Connect New Wallet</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Choose from popular wallet options to connect to PBCEx
              </p>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {availableWallets.map((wallet, index) => (
                  <div
                    key={index}
                    className='relative p-6 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group cursor-pointer'
                  >
                    {wallet.popular && (
                      <Badge className='absolute top-3 right-3 bg-primary/10 text-primary border-primary/30'>
                        Popular
                      </Badge>
                    )}
                    
                    <div className='flex items-start gap-4'>
                      <div className='text-3xl'>{wallet.icon}</div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-medium text-foreground'>{wallet.name}</h3>
                        </div>
                        <p className='text-sm text-muted-foreground mb-3'>{wallet.description}</p>
                        
                        <div className='space-y-2 mb-4'>
                          <div className='text-xs text-muted-foreground'>Features:</div>
                          <div className='flex flex-wrap gap-1'>
                            {wallet.features.map((feature, featureIndex) => (
                              <Badge
                                key={featureIndex}
                                variant='secondary'
                                className='text-xs bg-background/50'
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          className='w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors'
                          variant='outline'
                        >
                          Connect {wallet.name}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className='bg-muted/30 border-border/50'>
            <CardContent className='p-6'>
              <div className='flex items-start gap-3'>
                <Shield className='w-6 h-6 text-primary mt-0.5' />
                <div className='space-y-3'>
                  <h3 className='font-medium text-foreground'>Security & Privacy</h3>
                  <div className='space-y-2 text-sm text-muted-foreground'>
                    <p>
                      <strong className='text-foreground'>Secure Connection:</strong> All wallet connections use 
                      industry-standard encryption and are never stored on our servers.
                    </p>
                    <p>
                      <strong className='text-foreground'>Read-Only Access:</strong> We only request permission 
                      to view your wallet address and balances. We cannot initiate transactions without your approval.
                    </p>
                    <p>
                      <strong className='text-foreground'>Your Keys, Your Crypto:</strong> PBCEx never has access 
                      to your private keys. You maintain full control of your assets.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>Why Connect Your Wallet?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='text-center space-y-2'>
                  <div className='p-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto'>
                    <Zap className='w-6 h-6 text-primary' />
                  </div>
                  <h4 className='font-medium text-foreground'>Instant Transfers</h4>
                  <p className='text-sm text-muted-foreground'>
                    Move assets between your wallet and PBCEx account instantly
                  </p>
                </div>
                
                <div className='text-center space-y-2'>
                  <div className='p-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto'>
                    <Shield className='w-6 h-6 text-primary' />
                  </div>
                  <h4 className='font-medium text-foreground'>Enhanced Security</h4>
                  <p className='text-sm text-muted-foreground'>
                    Use your wallet for additional transaction verification
                  </p>
                </div>
                
                <div className='text-center space-y-2'>
                  <div className='p-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto'>
                    <Wallet className='w-6 h-6 text-primary' />
                  </div>
                  <h4 className='font-medium text-foreground'>Portfolio Overview</h4>
                  <p className='text-sm text-muted-foreground'>
                    View all your assets in one unified dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;