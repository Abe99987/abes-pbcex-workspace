import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Shield,
  Wallet,
  AlertTriangle,
  Coins,
  Lock,
  Smartphone,
} from 'lucide-react';

const DigitalWallet = () => {
  const features = [
    {
      icon: <Coins className='w-8 h-8 text-gold' />,
      title: 'Synthetic vs. Real Assets',
      description:
        'Users hold synthetic tokens (XAU-s, XAG-s, etc.) for fast trading, fully hedge-backed and replaceable. If accounts are hacked, synthetics can be frozen and reissued; but with vaulted real assets, ownership is final — just like physical gold.',
    },
    {
      icon: <Lock className='w-8 h-8 text-silver' />,
      title: 'Hot & Cold Wallets',
      description:
        'Users can self-custody with cold wallets (e.g. MagicBlock or similar hardware), or keep balances in-platform for convenience and instant trading access.',
    },
    {
      icon: <AlertTriangle className='w-8 h-8 text-destructive' />,
      title: 'Freeze & Burn',
      description:
        'PBCEx can freeze synthetics in emergencies, burn compromised tokens, and reissue balances to protect users from theft and fraud while maintaining the integrity of the system.',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-6xl mx-auto'>
            {/* Hero Section */}
            <div className='text-center mb-16'>
              <div className='w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-gold-light rounded-2xl flex items-center justify-center'>
                <Wallet className='w-8 h-8 text-primary-foreground' />
              </div>
              <h1 className='text-4xl md:text-5xl font-bold mb-6'>
                Digital Wallet
              </h1>
              <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
                Hold, trade, and manage real assets digitally with
                institutional-grade security and instant liquidity.
              </p>
            </div>

            {/* Features Grid */}
            <div className='grid md:grid-cols-3 gap-8 mb-16'>
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className='border-border/50 bg-card/50 backdrop-blur-sm'
                >
                  <CardHeader>
                    <div className='mb-4'>{feature.icon}</div>
                    <CardTitle className='text-xl'>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className='text-base leading-relaxed'>
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Sections */}
            <div className='space-y-12'>
              {/* Security Features */}
              <div className='grid md:grid-cols-2 gap-12 items-center'>
                <div>
                  <div className='flex items-center space-x-3 mb-6'>
                    <Shield className='w-8 h-8 text-gold' />
                    <h2 className='text-2xl font-bold'>Security First</h2>
                  </div>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>
                      Your digital wallet combines the best of traditional
                      banking security with blockchain innovation.
                      Multi-signature authentication, hardware wallet support,
                      and institutional-grade custody options ensure your assets
                      are always protected.
                    </p>
                    <p>
                      Unlike traditional crypto wallets, PBCEx wallets are
                      backed by real, physical assets stored in insured vaults
                      worldwide. Every synthetic token represents a claim on
                      actual commodities.
                    </p>
                  </div>
                </div>
                <Card className='bg-gradient-to-br from-muted/20 to-muted/5 border-gold/20'>
                  <CardContent className='p-8'>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 bg-background/50 rounded-lg'>
                        <span className='font-medium'>
                          XAU-s (Synthetic Gold)
                        </span>
                        <span className='text-gold font-bold'>24.5g</span>
                      </div>
                      <div className='flex items-center justify-between p-4 bg-background/50 rounded-lg'>
                        <span className='font-medium'>
                          XAG-s (Synthetic Silver)
                        </span>
                        <span className='text-silver font-bold'>156.2g</span>
                      </div>
                      <div className='flex items-center justify-between p-4 bg-background/50 rounded-lg'>
                        <span className='font-medium'>USD Balance</span>
                        <span className='font-bold'>$12,450.00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Multi-Platform Access */}
              <div className='grid md:grid-cols-2 gap-12 items-center'>
                <Card className='bg-gradient-to-br from-muted/20 to-muted/5 border-silver/20 md:order-2'>
                  <CardContent className='p-8'>
                    <div className='text-center'>
                      <Smartphone className='w-16 h-16 mx-auto mb-4 text-silver' />
                      <h3 className='text-xl font-semibold mb-2'>
                        Available Everywhere
                      </h3>
                      <p className='text-muted-foreground'>
                        Access your wallet from web, mobile, or hardware devices
                        with seamless synchronization across all platforms.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <div className='md:order-1'>
                  <h2 className='text-2xl font-bold mb-6'>
                    Access Your Assets Anywhere
                  </h2>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>
                      Your PBCEx wallet works across all devices and platforms.
                      Whether you're trading on desktop, making payments on
                      mobile, or securing assets with hardware wallets, your
                      experience is consistent and secure.
                    </p>
                    <p>
                      Real-time synchronization ensures your balances and
                      transaction history are always up-to-date, while offline
                      capabilities let you view balances and prepare
                      transactions even without internet access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DigitalWallet;
