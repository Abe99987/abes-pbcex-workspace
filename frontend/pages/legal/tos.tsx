import Head from 'next/head';

const LAST_UPDATED = '2025-01-15';

export default function TermsOfService() {
  const title = 'Terms of Service (Draft) — PBCEx';
  const description = 'Draft Terms of Service for PBCEx application, subject to change.';

  return (
    <div className='min-h-screen bg-slate-50'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>
      <main className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <h1 className='text-3xl font-bold text-slate-800'>Terms of Service (Draft)</h1>
        <p className='text-sm text-slate-500 mt-1 mb-6'>Last updated: {LAST_UPDATED}</p>

        <div className='prose max-w-none'>
          <p>
            This Terms of Service document is a draft for review purposes only and does not constitute legal advice.
            By using the PBCEx application, you acknowledge this content is a placeholder and may change.
          </p>
          <h2>Use of Service</h2>
          <p>
            Access to features may be subject to identity verification (KYC), age requirements, and regional limitations.
          </p>
          <h2>Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and all activity under your account.
          </p>
          <h2>Contact</h2>
          <p>
            For questions, contact support via the app or our support channel.
          </p>
        </div>
      </main>
    </div>
  );
}


