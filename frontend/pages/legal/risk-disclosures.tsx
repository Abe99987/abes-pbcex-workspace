import Head from 'next/head';
import '../styles/print.module.css';

const LAST_UPDATED = '2025-01-15';

export default function RiskDisclosures() {
  const title = 'Risk Disclosures (Draft) — PBCEx';
  const description =
    'Draft risk disclosures for trading and custody on PBCEx.';

  return (
    <div className='min-h-screen bg-slate-50'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>
      <main className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <h1 className='text-3xl font-bold text-slate-800'>
          Risk Disclosures (Draft)
        </h1>
        <p className='text-sm text-slate-500 mt-1 mb-6'>
          Last updated: {LAST_UPDATED}
        </p>

        <div className='prose max-w-none'>
          <p>
            Trading and custody involve risk, including potential loss of
            principal. These disclosures are drafts for review and may change.
          </p>
          <h2>Market Risk</h2>
          <p>
            Prices of precious metals can be volatile. Past performance does not
            guarantee future results.
          </p>
          <h2>Operational Risk</h2>
          <p>
            System outages or third-party service disruptions may impact
            availability.
          </p>
          <h2>Custody</h2>
          <p>
            PAXG is supported for custody-only at this time. Trading limitations
            may apply.
          </p>
        </div>
      </main>
    </div>
  );
}
