/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'PBCEx',
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001',
  },

  // Image optimization
  images: {
    domains: ['localhost', 'api.pbcex.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://charting-library.tradingview.com https://widget.tradingview.com https://static.tradingview.com https://cdn.tradingview.com",
              "style-src 'self' 'unsafe-inline' https://charting-library.tradingview.com https://widget.tradingview.com https://static.tradingview.com https://cdn.tradingview.com",
              "img-src 'self' data: blob: https: https://s3.tradingview.com https://static.tradingview.com https://cdn.tradingview.com https://widget.tradingview.com",
              "connect-src 'self' https://api.tradingview.com https://prodata.tradingview.com https://pushstream.tradingview.com https://scanner.tradingview.com https://symbol-search.tradingview.com wss://data.tradingview.com wss://prodata.tradingview.com ws://localhost:* http://localhost:*",
              "frame-src 'self' https://www.tradingview.com https://charting-library.tradingview.com https://widget.tradingview.com https://s.tradingview.com",
              "frame-ancestors 'self'",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "font-src 'self' data: https://fonts.gstatic.com https://static.tradingview.com",
              "media-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // Experimental features
  experimental: {
    typedRoutes: true,
  },

  // Bundle analyzer (conditional)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

module.exports = nextConfig;
