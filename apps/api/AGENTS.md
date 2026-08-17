# API — Codex Instructions

Applies to `apps/api/**`.

## Architecture

- Node.js + NestJS + Fastify.
- Controllers stay thin.
- Business/workflow rules belong in services/use-cases and platform-neutral domain/calculation packages.
- Persistence goes through repository interfaces.
- Supabase/PostgreSQL belongs in infrastructure adapters, not domain services.
- Business-scoped authorization is enforced server-side.
- API owns authoritative document/payment/status/theme workflow transitions.

## Structure

Prefer feature modules:

```text
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
├── domain/
├── repositories/
└── mappers/
```

Do not create layers/files that provide no meaningful separation.

## Contracts

- Validate transport input at the boundary.
- Map DTO/database records to domain-owned types.
- Use consistent application errors; do not leak raw database/provider errors.
- Keep API response contracts stable and typed.

## Tests

For affected API work, run the narrowest available equivalents of:

```bash
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
```

Use actual package scripts if names differ.
