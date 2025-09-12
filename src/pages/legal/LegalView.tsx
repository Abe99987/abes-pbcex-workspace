import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const LegalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileUrl = useMemo(() => (slug ? `/legal/${slug}.md` : null), [slug]);

  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;
    fetch(fileUrl, { cache: 'no-cache' })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.text();
      })
      .then(text => {
        if (!cancelled) setContent(text);
      })
      .catch(e => {
        if (!cancelled) setError(`Failed to load document: ${e.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main className='py-16'>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl mx-auto'>
            <div className='flex items-start justify-between mb-6'>
              <h1 className='text-3xl md:text-4xl font-bold break-all'>
                {slug
                  ?.split('-')
                  .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(' ')}
              </h1>
              <button
                onClick={handlePrint}
                className='ml-4 px-3 py-2 rounded-md border border-border text-sm hover:bg-muted print:hidden'
              >
                Print
              </button>
            </div>

            {error ? (
              <div className='text-destructive'>{error}</div>
            ) : (
              <pre className='whitespace-pre-wrap leading-7 text-foreground/90 bg-card p-4 rounded-lg border border-border'>
                {content}
              </pre>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalView;
