import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, FileText, Eye } from 'lucide-react';

const Disclosures = () => {
  const disclosureLinks = [
    {
      title: 'Privacy Policy',
      href: '/legal/privacy-policy',
      description:
        'How we collect, use, and protect your personal information.',
      icon: Shield,
    },
    {
      title: 'Terms of Service',
      href: '/legal/terms-of-service',
      description: 'Legal terms governing your use of PBCEx services.',
      icon: FileText,
    },
    {
      title: 'Privacy Choices (Do Not Sell/Share)',
      href: '/legal/privacy-choices',
      description: 'Your rights and choices regarding personal data.',
      icon: Eye,
    },
    {
      title: 'Risk Disclosures',
      href: '/legal/risk-disclosures',
      description: 'Important information about trading and product risks.',
      icon: AlertTriangle,
    },
    {
      title: 'E-SIGN Consent',
      href: '/legal/esign-consent',
      description: 'Electronic communications and signature agreements.',
      icon: FileText,
    },
    {
      title: 'Accessibility Statement',
      href: '/legal/accessibility',
      description: 'Our commitment to digital accessibility.',
      icon: Shield,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-16'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-12'>
              <h1 className='text-3xl md:text-4xl font-bold mb-4'>
                Disclosures
              </h1>
              <p className='text-muted-foreground text-lg'>
                Important legal information and policies for PBCEx services.
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-6 mb-8'>
              {disclosureLinks.map(link => {
                const IconComponent = link.icon;
                return (
                  <Card
                    key={link.href}
                    className='hover:shadow-lg transition-shadow'
                  >
                    <CardHeader className='pb-4'>
                      <CardTitle className='flex items-center space-x-3'>
                        <IconComponent className='h-5 w-5 text-gold' />
                        <a
                          href={link.href}
                          className='text-gold hover:underline'
                        >
                          {link.title}
                        </a>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0'>
                      <p className='text-muted-foreground text-sm'>
                        {link.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className='bg-muted/50'>
              <CardContent className='p-6'>
                <p className='text-sm text-muted-foreground'>
                  For questions about these policies or to exercise your privacy
                  rights, contact us at{' '}
                  <a
                    href='mailto:privacy@pbcex.com'
                    className='text-gold hover:underline'
                  >
                    privacy@pbcex.com
                  </a>{' '}
                  or{' '}
                  <a
                    href='mailto:contact@pbcex.com'
                    className='text-gold hover:underline'
                  >
                    contact@pbcex.com
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Disclosures;
