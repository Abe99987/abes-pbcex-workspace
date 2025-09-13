import type { AppProps } from 'next/app';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import Navigation from '@/components/Navigation';
import { APP_BUILD_VERSION } from '@/lib/constants';

function useRegionPreference() {
  const [selectedRegion, setSelectedRegion] = useState<string>('US');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('userRegion');
      if (stored) {
        setSelectedRegion(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Test-only override: allow query param to set region for UAT (non-production only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    try {
      const search =
        typeof window !== 'undefined' ? window.location.search : '';
      const params = new URLSearchParams(search);
      const override = params.get('pbce_region');
      if (override) {
        const normalized = override.toUpperCase();
        setSelectedRegion(normalized);
        try {
          window.localStorage.setItem('userRegion', normalized);
        } catch {
          // ignore storage errors
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('userRegion', selectedRegion);
    } catch {
      // ignore storage errors
    }
  }, [selectedRegion]);

  return { selectedRegion, setSelectedRegion } as const;
}

function RegionGatingBanner() {
  // Support both PUBLIC_* (requested) and NEXT_PUBLIC_* (Next default) without changing repo-wide config
  const gatingFlag = (
    process.env.PUBLIC_REGION_GATING ||
    process.env.NEXT_PUBLIC_REGION_GATING ||
    'off'
  ).toLowerCase();
  const gatingOn =
    gatingFlag === 'on' || gatingFlag === 'true' || gatingFlag === '1';
  const supportedCsv =
    process.env.PUBLIC_SUPPORTED_REGIONS ||
    process.env.NEXT_PUBLIC_SUPPORTED_REGIONS ||
    'US,CA,GB';
  const message =
    process.env.PUBLIC_REGION_MESSAGE ||
    process.env.NEXT_PUBLIC_REGION_MESSAGE ||
    'Service availability varies by region. See Supported Regions & Disclosures.';

  const supportedRegions = useMemo(() => {
    return supportedCsv
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
  }, [supportedCsv]);

  const { selectedRegion, setSelectedRegion } = useRegionPreference();
  const isSupported = supportedRegions.includes(
    (selectedRegion || 'US').toUpperCase()
  );

  if (!gatingOn || isSupported) {
    return null;
  }

  return (
    <div
      data-testid='region-gating-banner'
      className='sticky top-0 z-50 w-full bg-amber-50 border-b border-amber-200'
      role='status'
      aria-live='polite'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
        <div className='text-amber-900 text-sm'>
          {message}{' '}
          <Link
            className='underline'
            href='/legal/supported-regions'
            data-testid='banner-supported-regions-link'
          >
            Learn more
          </Link>
        </div>
        <div className='flex items-center gap-2'>
          <label htmlFor='region-selector' className='text-sm text-amber-900'>
            Select Region:
          </label>
          <select
            id='region-selector'
            data-testid='region-selector'
            className='text-sm bg-white border border-amber-300 rounded px-2 py-1'
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
          >
            {/* Keep options minimal; users can pick broadly */}
            {['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'SG', 'JP', 'BR'].map(
              code => (
                <option key={code} value={code}>
                  {code}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideGlobalNav = router.pathname.startsWith('/admin');
  return (
    <div data-app-build={APP_BUILD_VERSION}>
      <AuthProvider>
        {/* Public Beta informational badge */}
        {(() => {
          const betaMode = (
            process.env.PUBLIC_BETA_MODE ||
            process.env.NEXT_PUBLIC_BETA_MODE ||
            'off'
          ).toLowerCase();
          if (betaMode === 'on' || betaMode === 'true' || betaMode === '1') {
            return (
              <div
                className='w-full bg-indigo-50 border-b border-indigo-200'
                role='status'
                aria-live='polite'
              >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between'>
                  <div
                    className='text-indigo-900 text-sm font-medium'
                    data-testid='public-beta-badge'
                  >
                    Public Beta
                  </div>
                  <div className='text-sm'>
                    <Link
                      className='underline text-indigo-900'
                      href='/legal/risk-disclosures'
                    >
                      Read disclosures
                    </Link>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        <RegionGatingBanner />
        {!hideGlobalNav && <Navigation />}
        <Component {...pageProps} />
        {/* Global footer navigation */}
        <footer
          className='mt-16 border-t border-gray-200 bg-white'
          role='contentinfo'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div className='text-sm text-gray-500'>
                © {new Date().getFullYear()} PBCEx. All rights reserved.
              </div>
              <nav aria-label='Legal'>
                <ul className='flex flex-wrap gap-x-6 gap-y-2 text-sm'>
                  <li>
                    <Link
                      href='/legal/tos'
                      data-testid='footer-link-tos'
                      className='text-gray-600 hover:text-gray-900'
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/legal/privacy'
                      data-testid='footer-link-privacy'
                      className='text-gray-600 hover:text-gray-900'
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/legal/risk-disclosures'
                      data-testid='footer-link-risk'
                      className='text-gray-600 hover:text-gray-900'
                    >
                      Risk Disclosures
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/legal/supported-regions'
                      data-testid='footer-link-supported-regions'
                      className='text-gray-600 hover:text-gray-900'
                    >
                      Supported Regions
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </footer>
        <Toaster />
      </AuthProvider>
    </div>
  );
}
