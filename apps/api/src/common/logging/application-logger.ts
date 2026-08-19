import { ConsoleLogger, type LogLevel } from '@nestjs/common';

import type { ApiLogLevel } from '../../config/environment';

const levelsByMinimum: Record<ApiLogLevel, LogLevel[]> = {
  fatal: ['fatal'],
  error: ['error', 'fatal'],
  warn: ['warn', 'error', 'fatal'],
  log: ['log', 'warn', 'error', 'fatal'],
  debug: ['debug', 'log', 'warn', 'error', 'fatal'],
  verbose: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
};

export function resolveLogLevels(minimumLevel: ApiLogLevel): LogLevel[] {
  return [...levelsByMinimum[minimumLevel]];
}

export function createApplicationLogger(
  minimumLevel: ApiLogLevel,
): ConsoleLogger {
  return new ConsoleLogger({
    colors: false,
    compact: true,
    json: true,
    logLevels: resolveLogLevels(minimumLevel),
  });
}
