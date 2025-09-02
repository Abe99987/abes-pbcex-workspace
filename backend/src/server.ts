import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { env } from '@/config/env';
import logger, { logInfo, logError } from '@/utils/logger';
import {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandling,
  gracefulShutdown,
} from '@/middlewares/errorMiddleware';
import { RATE_LIMITS } from '@/utils/constants';

// Import services
import PriceFeedService from '@/services/PriceFeedService';
import NotificationService from '@/services/NotificationService';
import EmailService from '@/services/EmailService';
import VerifyService from '@/services/VerifyService';
import FedexService from '@/services/FedexService';
import PricesService from '@/services/PricesService';
import CheckoutService from '@/services/CheckoutService';
import { CommodityConfigService } from '@/services/CommodityConfigService';
import { QuotesService } from '@/services/QuotesService';

// Import routes
import authRoutes from '@/routes/authRoutes';
import kycRoutes from '@/routes/kycRoutes';
import walletRoutes from '@/routes/walletRoutes';
import tradeRoutes from '@/routes/tradeRoutes';
import shopRoutes from '@/routes/shopRoutes';
import adminRoutes from '@/routes/adminRoutes';
import redemptionRoutes from '@/routes/redemptionRoutes';
import vaultRoutes from '@/routes/vaultRoutes';
import supportRoutes from '@/routes/supportRoutes';
import analyticsRoutes from '@/routes/analyticsRoutes';
import emailRoutes from '@/routes/emailRoutes';
import fedexRoutes from '@/routes/fedexRoutes';
import pricesRoutes from '@/routes/pricesRoutes';
import checkoutRoutes from '@/routes/checkoutRoutes';
import priceOracleRoutes from '@/routes/priceOracleRoutes';
import quotesRoutes from '@/routes/quotesRoutes';
import ordersRoutes from '@/routes/ordersRoutes';
import moneyMovementRoutes from '@/routes/moneyMovement';

// Import controllers for direct endpoints
import { TradeControllerDb } from '@/controllers/TradeControllerDb';
import { db } from '@/db';
import { cache } from '@/cache/redis';
import { getIntegrationStatus } from '@/config/features';

/**
 * PBCEx API Server
 * Main Express application entry point with full service initialization
 */

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Response compression middleware (before other middleware)
app.use(
  compression({
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Fallback to standard filter function
      return compression.filter(req, res);
    },
    level: 6, // Balance between compression ratio and speed
    threshold: 1024, // Only compress responses larger than 1KB
  })
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API server
  })
);

// CORS configuration
const corsOrigins =
  env.NODE_ENV === 'production'
    ? ['https://app.pbcex.com', 'https://pbcex.com']
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://127.0.0.1:3000',
      ];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  })
);

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // Store raw body for webhook verification if needed
      (req as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for admin users in development
  skip: req => {
    return (
      env.NODE_ENV === 'development' && req.headers['x-admin-bypass'] === 'true'
    );
  },
  // Custom key generator for better distributed rate limiting
  keyGenerator: req => {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.ip ||
      'unknown'
    );
  },
});

app.use('/api', generalLimiter);

// Request logging middleware
app.use('/api', (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  // Add request ID to request object for correlation
  (req as { requestId?: string }).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as { user?: { id?: string } }).user?.id,
      contentLength: res.get('Content-Length'),
    };

    // Log successful requests as info, errors as error
    if (res.statusCode >= 400) {
      logError(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
    } else {
      logInfo(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
    }
  });

  next();
});

