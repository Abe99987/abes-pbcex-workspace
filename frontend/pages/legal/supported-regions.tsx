import Head from 'next/head';
import '../styles/print.module.css';
import Link from 'next/link';

const LAST_UPDATED = '2025-01-15';

export default function SupportedRegions() {
  const title = 'Supported Regions & Disclosures (Draft) — PBCEx';
  const description =
    'Draft list of supported regions and disclosures for PBCEx services.';

  return (
    <div className='min-h-screen bg-slate-50'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>
      <main className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <h1 className='text-3xl font-bold text-slate-800'>
          Supported Regions & Disclosures (Draft)
        </h1>
        <p className='text-sm text-slate-500 mt-1 mb-6'>
          Last updated: {LAST_UPDATED}
        </p>

        <div className='prose max-w-none'>
          <h2>Supported Countries/Regions</h2>
          <p>
            Initial supported regions include: US, CA, GB. Availability may
            expand over time.
          </p>

          <h2>Temporarily Unsupported</h2>
          <p>
            Some regions are temporarily unsupported pending approvals or
            technical readiness.
          </p>

          <h2>Disclosures Summary</h2>
          <ul>
            <li>Custody: PAXG custody-only at this time.</li>
            <li>Trading: Limitations may apply by region and asset type.</li>
            <li>
              Age: Users must be at least 18 years old (or local equivalent).
            </li>
            <li>
              KYC: Identity verification may be required to access certain
              features.
            </li>
          </ul>

          <h2>Jurisdiction Changes</h2>
          <p>
            Jurisdictions may change. Please check this page for updates. For
            exceptions or B2B inquiries, contact us via the app’s support
            channel.
          </p>

          <p>
            For broader risk information, see our{' '}
            <Link href='/legal/risk-disclosures'>Risk Disclosures</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
