import Head from 'next/head';
import '../styles/print.module.css';

const LAST_UPDATED = '2025-01-15';

export default function PrivacyPolicy() {
  const title = 'Privacy Policy (Draft) — PBCEx';
  const description = 'Draft Privacy Policy describing data collection and use for PBCEx.';

  return (
    <div className='min-h-screen bg-slate-50'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>
      <main className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <h1 className='text-3xl font-bold text-slate-800'>Privacy Policy (Draft)</h1>
        <p className='text-sm text-slate-500 mt-1 mb-6'>Last updated: {LAST_UPDATED}</p>

        <div className='prose max-w-none'>
          <p>
            This Privacy Policy is a draft for review purposes only and does not constitute legal advice. It
            outlines the types of data the application may collect and how it may be used.
          </p>
          <h2>Data Collection</h2>
          <p>
            We may collect account registration data, usage metrics, and technical diagnostics to improve the service.
          </p>
          <h2>Data Use</h2>
          <p>
            Collected data may be used for authentication, fraud prevention, support, and product improvements.
          </p>
          <h2>Contact</h2>
          <p>
            For privacy-related inquiries, contact support via the app’s help section.
          </p>
        </div>
      </main>
    </div>
  );
}


