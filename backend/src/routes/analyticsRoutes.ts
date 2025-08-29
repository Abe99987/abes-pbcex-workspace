import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService, EventTypes } from '../services/AnalyticsService';
import { ExperimentService } from '../services/ExperimentService';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import rateLimit from 'express-rate-limit';

/**
 * Analytics API Routes for PBCEx
 * 
 * Handles:
 * - Event logging from frontend
 * - A/B experiment tracking
 * - Performance metrics
 * - Business metrics
 * - Experiment configuration
 */

const router = Router();

// Rate limiting for analytics endpoints
const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow high volume for analytics
  message: { code: 'RATE_LIMITED', message: 'Too many analytics requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Event logging schema
const AnalyticsEventRequestSchema = z.object({
  eventType: z.string(),
  properties: z.record(z.any()).optional(),
  experimentData: z.object({
    experimentKey: z.string(),
    variant: z.string()
  }).optional(),
  context: z.object({
    page: z.string().optional(),
    component: z.string().optional(),
    action: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
});

// Batch events schema
const BatchAnalyticsRequestSchema = z.object({
  events: z.array(AnalyticsEventRequestSchema).max(50) // Limit batch size
});

// Experiment assignment request schema
const ExperimentAssignmentRequestSchema = z.object({
  experiments: z.array(z.string()).optional()
});

/**
 * POST /api/analytics/event
 * Log a single analytics event
 */
router.post('/event', 
  analyticsRateLimit,
  authenticate, // Require authentication to tie events to users
  validateRequest(AnalyticsEventRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { eventType, properties, experimentData, context } = req.body;
      const user = (req as any).user;

      // Build analytics context from request
      const analyticsContext = {
        ...AnalyticsService.contextFromRequest(req),
        ...context
      };

      // Log the event
      await AnalyticsService.logEvent({
        eventType,
        userId: user.id,
        properties: properties || {},
        experimentData,
        context: analyticsContext,
        timestamp: new Date().toISOString()
      });

      res.json({
        code: 'EVENT_LOGGED',
        data: {
          eventType,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to log analytics event:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to log analytics event',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/analytics/events
 * Log multiple analytics events in a batch
 */
router.post('/events',
  analyticsRateLimit,
  authenticate,
  validateRequest(BatchAnalyticsRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { events } = req.body;
      const user = (req as any).user;
      
      // Process events in batch
      const processedEvents = events.map((event: any) => ({
        ...event,
        userId: user.id,
        timestamp: event.timestamp || new Date().toISOString(),
        context: {
          ...AnalyticsService.contextFromRequest(req),
          ...event.context
        }
      }));

      // Log all events
      for (const event of processedEvents) {
        await AnalyticsService.logEvent(event);
      }

      res.json({
        code: 'EVENTS_LOGGED',
        data: {
          eventCount: events.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to log analytics events batch:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to log analytics events',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/analytics/experiments/assignments
 * Get experiment assignments for current user
 */
router.get('/experiments/assignments',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const assignments = ExperimentService.getAllAssignments(user.id, true);

      res.json({
        code: 'ASSIGNMENTS_RETRIEVED',
        data: {
          assignments,
          userId: user.id
        }
      });

    } catch (error) {
      console.error('Failed to get experiment assignments:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to get experiment assignments',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/analytics/experiments/assign
 * Get variant assignments for specific experiments
 */
router.post('/experiments/assign',
  authenticate,
  validateRequest(ExperimentAssignmentRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { experiments = [] } = req.body;
      const user = (req as any).user;

      // Get assignments for requested experiments
      const assignments: Record<string, any> = {};
      
      if (experiments.length === 0) {
        // Return all active assignments
        const allAssignments = ExperimentService.getAllAssignments(user.id, true);
        allAssignments.forEach(assignment => {
          assignments[assignment.experimentKey] = assignment;
        });
      } else {
        // Return specific assignments
        experiments.forEach((experimentKey: string) => {
          const assignment = ExperimentService.getAssignment(user.id, experimentKey);
          if (assignment) {
            assignments[experimentKey] = assignment;
          }
        });
      }

      // Log assignment events
      Object.values(assignments).forEach(async (assignment: any) => {
        await AnalyticsService.logExperimentEvent(
          user.id,
          assignment.experimentKey,
          assignment.variant,
          'assignment'
        );
      });

      res.json({
        code: 'EXPERIMENTS_ASSIGNED',
        data: {
          assignments,
          userId: user.id
        }
      });

    } catch (error) {
      console.error('Failed to assign experiments:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to assign experiments',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/analytics/experiments
 * Get available experiments configuration
 */
router.get('/experiments',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const experiments = ExperimentService.listExperiments();
      
      // Filter out sensitive configuration details
      const publicExperiments = experiments.map(exp => ({
        key: exp.key,
        name: exp.name,
        description: exp.description,
        variants: exp.variants,
        enabled: exp.enabled
        // Don't expose traffic allocation or targeting rules
      }));

      res.json({
        code: 'EXPERIMENTS_LISTED',
        data: {
          experiments: publicExperiments
        }
      });

    } catch (error) {
      console.error('Failed to list experiments:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to list experiments',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/analytics/performance
 * Log performance metrics
 */
router.post('/performance',
  analyticsRateLimit,
  authenticate,
  validateRequest(z.object({
    operation: z.string(),
    duration: z.number(),
    success: z.boolean(),
    properties: z.record(z.any()).optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const { operation, duration, success, properties } = req.body;
      
      await AnalyticsService.logPerformanceMetric(
        operation,
        duration,
        success,
        properties
      );

      res.json({
        code: 'PERFORMANCE_LOGGED',
        data: {
          operation,
          duration,
          success,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to log performance metric:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to log performance metric',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/analytics/business-metric
 * Log business metrics
 */
router.post('/business-metric',
  analyticsRateLimit,
  authenticate,
  validateRequest(z.object({
    metricName: z.string(),
    value: z.number(),
    unit: z.string().optional(),
    properties: z.record(z.any()).optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const { metricName, value, unit, properties } = req.body;
      const user = (req as any).user;
      
      await AnalyticsService.logBusinessMetric(
        metricName,
        value,
        unit,
        user.id,
        properties
      );

      res.json({
        code: 'BUSINESS_METRIC_LOGGED',
        data: {
          metricName,
          value,
          unit,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to log business metric:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to log business metric',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/analytics/error
 * Log client-side errors
 */
router.post('/error',
  analyticsRateLimit,
  authenticate, // Optional authentication for error logging
  validateRequest(z.object({
    errorType: z.string(),
    errorMessage: z.string().optional(),
    stack: z.string().optional(),
    url: z.string().optional(),
    properties: z.record(z.any()).optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const { errorType, errorMessage, stack, url, properties } = req.body;
      const user = (req as any).user;
      
      await AnalyticsService.logError(
        errorType,
        {
          errorMessage,
          stack: stack?.substring(0, 1000), // Limit stack trace size
          url,
          ...properties
        },
        user?.id
      );

      res.json({
        code: 'ERROR_LOGGED',
        data: {
          errorType,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to log client error:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to log error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Health check for analytics service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    code: 'ANALYTICS_HEALTHY',
    data: {
      service: 'analytics',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        eventLogging: true,
        experiments: true,
        performance: true,
        businessMetrics: true
      }
    }
  });
});

export { router as analyticsRoutes };
