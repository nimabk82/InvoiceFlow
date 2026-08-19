# InvoiceFlow API

NestJS application running on the Fastify adapter.

From the repository root:

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api test:e2e
```

Copy `.env.example` to `.env` when local overrides are needed. The API validates
configuration during startup and supports:

- `NODE_ENV`: `development`, `test`, or `production`
- `HOST`: bind host (default `0.0.0.0`)
- `PORT`: bind port (default `3001`)
- `LOG_LEVEL`: `fatal`, `error`, `warn`, `log`, `debug`, or `verbose`
- `CORS_ORIGINS`: comma-separated HTTP(S) browser origins
- `SUPABASE_URL`: Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role secret (required)

The development server allows `http://localhost:3000` by default. Production
does not enable a CORS origin unless `CORS_ORIGINS` is configured.

`GET /health` reports process liveness. It intentionally does not report
database readiness until a database adapter exists. Application and HTTP
request logs are emitted as JSON, and responses include `x-request-id`.

The `SupabaseModule` (at `src/infrastructure/supabase`) provides an injectable
`SupabaseClient` configured with the service role key. Import `SupabaseModule`
in any feature module that needs direct database access. Repositories must
depend on the `SUPABASE_CLIENT` injection token, not on `SupabaseModule`
directly.

Authentication is intentionally added by a later ticket.
