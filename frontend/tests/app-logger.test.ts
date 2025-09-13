import {
  getLogger,
  parseBoolean,
  webConsoleLogger,
  noopLogger,
} from '../utils/app-logger';

describe('app-logger', () => {
  describe('parseBoolean', () => {
    test('should return true for "true" (case insensitive)', () => {
      expect(parseBoolean('true', false)).toBe(true);
      expect(parseBoolean('TRUE', false)).toBe(true);
      expect(parseBoolean('True', false)).toBe(true);
      expect(parseBoolean('  true  ', false)).toBe(true);
    });

    test('should return false for "false" (case insensitive)', () => {
      expect(parseBoolean('false', true)).toBe(false);
      expect(parseBoolean('FALSE', true)).toBe(false);
      expect(parseBoolean('False', true)).toBe(false);
      expect(parseBoolean('  false  ', true)).toBe(false);
    });

    test('should return default value for undefined/empty', () => {
      expect(parseBoolean(undefined, true)).toBe(true);
      expect(parseBoolean(undefined, false)).toBe(false);
      expect(parseBoolean('', true)).toBe(true);
      expect(parseBoolean('', false)).toBe(false);
    });

    test('should return default value for garbage input', () => {
      expect(parseBoolean('yes', false)).toBe(false);
      expect(parseBoolean('1', true)).toBe(true);
      expect(parseBoolean('0', false)).toBe(false);
      expect(parseBoolean('truthy', false)).toBe(false);
      expect(parseBoolean('random', true)).toBe(true);
    });
  });

  describe('getLogger', () => {
    test('should return webConsoleLogger when enabled (default)', () => {
      const logger = getLogger();
      expect(logger).toBe(webConsoleLogger);
    });

    test('should return webConsoleLogger when explicitly enabled', () => {
      const logger = getLogger({ enabled: true });
      expect(logger).toBe(webConsoleLogger);
    });

    test('should return noopLogger when disabled', () => {
      const logger = getLogger({ enabled: false });
      expect(logger).toBe(noopLogger);
    });
  });

  describe('webConsoleLogger', () => {
    const originalConsole = { ...console };

    beforeEach(() => {
      console.debug = jest.fn();
      console.info = jest.fn();
      console.warn = jest.fn();
      console.error = jest.fn();
    });

    afterEach(() => {
      Object.assign(console, originalConsole);
    });

    test('should call console methods with prefixed messages', () => {
      webConsoleLogger.debug('test debug', { data: 'test' });
      webConsoleLogger.info('test info');
      webConsoleLogger.warn('test warn');
      webConsoleLogger.error('test error');

      expect(console.debug).toHaveBeenCalledWith('[DEBUG] test debug', {
        data: 'test',
      });
      expect(console.info).toHaveBeenCalledWith('[INFO] test info');
      expect(console.warn).toHaveBeenCalledWith('[WARN] test warn');
      expect(console.error).toHaveBeenCalledWith('[ERROR] test error');
    });
  });

  describe('noopLogger', () => {
    test('should not throw or produce output', () => {
      expect(() => {
        noopLogger.debug('test');
        noopLogger.info('test');
        noopLogger.warn('test');
        noopLogger.error('test');
      }).not.toThrow();
    });
  });
});
