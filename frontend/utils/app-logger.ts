/**
 * Minimal logging abstraction for PBCEx
 *
 * Provides a unified logging interface with multiple adapters:
 * - webConsoleLogger: logs to browser console (default)
 * - noopLogger: silent logger for disabled/production modes
 *
 * Future: iOS native logger adapter when wrapper is implemented
 */

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export const webConsoleLogger: Logger = {
  debug: (message: string, ...args: any[]) =>
    console.debug(`[DEBUG] ${message}`, ...args),
  info: (message: string, ...args: any[]) =>
    console.info(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) =>
    console.error(`[ERROR] ${message}`, ...args),
};

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

interface LoggerConfig {
  enabled?: boolean;
}

/**
 * Factory function to create logger instance based on configuration
 */
export function getLogger(config: LoggerConfig = {}): Logger {
  const { enabled = true } = config;

  return enabled ? webConsoleLogger : noopLogger;
}

/**
 * Parse boolean environment variable safely
 * Only accepts 'true'/'false' (case-insensitive), otherwise returns default
 */
export function parseBoolean(
  envValue: string | undefined,
  defaultValue: boolean
): boolean {
  if (!envValue) return defaultValue;

  const normalized = envValue.toLowerCase().trim();

  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  return defaultValue;
}
