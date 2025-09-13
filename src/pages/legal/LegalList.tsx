import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ManifestItem {
  slug: string;
  title: string;
  lastUpdated?: string | null;
}

const LegalList = () => {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bakedIn: ManifestItem[] = [
      { slug: 'privacy-policy', title: 'Privacy Policy' },
      { slug: 'privacy-choices', title: 'Privacy Choices' },
      { slug: 'accessibility', title: 'Accessibility' },
      { slug: 'esign-consent', title: 'E-SIGN Consent' },
      { slug: 'aml-bsa-program', title: 'AML/BSA Program' },
      { slug: 'ofac-policy', title: 'OFAC Sanctions Policy' },
      { slug: 'dealers-aml-memo', title: 'Dealers AML Memo' },
      { slug: 'record-retention', title: 'Record Retention' },
      { slug: 'refunds-shipping', title: 'Refunds & Shipping' },
      { slug: 'risk-disclosures', title: 'Risk Disclosures' },
      { slug: 'terms-of-service', title: 'Terms of Service' },
    ];

    const summaries: Record<string, string> = {
      'privacy-policy': 'How we collect, use, and protect your data.',
      'privacy-choices': 'Exercise your privacy options and preferences.',
      accessibility: 'Our commitment to accessible services.',
      'esign-consent': 'Consent to electronic delivery and signatures.',
      'aml-bsa-program': 'Anti-money laundering and BSA compliance program.',
      'ofac-policy': 'Sanctions screening and compliance requirements.',
      'dealers-aml-memo': 'AML memo for dealers and vendors.',
      'record-retention': 'Documents and data retention schedules.',
      'refunds-shipping': 'Refunds, returns, and physical shipping policy.',
      'risk-disclosures': 'Important trading and investment risks.',
      'terms-of-service': 'Agreement governing your use of PBCEx.',
    };

    async function tryFetchJSON<T>(url: string): Promise<T | null> {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(url, {
          cache: 'no-cache',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const contentType = (
          res.headers.get('content-type') || ''
        ).toLowerCase();
        if (!contentType.includes('application/json')) return null;
        try {
          return (await res.json()) as T;
        } catch {
          return null;
        }
      } catch {
        return null;
      }
    }

    async function loadManifest() {
      const cacheBuster = Date.now();
      const primaryUrl = `/data/legal-manifest.json?v=${cacheBuster}`;
      const secondaryUrl = `/legal/manifest.json?v=${cacheBuster}`;

      const fromPrimary = await tryFetchJSON<ManifestItem[]>(primaryUrl);
      if (!cancelled && Array.isArray(fromPrimary) && fromPrimary.length) {
        setItems(fromPrimary);
        return;
      }

      const fromSecondary = await tryFetchJSON<ManifestItem[]>(secondaryUrl);
      if (!cancelled && Array.isArray(fromSecondary) && fromSecondary.length) {
        setItems(fromSecondary);
        return;
      }

      if (!cancelled) {
        setError('Live manifest unavailable — using fallback list.');
        setItems(bakedIn);
      }
    }

    loadManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main className='py-16'>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl mx-auto'>
            <h1 className='text-3xl md:text-4xl font-bold mb-6'>Legal</h1>
            <p className='text-muted-foreground mb-8'>
              Policies, disclosures, and terms. Select a document to view.
            </p>
            {error && <div className='mb-6 text-destructive'>{error}</div>}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {items.map(item => (
                <Card
                  key={item.slug}
                  className='hover:shadow-lg transition-shadow'
                >
                  <CardHeader>
                    <CardTitle className='text-xl'>{item.title}</CardTitle>
                    {item.lastUpdated ? (
                      <CardDescription>
                        Updated {item.lastUpdated}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-3'>
                      {(summaries as any)[item.slug] || 'View the full policy.'}
                    </p>
                    <a
                      className='text-primary hover:underline text-sm'
                      href={`/legal/${item.slug}`}
                    >
                      View document →
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalList;
