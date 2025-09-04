import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Shield, FileText, CheckCircle } from 'lucide-react';

const Regulatory = () => {
  const jurisdictions = [
    {
      region: 'United States',
      status: 'Building 50-state MTL network',
      details:
        'Regulated custody for USD/USDC/PAXG through licensed partners. State-by-state money transmitter licensing in progress.',
    },
    {
      region: 'European Union',
      status: 'Targeting MiCA passporting',
      details:
        'Preparing for Markets in Crypto-Assets regulation compliance to enable EU-wide operations.',
    },
    {
      region: 'North America',
      status: 'USMCA trade compliance',
      details:
        'Cross-border trade facilitation via USMCA framework. Brazil/Mexico references for cross-border commodity flows.',
    },
    {
      region: 'Global',
      status: 'Case-by-case licensing',
      details:
        'APAC/MEA expansion through partnerships and jurisdiction-specific licensing as markets develop.',
    },
  ];

  const complianceAreas = [
    {
      icon: Shield,
      title: 'Tokenization & Proof',
      description:
        'Roadmap for 1:1-audited tokens with proof-of-reserves and oracle integration. Current hedging policies ensure synthetic exposure is fully backed.',
    },
    {
      icon: FileText,
      title: 'Bonded Warehouse Approach',
      description:
        'Physical commodities stored in bonded warehouses with full traceability and regulatory compliance for cross-border movements.',
    },
    {
      icon: CheckCircle,
      title: 'Custody Partnerships',
      description:
        'Working with regulated custodians and insured fulfillment partners to ensure customer asset protection.',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-12'>
              <h1 className='text-3xl md:text-4xl font-bold mb-4'>
                Regulatory Framework
              </h1>
              <p className='text-xl text-muted-foreground'>
                PBCEx operates a compliance-first model with custody
                partnerships and internal synthetics, moving toward expanded
                licensing as global markets develop.
              </p>
            </div>

            <Card className='shadow-xl border-border/50 rounded-2xl mb-8'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-3'>
                  <Globe className='w-6 h-6 text-gold' />
                  <span>Global Compliance Strategy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Our regulatory approach prioritizes customer protection and
                  legal compliance across multiple jurisdictions. We build
                  partnerships with licensed entities and maintain transparent
                  operations while pursuing direct licensing opportunities.
                </p>
              </CardContent>
            </Card>

            <div className='space-y-6 mb-12'>
              <h2 className='text-2xl font-bold'>Jurisdiction Map</h2>
              <div className='grid gap-6'>
                {jurisdictions.map(jurisdiction => (
                  <Card
                    key={jurisdiction.region}
                    className='shadow-xl border-border/50 rounded-2xl'
                  >
                    <CardHeader>
                      <CardTitle className='flex items-center justify-between'>
                        <span>{jurisdiction.region}</span>
                        <span className='text-sm font-normal text-muted-foreground bg-gold/10 px-3 py-1 rounded-full'>
                          {jurisdiction.status}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-muted-foreground'>
                        {jurisdiction.details}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className='space-y-6 mb-12'>
              <h2 className='text-2xl font-bold'>Key Compliance Areas</h2>
              <div className='grid md:grid-cols-1 gap-6'>
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
                      <p className='text-muted-foreground'>
                        {area.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className='shadow-xl border-border/50 rounded-2xl'>
              <CardHeader>
                <CardTitle>Regulatory Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <span className='text-muted-foreground'>
                      Initial custody partnerships established
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-gold rounded-full'></div>
                    <span className='text-muted-foreground'>
                      MTL applications filed in key U.S. states
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-gold rounded-full'></div>
                    <span className='text-muted-foreground'>
                      MiCA compliance framework development
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-muted rounded-full'></div>
                    <span className='text-muted-foreground'>
                      Proof-of-reserves system implementation (planned)
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-muted rounded-full'></div>
                    <span className='text-muted-foreground'>
                      Additional regional licenses (in progress)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='mt-12 text-center'>
              <Card className='shadow-xl border-border/50 rounded-2xl bg-gradient-to-r from-gold/10 to-gold-light/10 border-gold/20'>
                <CardContent className='p-8'>
                  <h3 className='text-xl font-semibold mb-4'>
                    Regulatory Updates
                  </h3>
                  <p className='text-muted-foreground mb-6'>
                    Stay informed about our regulatory progress and compliance
                    updates. We believe in transparency and will keep our
                    community informed as we expand into new jurisdictions.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <a href='/support/compliance' className='inline-block'>
                      <button className='px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90'>
                        View Compliance Details
                      </button>
                    </a>
                    <a
                      href='mailto:regulatory@pbcex.com'
                      className='inline-block'
                    >
                      <button className='px-6 py-2 border border-border rounded-lg hover:bg-muted'>
                        Contact Regulatory Team
                      </button>
                    </a>
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

export default Regulatory;
