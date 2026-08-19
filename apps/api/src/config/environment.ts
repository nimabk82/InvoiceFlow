import type { LogLevel } from '@nestjs/common';

export const nodeEnvironments = ['development', 'test', 'production'] as const;
export type NodeEnvironment = (typeof nodeEnvironments)[number];

export const apiLogLevels = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
] as const satisfies readonly LogLevel[];
export type ApiLogLevel = (typeof apiLogLevels)[number];

export type EnvironmentVariables = Readonly<{
  CORS_ORIGINS: readonly string[];
  HOST: string;
  LOG_LEVEL: ApiLogLevel;
  NODE_ENV: NodeEnvironment;
  PORT: number;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}>;

const defaultPort = 3001;
const defaultHost = '0.0.0.0';
const defaultLogLevel: ApiLogLevel = 'log';

function parseNodeEnvironment(value: unknown): NodeEnvironment {
  const environment = value ?? 'development';

  if (
    typeof environment !== 'string' ||
    !nodeEnvironments.includes(environment as NodeEnvironment)
  ) {
    throw new Error(`NODE_ENV must be one of: ${nodeEnvironments.join(', ')}`);
  }

  return environment as NodeEnvironment;
}

function parsePort(value: unknown): number {
  const port = value === undefined ? defaultPort : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function parseHost(value: unknown): string {
  const host = value ?? defaultHost;

  if (typeof host !== 'string' || host.trim().length === 0) {
    throw new Error('HOST must be a non-empty string');
  }

  return host.trim();
}

function parseLogLevel(value: unknown): ApiLogLevel {
  const logLevel = value ?? defaultLogLevel;

  if (
    typeof logLevel !== 'string' ||
    !apiLogLevels.includes(logLevel as ApiLogLevel)
  ) {
    throw new Error(`LOG_LEVEL must be one of: ${apiLogLevels.join(', ')}`);
  }

  return logLevel as ApiLogLevel;
}

function normalizeOrigin(origin: string): string {
  let url: URL;

  try {
    url = new URL(origin);
  } catch {
    throw new Error('CORS_ORIGINS must contain valid HTTP(S) origins');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('CORS_ORIGINS must contain valid HTTP(S) origins');
  }

  return url.origin;
}

function parseSupabaseUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('SUPABASE_URL must be a non-empty string');
  }

  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('SUPABASE_URL must be a valid URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('SUPABASE_URL must be an HTTP(S) URL');
  }

  return url.toString();
}

function parseSupabaseServiceRoleKey(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be a non-empty string');
  }

  return value.trim();
}

function parseCorsOrigins(
  value: unknown,
  environment: NodeEnvironment,
): readonly string[] {
  if (value === undefined || value === '') {
    return environment === 'production' ? [] : ['http://localhost:3000'];
  }

  if (typeof value !== 'string') {
    throw new Error('CORS_ORIGINS must be a comma-separated string');
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return [...new Set(origins)];
}

export function validateEnvironment(
  values: Record<string, unknown>,
): EnvironmentVariables {
  const environment = parseNodeEnvironment(values.NODE_ENV);

  return {
    CORS_ORIGINS: parseCorsOrigins(values.CORS_ORIGINS, environment),
    HOST: parseHost(values.HOST),
    LOG_LEVEL: parseLogLevel(values.LOG_LEVEL),
    NODE_ENV: environment,
    PORT: parsePort(values.PORT),
    SUPABASE_URL: parseSupabaseUrl(values.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: parseSupabaseServiceRoleKey(
      values.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
