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

The development server allows `http://localhost:3000` by default. Production
does not enable a CORS origin unless `CORS_ORIGINS` is configured.

`GET /health` reports process liveness. It intentionally does not report
database readiness until a database adapter exists. Application and HTTP
request logs are emitted as JSON, and responses include `x-request-id`.

Persistence and authentication are intentionally added by later tickets.
