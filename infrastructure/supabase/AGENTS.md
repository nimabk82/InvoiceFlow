# Supabase Infrastructure — Codex Instructions

Applies to `infrastructure/supabase/**`.

## Role

Supabase is replaceable infrastructure.

Use it for:
- PostgreSQL
- Auth
- Storage
- development infrastructure
- Realtime only when a real product need exists

Do not move general product business logic into Supabase-specific code merely because it is convenient.

## Database

- Version-controlled migrations are source of truth.
- Prefer forward migrations.
- Use explicit constraints/indexes for integrity/performance.
- Keep business-scoped data model compatible with API authorization.
- Do not destructively reset a remote/production database without explicit user instruction.

## Changes

For schema changes:
1. inspect current migrations/schema;
2. create a new migration;
3. update seed data only if needed;
4. run local/dev validation;
5. update relevant repository mappings/tests.

Do not edit historical applied migrations unless the repository explicitly uses a different migration policy.
