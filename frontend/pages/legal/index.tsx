import Head from 'next/head';
import Link from 'next/link';

const LAST_UPDATED = '2025-01-15';

export default function LegalHub() {
  const title = 'Legal Hub — PBCEx';
  const description =
    'Draft legal hub for Terms, Privacy, Risk Disclosures, and Supported Regions.';

  return (
    <div className='min-h-screen bg-slate-50'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>

      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <h1 className='text-3xl font-bold text-slate-800 mb-2'>
          Legal Hub (Draft)
        </h1>
        <p className='text-sm text-slate-500 mb-6'>
          Last updated: {LAST_UPDATED}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Link
            href='/legal/tos'
            className='block p-6 bg-white border rounded-lg hover:shadow-sm'
          >
            <h2 className='text-xl font-semibold text-slate-800'>
              Terms of Service
            </h2>
            <p className='text-slate-600 mt-2'>
              Draft terms governing usage of the PBCEx application.
            </p>
          </Link>
          <Link
            href='/legal/privacy'
            className='block p-6 bg-white border rounded-lg hover:shadow-sm'
          >
            <h2 className='text-xl font-semibold text-slate-800'>
              Privacy Policy
            </h2>
            <p className='text-slate-600 mt-2'>
              Draft policy describing data collection and usage.
            </p>
          </Link>
          <Link
            href='/legal/risk-disclosures'
            className='block p-6 bg-white border rounded-lg hover:shadow-sm'
          >
            <h2 className='text-xl font-semibold text-slate-800'>
              Risk Disclosures
            </h2>
            <p className='text-slate-600 mt-2'>
              Draft disclosures regarding trading and custody risks.
            </p>
          </Link>
          <Link
            href='/legal/supported-regions'
            className='block p-6 bg-white border rounded-lg hover:shadow-sm'
          >
            <h2 className='text-xl font-semibold text-slate-800'>
              Supported Regions & Disclosures
            </h2>
            <p className='text-slate-600 mt-2'>
              Draft list of supported/unsupported regions and notices.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
