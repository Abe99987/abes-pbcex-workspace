import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Phone, Key, AlertTriangle } from 'lucide-react';

const Security = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Core Model Security',
      items: [
        'Funding vs. Trading split to isolate redeemable assets from synthetics',
        'Freeze & Burn controls for internal synthetic tokens (XAU-s, XAG-s, etc.) with admin hardware-key approvals (four-eyes)',
        'PAXG / USD / USDC in regulated custody; insured fulfillment partners',
      ],
    },
    {
      icon: Lock,
      title: 'Wallet Choices',
      items: [
        "Hot vs. Cold Wallets: You can keep assets on-platform for convenience or self-custody via cold wallets (at user's own risk)",
        'If synthetics are compromised, PBCEx can freeze/burn and reissue; real vaulted assets follow real-world finality',
      ],
    },
    {
      icon: Eye,
      title: 'App & Infra Hardening',
      items: [
        'Short-lived JWTs, WAF/rate-limits, principle of least privilege',
        'Idempotency keys, append-only audit ledger, encryption at rest',
        'KMS-sealed secrets, monitoring/alerts',
      ],
    },
    {
      icon: Phone,
      title: '24/7 Support & Incident Response',
      items: [
        '24/7 help center + incident runbooks',
        'Withdrawals from Funding only by design',
      ],
    },
  ];

  const userSecurityTips = [
    'Use hardware security keys when possible',
    'Enable two-factor authentication (OTP)',
    'Create strong, unique passwords',
    'Beware of DM scams and phishing attempts',
    'Never share seed phrases or private keys',
    'Verify all URLs before entering credentials',
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-12'>
              <h1 className='text-3xl md:text-4xl font-bold mb-4'>
                Security at PBCEx
              </h1>
              <p className='text-xl text-muted-foreground'>
                Your assets are protected by enterprise-grade security and
                industry best practices.
              </p>
            </div>

            <div className='space-y-8'>
              {securityFeatures.map(feature => (
                <Card
                  key={feature.title}
                  className='shadow-xl border-border/50 rounded-2xl'
                >
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center'>
                        <feature.icon className='w-5 h-5 text-primary-foreground' />
                      </div>
                      <span>{feature.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-3'>
                      {feature.items.map((item, index) => (
                        <li key={index} className='flex items-start space-x-3'>
                          <div className='w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0'></div>
                          <span className='text-muted-foreground'>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}

              <Card className='shadow-xl border-border/50 rounded-2xl'>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center'>
                      <Key className='w-5 h-5 text-primary-foreground' />
                    </div>
                    <span>What Users Can Do</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid md:grid-cols-2 gap-4'>
                    {userSecurityTips.map((tip, index) => (
                      <div key={index} className='flex items-start space-x-3'>
                        <div className='w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0'></div>
                        <span className='text-muted-foreground'>{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-xl border-border/50 rounded-2xl bg-gradient-to-r from-destructive/10 to-orange-500/10 border-destructive/20'>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-3 mb-4'>
                    <AlertTriangle className='w-6 h-6 text-destructive' />
                    <h3 className='text-lg font-semibold'>
                      Report a Security Issue
                    </h3>
                  </div>
                  <p className='text-muted-foreground mb-4'>
                    If you discover a security vulnerability or suspicious
                    activity, please report it immediately.
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href = 'mailto:security@pbcex.com')
                    }
                    variant='destructive'
                  >
                    Contact Security Team
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Security;
