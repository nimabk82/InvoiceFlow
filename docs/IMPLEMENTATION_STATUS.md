# InvoiceFlow — Implementation Status

Keep this file short. Update it at the end of every completed ticket.

## Current phase

Sprint 0 — Platform foundation

## Completed

- Product/UX handoff finalized.
- Technical stack selected.
- Codex bootstrap/config prepared.
- Environment bootstrap verified (2026-08-17).

## Current ticket

- PLATFORM-01 — Monorepo (next).

## Next recommended tickets

1. PLATFORM-01 — Monorepo
2. PLATFORM-02 — Next.js web bootstrap
3. PLATFORM-03 — Plain React Native mobile bootstrap
4. PLATFORM-04 — NestJS + Fastify API bootstrap
5. PLATFORM-05 — Shared TypeScript packages
6. API-01 — API configuration / health / logging
7. API-02 — Supabase PostgreSQL adapter
8. API-03 — Repository abstractions
9. DB-01 — Core schema
10. API-04 — Authentication boundary
11. API-05 — Business authorization

## Locked decisions

- Web: Next.js + React + TypeScript
- Mobile: plain React Native + TypeScript
- Backend: Node.js + NestJS + Fastify
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Monorepo: pnpm workspaces + Turborepo
- Web/Mobile call NestJS API for application workflows
- Supabase remains replaceable infrastructure
- shared Invoice/Quote domain architecture
- shared document renderer
- immutable/frozen theme versions for sent documents

## Environment status

```text
Repository/Git: initialized on unborn main; origin configured and reachable; remote has no refs
Git authenticated: UNVERIFIED (origin read requires no credentials; authenticated write not tested)
GitHub CLI authenticated: NO — configured token for nimabk82 is invalid
Node version: 22.18.0
pnpm version: not on PATH; Corepack resolves pnpm 6.11.0
Xcode/iOS prerequisites: READY — Xcode 26.5, CocoaPods 1.16.2, iOS 18.1/26.2 simulators
Android prerequisites: READY WITH WARNINGS — Android Studio, JDK 17, adb/emulator and SDK 34-36 installed
NestJS prerequisites: READY — Node available; Nest CLI 11.0.24 resolves through npx
Supabase CLI authenticated: YES — CLI 2.114.0 resolves through npx (not on PATH)
Supabase project linked: NO
Supabase target classification (dev/staging/prod): NONE — no current linked target
```

## Known blockers

- GitHub CLI must be re-authenticated before GitHub write workflows.
- Link an explicitly classified non-production Supabase project before remote database work.
- Install/activate the ticket-pinned pnpm version during PLATFORM-01; no direct pnpm executable exists yet.
- Repair the Watchman/Folly dynamic-library mismatch before React Native development.
- Android `sdkmanager` on PATH points to deprecated tools; use/update `cmdline-tools/latest` (currently 13.0 and emits metadata-version warnings).

## Status update format

After each ticket, keep only concise entries:

```text
Completed:
- PLATFORM-01 — Monorepo

Current:
- PLATFORM-02 — Next.js bootstrap

Known blockers:
- none

Last verified:
- pnpm lint ...
- pnpm typecheck ...
```

Do not turn this into a changelog. Git history is the detailed history.
