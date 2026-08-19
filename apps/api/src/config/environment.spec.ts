import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('provides safe development defaults', () => {
    expect(validateEnvironment({})).toEqual({
      CORS_ORIGINS: ['http://localhost:3000'],
      HOST: '0.0.0.0',
      LOG_LEVEL: 'log',
      NODE_ENV: 'development',
      PORT: 3001,
    });
  });

  it('normalizes configured values', () => {
    expect(
      validateEnvironment({
        CORS_ORIGINS:
          'https://app.invoiceflow.test/, https://admin.invoiceflow.test',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'debug',
        NODE_ENV: 'test',
        PORT: '4100',
      }),
    ).toEqual({
      CORS_ORIGINS: [
        'https://app.invoiceflow.test',
        'https://admin.invoiceflow.test',
      ],
      HOST: '127.0.0.1',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'test',
      PORT: 4100,
    });
  });

  it.each([
    [{ NODE_ENV: 'preview' }, 'NODE_ENV'],
    [{ PORT: '0' }, 'PORT'],
    [{ PORT: '3001.5' }, 'PORT'],
    [{ HOST: '' }, 'HOST'],
    [{ LOG_LEVEL: 'trace' }, 'LOG_LEVEL'],
    [{ CORS_ORIGINS: 'file:///tmp/app' }, 'CORS_ORIGINS'],
  ])('rejects invalid configuration %o', (values, variable) => {
    expect(() => validateEnvironment(values)).toThrow(variable);
  });

  it('does not allow localhost implicitly in production', () => {
    expect(
      validateEnvironment({ NODE_ENV: 'production' }).CORS_ORIGINS,
    ).toEqual([]);
  });
});