// Health check endpoint with service status
app.get('/health', async (req, res) => {
  const [dbHealth, redisHealth] = await Promise.all([
    db.healthCheck(),
    cache.healthCheck(),
  ]);

  const integrationStatus = getIntegrationStatus();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      priceFeed: PriceFeedService.getHealthStatus(),
      notifications: NotificationService.getHealthStatus(),
      database: dbHealth,
      redis: redisHealth,
    },
    integrations: {
      phase: integrationStatus.phase,
      configured: integrationStatus.configured,
      total: integrationStatus.totalIntegrations,
      readyPercentage: integrationStatus.readyPercentage,
      placeholdersEnabled:
        process.env.INTEGRATION_VENDOR_PLACEHOLDERS === 'true',
    },
  };

  // Determine overall health
  const serviceStatuses = Object.values(healthData.services);
  const hasUnhealthyService = serviceStatuses.some(
    (service: unknown) =>
      (service as { status?: string })?.status === 'unhealthy' ||
      (service as { status?: string })?.status === 'error'
  );

  if (hasUnhealthyService) {
    healthData.status = 'degraded';
    res.status(503);
  }

  res.json(healthData);
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  // Basic Prometheus-style metrics
  const metrics = [
    `# HELP pbcex_http_requests_total Total HTTP requests`,
    `# TYPE pbcex_http_requests_total counter`,
    `pbcex_http_requests_total 0`, // Would track actual metrics

    `# HELP pbcex_active_users Active users count`,
    `# TYPE pbcex_active_users gauge`,
    `pbcex_active_users 0`, // Would track from auth service

    `# HELP pbcex_price_updates_total Total price updates`,
    `# TYPE pbcex_price_updates_total counter`,
    `pbcex_price_updates_total 0`, // Would track from price service

    `# HELP pbcex_trades_total Total trades executed`,
    `# TYPE pbcex_trades_total counter`,
    `pbcex_trades_total 0`, // Would track from trading service
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// API Documentation
try {
  const openApiSpec = YAML.load(
    path.join(__dirname, 'openapi', 'openapi.yaml')
  );
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'PBCEx API Documentation',
      customfavIcon: '/favicon.ico',
    })
  );
  logInfo('API documentation available at /api/docs');
} catch (error) {
  logError('Failed to load OpenAPI specification', error as Error);
}

// Public endpoints (no auth required)
// app.get('/api/prices', TradeControllerDb.getPrices); // Moved to /api/prices routes

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/fedex', fedexRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api', priceOracleRoutes);
app.use('/api/kyc', kycRoutes);

// Money Movement Routes (feature flagged)
app.use('/api', moneyMovementRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);

// Phase-3 Routes (feature flagged)
app.use('/api/redeem', redemptionRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);

