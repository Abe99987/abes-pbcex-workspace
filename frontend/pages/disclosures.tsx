import Head from 'next/head';

export default function DisclosuresPage() {
  const title = 'Disclosures — PBCEx';
  const description = 'Supported Regions, Privacy baseline, and Export Compliance for PBCEx.';

  return (
    <div className='min-h-screen bg-white'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>
      <main className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <h1 className='text-3xl font-bold text-slate-900'>Disclosures</h1>
        <p className='text-sm text-slate-500 mt-1 mb-6'>Public disclosures for App Review clarity.</p>

        <div className='prose max-w-none'>
          <h2>Overview</h2>
          <p>
            This page summarizes the current app wrapper scope, privacy baseline, export stance,
            and the initial supported regions. Content is minimal and non-marketing.
          </p>

          <h2>Privacy & Data Collection</h2>
          <p>
            Data Not Collected (MVP). No analytics, crash reporting, ads, or native payments are enabled.
            The shipped SDK set must match this statement.
          </p>

          <h2>Export Compliance</h2>
          <p>
            Uses standard TLS encryption in transit only and qualifies for mass market exemption (5A992.c).
            No custom cryptography is implemented.
          </p>

          <h2>Supported Regions</h2>
          <p>
            Initial availability: United States. Additional regions may be added over time.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these disclosures, contact support@pbcex.com.
          </p>
        </div>
      </main>
    </div>
  );
}


