import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Shield, FileText } from 'lucide-react';

export default function ComplianceHub() {
  const regions = [
    { id: 'us', name: 'United States' },
    { id: 'eu', name: 'EU/EEA & UK' },
    { id: 'mena', name: 'MENA' },
    { id: 'latam', name: 'LATAM & Africa' },
    { id: 'apac', name: 'APAC' },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-secondary/20'>
      <div className='container mx-auto py-12 px-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-4xl font-bold mb-2'>
            Financial Crime & Sanctions
          </h1>
          <p className='text-sm text-muted-foreground mb-6'>
            Last updated: December 2024
          </p>
          <p className='text-lg text-muted-foreground mb-8'>
            Anti-money laundering, sanctions compliance, and financial crime
            prevention policies.
          </p>

          {/* Region Navigation Strip */}
          <div className='flex flex-wrap gap-2 mb-8 p-4 bg-secondary/50 rounded-lg'>
            {regions.map(region => (
              <a
                key={region.id}
                href={`#${region.id}`}
                className='px-4 py-2 bg-background rounded hover:bg-primary/10 transition-colors text-sm font-medium'
              >
                {region.name}
              </a>
            ))}
          </div>

          {/* Region Sections */}
          <div className='space-y-8 mb-12'>
            <Card id='us'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Globe className='h-5 w-5' />
                  United States
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/aml-bsa-program'
                      className='text-primary hover:underline'
                    >
                      AML/BSA Program
                    </Link>{' '}
                    - Comprehensive anti-money laundering and Bank Secrecy Act
                    compliance
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/ofac-policy'
                      className='text-primary hover:underline'
                    >
                      OFAC Sanctions Policy
                    </Link>{' '}
                    - Office of Foreign Assets Control sanctions screening and
                    compliance
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/esign-consent'
                      className='text-primary hover:underline'
                    >
                      E-SIGN Consent
                    </Link>{' '}
                    - Electronic signature and document delivery authorization
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/risk-disclosures'
                      className='text-primary hover:underline'
                    >
                      Risk Disclosures
                    </Link>{' '}
                    - Investment and trading risk notifications
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card id='eu'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Globe className='h-5 w-5' />
                  EU/EEA & UK
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/privacy-policy'
                      className='text-primary hover:underline'
                    >
                      Privacy Policy
                    </Link>{' '}
                    - GDPR compliance and data protection rights
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/record-retention'
                      className='text-primary hover:underline'
                    >
                      Record Retention
                    </Link>{' '}
                    - Document retention schedules per EU regulations
                  </li>
                  <li className='text-sm text-muted-foreground'>
                    Note: Standard Contractual Clauses (SCCs) and adequacy
                    decisions are detailed in the Privacy Policy
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card id='mena'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Globe className='h-5 w-5' />
                  MENA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/aml-bsa-program'
                      className='text-primary hover:underline'
                    >
                      AML/BSA Program
                    </Link>{' '}
                    - Regional AML compliance requirements
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/risk-disclosures'
                      className='text-primary hover:underline'
                    >
                      Risk Disclosures
                    </Link>{' '}
                    - Including commodity and FX risk considerations
                  </li>
                  <li className='text-sm text-muted-foreground'>
                    Note: Sharia-compliant product considerations addressed in
                    specific product terms
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card id='latam'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Globe className='h-5 w-5' />
                  LATAM & Africa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/risk-disclosures'
                      className='text-primary hover:underline'
                    >
                      Risk Disclosures
                    </Link>{' '}
                    - Emerging market and currency risk notifications
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/refunds-shipping'
                      className='text-primary hover:underline'
                    >
                      Refunds & Shipping
                    </Link>{' '}
                    - Physical asset fulfillment and logistics constraints
                  </li>
                  <li className='text-sm text-muted-foreground'>
                    Note: Regional fulfillment constraints may apply for
                    physical precious metals delivery
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card id='apac'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Globe className='h-5 w-5' />
                  APAC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/privacy-policy'
                      className='text-primary hover:underline'
                    >
                      Privacy Policy
                    </Link>{' '}
                    - APAC data protection and privacy requirements
                  </li>
                  <li>
                    •{' '}
                    <Link
                      to='/legal/risk-disclosures'
                      className='text-primary hover:underline'
                    >
                      Risk Disclosures
                    </Link>{' '}
                    - Regional market and regulatory risks
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Canonical Policies Strip */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Canonical Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-4'>
                <Link
                  to='/legal/aml-bsa-program'
                  className='text-primary hover:underline'
                >
                  AML/BSA Program
                </Link>
                <span className='text-muted-foreground'>•</span>
                <Link
                  to='/legal/ofac-policy'
                  className='text-primary hover:underline'
                >
                  OFAC Policy
                </Link>
                <span className='text-muted-foreground'>•</span>
                <Link
                  to='/legal/dealers-aml-memo'
                  className='text-primary hover:underline'
                >
                  Dealers AML Memo
                </Link>
                <span className='text-muted-foreground'>•</span>
                <Link
                  to='/legal'
                  className='font-semibold text-primary hover:underline'
                >
                  See all policies →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
