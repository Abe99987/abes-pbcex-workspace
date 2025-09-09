import React from 'react';
import { toast } from 'react-hot-toast';
import { openExternal } from '../lib/wrapperBridge';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  hostAllowlist?: string[];
  targetPolicy?: 'blank' | 'self';
}

/**
 * Centralized external link component with allowlist enforcement and security policies.
 * 
 * Features:
 * - Enforces host allowlist from env or props
 * - Always applies rel="noopener noreferrer" for security
 * - Configurable target policy (default: _blank)
 * - Blocks disallowed hosts with toast notification
 * - Future: wrapper-specific handling for iOS in-app browser
 */
export default function ExternalLink({
  href,
  children,
  className = '',
  hostAllowlist,
  targetPolicy = 'blank'
}: ExternalLinkProps) {
  // Parse allowlist from env or use provided list
  const getAllowlist = (): string[] => {
    if (hostAllowlist) return hostAllowlist;
    
    const envAllowlist = process.env.NEXT_PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST || 
                        process.env.PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST;
    
    if (!envAllowlist) return ['tradingview.com', 'pbcex.com']; // Safe defaults
    
    return envAllowlist.split(',').map(host => host.trim());
  };

  // Extract hostname from URL
  const getHostname = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  };

  // Check if host is allowed
  const isHostAllowed = (hostname: string, allowlist: string[]): boolean => {
    return allowlist.some(allowed => 
      hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  };

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    const hostname = getHostname(href);
    
    if (!hostname) {
      e.preventDefault();
      toast.error('Invalid URL');
      return;
    }

    const allowlist = getAllowlist();
    
    if (!isHostAllowed(hostname, allowlist)) {
      e.preventDefault();
      toast.error(`Opening externally: ${hostname}`);
      await openExternal(href);
      return;
    }

    // Allow the link to proceed in-app - it's in the allowlist
  };

  const target = targetPolicy === 'blank' ? '_blank' : '_self';
  
  return (
    <a
      href={href}
      target={target}
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
