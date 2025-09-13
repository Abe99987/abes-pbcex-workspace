import React, { useEffect, useState } from 'react';

const DEEP_LINK_SCHEME =
  process.env.NEXT_PUBLIC_IOS_DEEP_LINK_SCHEME ||
  process.env.PUBLIC_IOS_DEEP_LINK_SCHEME ||
  'pbcex';
const FALLBACK_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_BASE_URL ||
  'https://pbcex.com';

export default function DeepLinkOpenPage() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const href = `${DEEP_LINK_SCHEME}://open`;
    const timer = setTimeout(() => setShowFallback(true), 1200);
    try {
      if (typeof window !== 'undefined') {
        window.location.href = href;
      }
    } catch {
      setShowFallback(true);
    }
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h1>Open in app</h1>
      {!showFallback ? (
        <p>Attempting to open the app…</p>
      ) : (
        <a
          href={FALLBACK_URL}
          style={{ color: '#2563eb', textDecoration: 'underline' }}
        >
          Continue in browser
        </a>
      )}
    </div>
  );
}
