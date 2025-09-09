import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import ExternalLink from '../components/ExternalLink';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('ExternalLink', () => {
  const mockToastError = toast.error as jest.MockedFunction<typeof toast.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing env vars
    delete process.env.NEXT_PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST;
    delete process.env.PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST;
  });

  test('should render with correct security attributes', () => {
    render(
      <ExternalLink href="https://tradingview.com/chart">
        View Chart
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://tradingview.com/chart');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('View Chart');
  });

  test('should use custom target policy', () => {
    render(
      <ExternalLink href="https://tradingview.com/chart" targetPolicy="self">
        View Chart
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_self');
  });

  test('should apply custom className', () => {
    render(
      <ExternalLink href="https://tradingview.com/chart" className="custom-class">
        View Chart
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('custom-class');
  });

  test('should allow tradingview.com by default', () => {
    render(
      <ExternalLink href="https://tradingview.com/chart">
        View Chart
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).not.toHaveBeenCalled();
  });

  test('should allow pbcex.com by default', () => {
    render(
      <ExternalLink href="https://pbcex.com/help">
        Help
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).not.toHaveBeenCalled();
  });

  test('should block disallowed hosts', () => {
    render(
      <ExternalLink href="https://malicious-site.com/bad">
        Bad Link
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).toHaveBeenCalledWith('External link to malicious-site.com is not allowed');
  });

  test('should use env allowlist when provided', () => {
    process.env.NEXT_PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST = 'example.com,test.org';
    
    render(
      <ExternalLink href="https://example.com/page">
        Example Link
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).not.toHaveBeenCalled();
  });

  test('should use prop allowlist over env allowlist', () => {
    process.env.NEXT_PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST = 'example.com';
    
    render(
      <ExternalLink 
        href="https://custom-allowed.com/page"
        hostAllowlist={['custom-allowed.com']}
      >
        Custom Link
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).not.toHaveBeenCalled();
  });

  test('should handle subdomains correctly', () => {
    render(
      <ExternalLink href="https://charts.tradingview.com/widget">
        Widget
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).not.toHaveBeenCalled();
  });

  test('should block invalid URLs', () => {
    render(
      <ExternalLink href="not-a-valid-url">
        Invalid Link
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).toHaveBeenCalledWith('Invalid URL');
  });

  test('should prefer PUBLIC_ prefix over NEXT_PUBLIC_', () => {
    process.env.PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST = 'public-host.com';
    process.env.NEXT_PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST = 'next-host.com';
    
    render(
      <ExternalLink href="https://next-host.com/page">
        Next Host Link
      </ExternalLink>
    );

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mockToastError).not.toHaveBeenCalled();
  });
});
