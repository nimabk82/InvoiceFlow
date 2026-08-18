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

The development server listens on `0.0.0.0:3001` by default and honors the
`PORT` environment variable.

Product modules, configuration, health checks, logging, persistence, and
authentication are intentionally added by later tickets.
