import request from 'supertest';
import app from '@/server';
import { DCARepository } from '../repo/dca.repository';
import { ScheduleService } from '../services/schedule.service';

describe('DCA Integration Tests', () => {
  const mockUserId = 'test-user-id';
  const mockToken = 'Bearer mock-token';

  beforeEach(() => {
    // Mock authentication
    jest
      .spyOn(require('@/middlewares/auth'), 'requireAuth')
      .mockImplementation((req: any, res: any, next: any) => {
        req.user = { id: mockUserId, email: 'test@example.com' };
        next();
      });

    // Mock feature flag
    jest
      .spyOn(require('@/middlewares/auth'), 'requireFeature')
      .mockImplementation(() => (req: any, res: any, next: any) => next());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/dca/rules', () => {
    it('should return empty rules list for new user', async () => {
      // Mock repository
      jest.spyOn(DCARepository, 'findByUserId').mockResolvedValue({
        rules: [],
        total: 0,
      });

      const response = await request(app)
        .get('/api/dca/rules')
        .set('Authorization', mockToken)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          rules: [],
          total: 0,
          limit: 50,
          offset: 0,
        },
      });
    });

    it('should handle pagination parameters', async () => {
      jest.spyOn(DCARepository, 'findByUserId').mockResolvedValue({
        rules: [],
        total: 0,
      });

      await request(app)
        .get('/api/dca/rules?limit=10&offset=20')
        .set('Authorization', mockToken)
        .expect(200);

      expect(DCARepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
        10,
        20,
        undefined
      );
    });
  });

  describe('GET /api/spending/rules (alias)', () => {
    it('should work as alias to DCA rules', async () => {
      jest.spyOn(DCARepository, 'findByUserId').mockResolvedValue({
        rules: [],
        total: 0,
      });

      const response = await request(app)
        .get('/api/spending/rules')
        .set('Authorization', mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/dca/rules', () => {
    it('should create a new DCA rule', async () => {
      const mockRule = {
        id: 'rule-id',
        userId: mockUserId,
        baseSymbol: 'BTC',
        quoteSymbol: 'USDC',
        cadence: 'daily' as const,
        amountMinor: BigInt(5000), // $50.00
        currencySymbol: 'USD',
        executionTimeUtc: '14:00',
        startDate: new Date('2024-01-01'),
        endDate: undefined,
        monthlyDay: undefined,
        fromAccount: 'funding' as const,
        active: true,
        nextRunAt: new Date('2024-01-02T14:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(DCARepository, 'create').mockResolvedValue(mockRule);

      const createData = {
        baseSymbol: 'BTC',
        quoteSymbol: 'USDC',
        cadence: 'daily',
        amount: '50.00',
        currencySymbol: 'USD',
        executionTimeUtc: '14:00',
        startDate: '2024-01-01T00:00:00Z',
        fromAccount: 'funding',
      };

      const response = await request(app)
        .post('/api/dca/rules')
        .set('Authorization', mockToken)
        .set('X-Idempotency-Key', 'test-key-123')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.baseSymbol).toBe('BTC');
      expect(response.body.data.amount).toBe('50.00');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/dca/rules')
        .set('Authorization', mockToken)
        .send({
          baseSymbol: 'BTC',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dca/backtest', () => {
    it('should run a backtest simulation', async () => {
      const mockBacktestResult = {
        inputs: {
          baseSymbol: 'BTC',
          quoteSymbol: 'USDC',
          amount: 100,
          cadence: 'daily' as const,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T00:00:00Z',
          executionTimeUtc: '14:00',
        },
        periods: 31,
        fills: [],
        totals: {
          invested: 3100,
          units: 0.1,
          avgCost: 31000,
          endValue: 3200,
          pnlAbs: 100,
          pnlPct: 3.23,
        },
        series: [],
      };

      // Mock the backtest service
      jest
        .spyOn(
          require('../services/backtest.service').BacktestService.prototype,
          'runBacktest'
        )
        .mockResolvedValue(mockBacktestResult);

      const response = await request(app)
        .get('/api/dca/backtest')
        .query({
          base: 'BTC',
          quote: 'USDC',
          amount: '100',
          cadence: 'daily',
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T00:00:00Z',
          execTime: '14:00',
        })
        .set('Authorization', mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.periods).toBe(31);
      expect(response.body.meta.duration).toBeDefined();
    });
  });

  describe('GET /api/dca/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/dca/health').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.components).toBeDefined();
    });
  });
});

describe('Schedule Service Tests', () => {
  describe('computeNextRunAt', () => {
    it('should calculate next daily run', () => {
      const startDate = new Date('2024-01-01T10:00:00Z');
      const now = new Date('2024-01-01T15:00:00Z');

      const nextRun = ScheduleService.computeNextRunAt(
        'daily',
        startDate,
        '14:00', // 10:00 ET
        undefined,
        now
      );

      expect(nextRun.getUTCHours()).toBe(14);
      expect(nextRun.getUTCMinutes()).toBe(0);
      expect(nextRun.getUTCDate()).toBe(2); // Next day
    });

    it('should calculate next monthly run with monthly_day', () => {
      const startDate = new Date('2024-01-01T10:00:00Z');
      const now = new Date('2024-01-05T15:00:00Z');

      const nextRun = ScheduleService.computeNextRunAt(
        'monthly',
        startDate,
        '14:00',
        15, // 15th of month
        now
      );

      expect(nextRun.getUTCHours()).toBe(14);
      expect(nextRun.getUTCDate()).toBe(15);
      expect(nextRun.getUTCMonth()).toBe(0); // January (0-indexed)
    });

    it('should handle monthly_day past current date', () => {
      const startDate = new Date('2024-01-01T10:00:00Z');
      const now = new Date('2024-01-20T15:00:00Z');

      const nextRun = ScheduleService.computeNextRunAt(
        'monthly',
        startDate,
        '14:00',
        15, // 15th already passed
        now
      );

      expect(nextRun.getUTCDate()).toBe(15);
      expect(nextRun.getUTCMonth()).toBe(1); // February
    });

    it('should handle weekly cadence', () => {
      const startDate = new Date('2024-01-01T10:00:00Z'); // Monday
      const now = new Date('2024-01-03T15:00:00Z'); // Wednesday

      const nextRun = ScheduleService.computeNextRunAt(
        'weekly',
        startDate,
        '14:00',
        undefined,
        now
      );

      expect(nextRun.getUTCHours()).toBe(14);
      expect(nextRun.getUTCDay()).toBe(1); // Monday
      expect(nextRun.getUTCDate()).toBe(8); // Next Monday
    });
  });

  describe('timezone utilities', () => {
    it('should identify weekends', () => {
      const saturday = new Date('2024-01-06T10:00:00Z');
      const sunday = new Date('2024-01-07T10:00:00Z');
      const monday = new Date('2024-01-08T10:00:00Z');

      expect(ScheduleService.isWeekend(saturday)).toBe(true);
      expect(ScheduleService.isWeekend(sunday)).toBe(true);
      expect(ScheduleService.isWeekend(monday)).toBe(false);
    });

    it('should identify basic holidays', () => {
      const newYear = new Date('2024-01-01T10:00:00Z');
      const july4 = new Date('2024-07-04T10:00:00Z');
      const christmas = new Date('2024-12-25T10:00:00Z');
      const regular = new Date('2024-06-15T10:00:00Z');

      expect(ScheduleService.isHoliday(newYear)).toBe(true);
      expect(ScheduleService.isHoliday(july4)).toBe(true);
      expect(ScheduleService.isHoliday(christmas)).toBe(true);
      expect(ScheduleService.isHoliday(regular)).toBe(false);
    });
  });
});
