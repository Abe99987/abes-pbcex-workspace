import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as NextRouter from 'next/router';
import App from '@/pages/_app';
import LegalHub from '@/pages/legal/index';
import TOS from '@/pages/legal/tos';
import Privacy from '@/pages/legal/privacy';
import Risk from '@/pages/legal/risk-disclosures';
import Regions from '@/pages/legal/supported-regions';

// Mock next/head to render children directly for JSDOM assertions
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

// Mock router to prevent actual navigation errors in tests
jest.spyOn(NextRouter, 'useRouter').mockImplementation((): any => ({
  pathname: '/',
  push: jest.fn(),
}));

// Helper to render App with a given page component
function renderWithApp(Page: React.ComponentType<any>) {
  // @ts-expect-error simplify AppProps
  return render(<App Component={Page} pageProps={{}} />);
}

describe('Legal pages render', () => {
  test('Legal Hub has title, h1, meta, and Last updated', () => {
    render(<LegalHub />);
    expect(document.querySelector('title')).not.toBeNull();
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Legal Hub/i
    );
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  test('TOS page has title, h1, meta, and Last updated', () => {
    render(<TOS />);
    expect(document.querySelector('title')).not.toBeNull();
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Terms of Service/i
    );
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  test('Privacy page has title, h1, meta, and Last updated', () => {
    render(<Privacy />);
    expect(document.querySelector('title')).not.toBeNull();
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Privacy Policy/i
    );
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  test('Risk disclosures page has title, h1, meta, and Last updated', () => {
    render(<Risk />);
    expect(document.querySelector('title')).not.toBeNull();
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Risk Disclosures/i
    );
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  test('Supported regions page has title, h1, meta, and Last updated', () => {
    render(<Regions />);
    expect(document.querySelector('title')).not.toBeNull();
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Supported Regions/i
    );
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });
});

describe('Footer links present', () => {
  test('Footer renders all legal links with correct hrefs', () => {
    renderWithApp(() => <div>Test Page</div>);
    expect(screen.getByTestId('footer-link-tos')).toHaveAttribute(
      'href',
      '/legal/tos'
    );
    expect(screen.getByTestId('footer-link-privacy')).toHaveAttribute(
      'href',
      '/legal/privacy'
    );
    expect(screen.getByTestId('footer-link-risk')).toHaveAttribute(
      'href',
      '/legal/risk-disclosures'
    );
    expect(screen.getByTestId('footer-link-supported-regions')).toHaveAttribute(
      'href',
      '/legal/supported-regions'
    );
  });
});

describe('Region gating banner logic', () => {
  const realEnv = process.env;
  const realLocalStorage = global.localStorage;

  beforeEach(() => {
    jest.resetModules();
    // @ts-expect-error - Deleting global localStorage for test isolation
    delete (global as any).localStorage;
    // Simple localStorage mock
    const store: Record<string, string> = {};
    // @ts-expect-error - Mocking global localStorage for testing
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
      clear: () => Object.keys(store).forEach(k => delete store[k]),
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    } as any;
  });

  afterEach(() => {
    process.env = { ...realEnv };
    // @ts-expect-error - Restoring original localStorage after test
    global.localStorage = realLocalStorage;
  });

  test('Banner appears when gating on and region not allowed', () => {
    process.env.PUBLIC_REGION_GATING = 'on';
    process.env.PUBLIC_SUPPORTED_REGIONS = 'US,CA,GB';
    process.env.PUBLIC_REGION_MESSAGE = 'Test banner message';

    // Set unsupported region
    window.localStorage.setItem('userRegion', 'AU');

    renderWithApp(() => <div>Test Page</div>);
    expect(screen.getByTestId('region-gating-banner')).toBeInTheDocument();
    expect(screen.getByText(/Test banner message/)).toBeInTheDocument();
  });

  test('Banner hidden when region allowed', () => {
    process.env.PUBLIC_REGION_GATING = 'on';
    process.env.PUBLIC_SUPPORTED_REGIONS = 'US,CA,GB';
    window.localStorage.setItem('userRegion', 'US');

    renderWithApp(() => <div>Test Page</div>);
    expect(
      screen.queryByTestId('region-gating-banner')
    ).not.toBeInTheDocument();
  });

  test('Banner hidden when gating off', () => {
    process.env.PUBLIC_REGION_GATING = 'off';
    window.localStorage.setItem('userRegion', 'AU');

    renderWithApp(() => <div>Test Page</div>);
    expect(
      screen.queryByTestId('region-gating-banner')
    ).not.toBeInTheDocument();
  });
});
