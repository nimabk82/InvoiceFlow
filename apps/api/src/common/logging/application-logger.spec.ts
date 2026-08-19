import { ConsoleLogger } from '@nestjs/common';

import {
  createApplicationLogger,
  resolveLogLevels,
} from './application-logger';

describe('application logger', () => {
  it('maps a minimum level to Nest log levels', () => {
    expect(resolveLogLevels('warn')).toEqual(['warn', 'error', 'fatal']);
    expect(resolveLogLevels('verbose')).toEqual([
      'verbose',
      'debug',
      'log',
      'warn',
      'error',
      'fatal',
    ]);
  });

  it('creates the structured Nest logger', () => {
    expect(createApplicationLogger('log')).toBeInstanceOf(ConsoleLogger);
  });
});
