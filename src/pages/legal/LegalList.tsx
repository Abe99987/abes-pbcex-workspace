import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
    fetch('/legal/manifest.json', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ManifestItem[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(e => {
        if (!cancelled) setError(`Failed to load legal manifest: ${e.message}`);
      });
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
            <ul className='space-y-3'>
              {items.map(item => (
                <li key={item.slug}>
                  <a
                    className='text-gold hover:underline'
                    href={`/legal/${item.slug}`}
                  >
                    {item.title}
                    {item.lastUpdated ? (
                      <span className='text-muted-foreground text-sm ml-2'>
                        (Updated {item.lastUpdated})
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalList;
