import { validateEnvironment } from './environment';

const validSupabase = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

describe('validateEnvironment', () => {
  it('provides safe development defaults for non-Supabase variables', () => {
    expect(validateEnvironment({ ...validSupabase })).toEqual({
      CORS_ORIGINS: ['http://localhost:3000'],
      EMAIL_PROVIDER: 'logger',
      HOST: '0.0.0.0',
      LOG_LEVEL: 'log',
      NODE_ENV: 'development',
      PORT: 3001,
      SUPABASE_URL: 'https://test.supabase.co/',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    });
  });

  it('normalizes configured values', () => {
    expect(
      validateEnvironment({
        ...validSupabase,
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
      EMAIL_PROVIDER: 'logger',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'test',
      PORT: 4100,
      SUPABASE_URL: 'https://test.supabase.co/',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    });
  });

  it.each([
    [{ NODE_ENV: 'preview' }, 'NODE_ENV'],
    [{ PORT: '0' }, 'PORT'],
    [{ PORT: '3001.5' }, 'PORT'],
    [{ HOST: '' }, 'HOST'],
    [{ LOG_LEVEL: 'trace' }, 'LOG_LEVEL'],
    [{ CORS_ORIGINS: 'file:///tmp/app' }, 'CORS_ORIGINS'],
    [{ EMAIL_PROVIDER: 'smtp' }, 'EMAIL_PROVIDER'],
    [{ SUPABASE_URL: '' }, 'SUPABASE_URL'],
    [{ SUPABASE_URL: 'not-a-url' }, 'SUPABASE_URL'],
    [{ SUPABASE_URL: 'ftp://bad.protocol' }, 'SUPABASE_URL'],
    [{ SUPABASE_SERVICE_ROLE_KEY: '' }, 'SUPABASE_SERVICE_ROLE_KEY'],
  ])('rejects invalid configuration %o', (values, variable) => {
    expect(() => validateEnvironment({ ...validSupabase, ...values })).toThrow(
      variable,
    );
  });

  it('does not allow localhost implicitly in production', () => {
    const config = validateEnvironment({
      ...validSupabase,
      NODE_ENV: 'production',
    });

    expect(config.CORS_ORIGINS).toEqual([]);
    expect(config.EMAIL_PROVIDER).toBe('disabled');
  });

  it('rejects the logger email provider in production', () => {
    expect(() =>
      validateEnvironment({
        ...validSupabase,
        EMAIL_PROVIDER: 'logger',
        NODE_ENV: 'production',
      }),
    ).toThrow('EMAIL_PROVIDER=logger is not allowed in production');
  });
});
