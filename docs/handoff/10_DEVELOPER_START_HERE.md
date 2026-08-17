# 10 — Developer Start Here

## Locked technical stack

```text
Web
Next.js + React + TypeScript

Mobile
Plain React Native + TypeScript
iOS + Android

Backend
Node.js
NestJS
Fastify adapter

Infrastructure for now
Supabase PostgreSQL
Supabase Auth
Supabase Storage

Monorepo
pnpm workspaces
Turborepo
```

## Core architecture rule

> Supabase is infrastructure, not the application architecture.

Web and Mobile primarily call the NestJS API.

NestJS owns:
- business authorization
- invoice/quote workflows
- payment transitions
- numbering
- theme lifecycle
- document finalization
- persistence orchestration
- external provider orchestration

Shared packages own pure, platform-neutral logic:
- financial calculations
- validation schemas
- document contracts
- theme contracts
- shared types

Infrastructure adapters own:
- Supabase PostgreSQL
- Supabase Auth integration/verification
- Supabase Storage
- future Azure implementations

## Initial repository

```text
invoiceflow/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── api/
├── packages/
│   ├── domain/
│   ├── calculations/
│   ├── validation/
│   ├── types/
│   ├── api-client/
│   ├── document-schema/
│   ├── theme-schema/
│   ├── design-tokens/
│   └── utils/
└── infrastructure/
    └── supabase/
        ├── migrations/
        ├── seed/
        └── local/
```

## Sprint 0 — Platform foundation

Build:
- PLATFORM-01 through PLATFORM-05
- API-01 through API-05
- DB-01
- Web → API request
- Mobile → API request
- authenticated business context

Exit:

> Both client apps can call the NestJS API and the API can access Supabase through repository abstractions.

## Implementation traps to avoid

1. Do not put backend workflow rules in Web or Mobile.
2. Do not couple domain models directly to Supabase database types.
3. Do not scatter direct Supabase DB queries across Next.js and React Native.
4. Do not build separate Invoice and Quote editors.
5. Do not build separate document markup for Preview / PDF / Print.
6. Do not let sent documents read the theme's current version.
