import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, Globe, Shield, Download } from 'lucide-react';

const Compliance = () => {
  const complianceAreas = [
    {
      icon: FileCheck,
      title: 'KYC/KYB & AML',
      description:
        'All users and suppliers screened; sanctions & export-control checks; supplier KYB for commodity onboarding.',
    },
    {
      icon: Globe,
      title: 'Jurisdiction Strategy',
      description:
        'U.S. state MTL network, EU MiCA passporting, USMCA/NA trade compliance; case-by-case licensing in APAC/MEA with partners.',
    },
    {
      icon: Shield,
      title: 'Tokenization Path & Proof',
      description:
        'Synthetic exposure + hedging now; PBCEx-issued, 1:1-audited tokens as jurisdictions allow; bonded warehouses, insured vaults; proof-of-reserves/oracles on roadmap.',
    },
    {
      icon: Download,
      title: 'Customer Safeguards',
      description:
        '10-minute price locks on realization; insured shipping (FedEx/JM Bullion/Dillon Gage).',
    },
  ];

  const documents = [
    { name: 'Privacy Policy', href: '/legal/privacy-policy' },
    { name: 'Terms of Service', href: '/legal/terms-of-service' },
    { name: 'Licenses', href: '/legal/licenses' },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-12'>
              <h1 className='text-3xl md:text-4xl font-bold mb-4'>
                Global Compliance
              </h1>
              <p className='text-xl text-muted-foreground'>
                PBCEx operates under a comprehensive regulatory framework
                designed for global scale.
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-6 mb-12'>
              {complianceAreas.map(area => (
                <Card
                  key={area.title}
                  className='shadow-xl border-border/50 rounded-2xl'
                >
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center'>
                        <area.icon className='w-5 h-5 text-primary-foreground' />
                      </div>
                      <span>{area.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground'>{area.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className='shadow-xl border-border/50 rounded-2xl'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-3'>
                  <Download className='w-6 h-6 text-gold' />
                  <span>Download Center</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground mb-6'>
                  Access our legal documents and compliance materials.
                </p>
                <div className='grid md:grid-cols-3 gap-4'>
                  {documents.map(doc => (
                    <Button
                      key={doc.name}
                      variant='outline'
                      className='h-auto p-4 flex flex-col items-center space-y-2'
                      onClick={() => (window.location.href = doc.href)}
                    >
                      <FileCheck className='w-6 h-6' />
                      <span className='text-sm'>{doc.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className='mt-12 text-center'>
              <Card className='shadow-xl border-border/50 rounded-2xl bg-gradient-to-r from-gold/10 to-gold-light/10 border-gold/20'>
                <CardContent className='p-8'>
                  <h3 className='text-xl font-semibold mb-4'>
                    Regulatory Excellence
                  </h3>
                  <p className='text-muted-foreground mb-6'>
                    Our compliance-first approach ensures PBCEx can operate
                    safely and legally in markets worldwide, giving customers
                    confidence in every transaction.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <Button
                      onClick={() =>
                        (window.location.href = '/legal/regulatory')
                      }
                    >
                      View Regulatory Details
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() =>
                        (window.location.href = 'mailto:compliance@pbcex.com')
                      }
                    >
                      Contact Compliance Team
                    </Button>
                  </div>
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

export default Compliance;