// WebSocket endpoint for real-time price updates
app.get('/ws/prices', (req, res) => {
  // This would normally upgrade to WebSocket
  res.status(501).json({
    message: 'WebSocket price feeds not implemented yet',
    documentation: 'Use polling /api/trade/prices for now',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PBCEx API',
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    documentation: '/api/docs',
    health: '/health',
    metrics: '/metrics',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      checkout: '/api/checkout',
      email: '/api/email',
      fedex: '/api/fedex',
      prices: '/api/prices',
      quotes: '/api/quotes',
      orders: '/api/orders',
      kyc: '/api/kyc',
      wallet: '/api/wallet',
      trade: '/api/trade',
      shop: '/api/shop',
      admin: '/api/admin',
      moneyMovement:
        '/api/transfers, /api/crypto, /api/beneficiaries, /api/qr, /api/payment-requests, /api/recurring, /api/cards, /api/dca',
    },
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Setup global error handling
setupGlobalErrorHandling();

// Initialize services
async function initializeServices(): Promise<void> {
  logInfo('Initializing PBCEx services...');

  try {
    // Initialize notification service first (needed by other services)
    await NotificationService.initialize();
    logInfo('✅ NotificationService initialized');

    // Initialize email service
    await EmailService.initialize();
    logInfo('✅ EmailService initialized');

    // Initialize verify service
    await VerifyService.initialize();
    logInfo('✅ VerifyService initialized');

    // Initialize FedEx service
    await FedexService.initialize();
    logInfo('✅ FedexService initialized');

    // Initialize Prices service (CoinGecko + Redis)
    await PricesService.initialize();
    logInfo('✅ PricesService initialized');

    // Initialize Checkout service (Price-lock stubs)
    await CheckoutService.initialize();
    logInfo('✅ CheckoutService initialized');

    // Initialize commodity config service
    await CommodityConfigService.initialize();
    logInfo('✅ CommodityConfigService initialized');

    // Initialize quotes service
    await QuotesService.initialize();
    logInfo('✅ QuotesService initialized');

    // Initialize price feed service
    await PriceFeedService.initialize();
    logInfo('✅ PriceFeedService initialized');

    // Other services would be initialized here
    // await DatabaseService.initialize();
    // await RedisService.initialize();
    // await BlockchainService.initialize();

    logInfo('🎉 All services initialized successfully');

    // Start VerifyService cleanup timer (only outside tests)
    if (process.env.NODE_ENV !== 'test') {
      VerifyService.start();
    }
  } catch (error) {
    logError('❌ Service initialization failed', error as Error);
    throw error;
  }
}

// Graceful shutdown
async function shutdownServices(): Promise<void> {
  logInfo('Shutting down PBCEx services...');

  try {
    await PriceFeedService.shutdown();
    await PricesService.shutdown();
    await CheckoutService.shutdown();
    await CommodityConfigService.shutdown();
    await QuotesService.shutdown();
    await EmailService.shutdown();
    await VerifyService.shutdown();
    await FedexService.shutdown();

    // Stop VerifyService cleanup timer
    VerifyService.stop();
    // await DatabaseService.shutdown();
    // await RedisService.shutdown();

    logInfo('✅ All services shut down gracefully');
  } catch (error) {
    logError('Error during service shutdown', error as Error);
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize all services first
    await initializeServices();

    // Start HTTP server (only outside tests)
    let server: any;
    if (process.env.NODE_ENV !== 'test') {
      server = app.listen(env.PORT, () => {
        logInfo('🚀 PBCEx API Server started', {
          port: env.PORT,
          environment: env.NODE_ENV,
          nodeVersion: process.version,
          pid: process.pid,
          corsOrigins,
        });

        // Log integration status
        const integrationStatus = {
          database: !!env.DATABASE_URL,
          redis: !!env.REDIS_URL,
          plaid: !!(env.PLAID_CLIENT_ID && env.PLAID_SECRET),
          stripe: !!env.STRIPE_SECRET_KEY,
          sendgrid: !!env.SENDGRID_API_KEY,
          twilio: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
          intercom: !!env.INTERCOM_ACCESS_TOKEN,
          tradingView: !!env.TRADINGVIEW_API_KEY,
          datadog: !!env.DATADOG_API_KEY,
        };

        logInfo('📊 Integration Status:', integrationStatus);

        const configuredCount =
          Object.values(integrationStatus).filter(Boolean).length;
        const totalCount = Object.keys(integrationStatus).length;

        if (configuredCount < totalCount) {
          logInfo(
            `💡 ${totalCount - configuredCount} integrations need configuration for full functionality`
          );
        }
      });
    }

    // Graceful shutdown handling (only when server exists)
    const gracefulShutdownHandler = (signal: string) => {
      logInfo(`Received ${signal}. Starting graceful shutdown...`);

      if (server) {
        server.close(async () => {
          logInfo('HTTP server closed.');

          try {
            await shutdownServices();
            process.exit(0);
          } catch (error) {
            logError('Error during shutdown', error as Error);
            process.exit(1);
          }
        });

        // Force close after 15 seconds
        setTimeout(() => {
          logError(
            'Could not close connections in time, forcefully shutting down'
          );
          process.exit(1);
        }, 15000);
      } else {
        // No server to close, just shutdown services
        shutdownServices()
          .then(() => process.exit(0))
          .catch(() => process.exit(1));
      }
    };

    process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));

    // Handle server errors (only when server exists)
    if (server) {
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logError(`Port ${env.PORT} is already in use`);
          if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
            throw error;
          } else {
            process.exit(1);
          }
        } else {
          logError('Server error', error);
          if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
            throw error;
          } else {
            process.exit(1);
          }
        }
      });

      // Handle server startup events
      server.on('listening', () => {
        const address = server.address();
        logInfo('Server is listening', { address });
      });
    }
  } catch (error) {
    logError('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  logError('Unhandled error during startup', error);
  process.exit(1);
});

// Export app for testing
export default app;
