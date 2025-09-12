import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, PenTool, AlertTriangle } from 'lucide-react';

export default function TermsRiskHub() {
  const termsDocs = [
    {
      title: 'Terms of Service',
      description:
        'The legal agreement governing your use of PBCEx services and platform',
      href: '/legal/terms-of-service',
      icon: FileText,
    },
    {
      title: 'E-SIGN Consent',
      description:
        'Authorization for electronic signatures and digital document delivery',
      href: '/legal/esign-consent',
      icon: PenTool,
    },
    {
      title: 'Risk Disclosures',
      description:
        'Important information about investment, trading, and market risks',
      href: '/legal/risk-disclosures',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-secondary/20'>
      <div className='container mx-auto py-12 px-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-4xl font-bold mb-4'>Terms, Consent & Risk</h1>
          <p className='text-lg text-muted-foreground mb-8'>
            Essential agreements and disclosures that govern your use of PBCEx
            services and inform you of associated risks.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
            {termsDocs.map(doc => {
              const Icon = doc.icon;
              return (
                <Card
                  key={doc.href}
                  className='hover:shadow-lg transition-shadow'
                >
                  <CardHeader>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Icon className='h-5 w-5 text-primary' />
                      <Link to={doc.href} className='hover:underline'>
                        <CardTitle className='text-xl'>{doc.title}</CardTitle>
                      </Link>
                    </div>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      to={doc.href}
                      className='text-primary hover:underline text-sm'
                    >
                      View document →
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className='mt-8'>
            <Link
              to='/legal'
              className='text-primary underline hover:no-underline'
            >
              View All Legal Documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
