# InvoiceFlow — Implementation Status

Keep this file short. Update it at the end of every completed ticket.

## Current phase

Sprint 0 — Platform foundation

## Completed

- Product/UX handoff finalized.
- Technical stack selected.
- Codex bootstrap/config prepared.
- Environment bootstrap verified (2026-08-17).
- PLATFORM-01 — pnpm workspace and Turborepo foundation.
- PLATFORM-02 — Next.js web bootstrap with MUI Material theme/provider architecture.
- PLATFORM-03 — Plain React Native mobile bootstrap with Paper/navigation theme providers.
- PLATFORM-04 — NestJS API bootstrap with the Fastify adapter.
- PLATFORM-05 — Shared TypeScript package foundations and cross-platform design tokens.
- FOUND-01 — Finalized shared design tokens and MUI/React Native Paper theme mappings.
- FOUND-02 — Reusable Web/Mobile UI primitive wrappers.
- API-01 — API configuration, health endpoint, and structured logging.
- API-02 — Supabase PostgreSQL adapter (`SupabaseModule` with injectable client).

## Current ticket

- API-03 — Repository abstractions (next).

## Next recommended tickets

1. API-03 — Repository abstractions
3. API-03 — Repository abstractions
4. DB-01 — Core schema
5. API-04 — Authentication boundary
6. API-05 — Business authorization

## Locked decisions

- Web: Next.js + React + TypeScript
- Web UI component library: MUI Material
- Mobile: plain React Native + TypeScript
- Mobile UI component library: React Native Paper
- Backend: Node.js + NestJS + Fastify
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Monorepo: pnpm workspaces + Turborepo
- Shared design tokens live in `packages/design-tokens`
- MUI and React Native Paper consume the same InvoiceFlow design tokens
- Web and Mobile use separate platform-specific UI components
- Do not force shared visual components between MUI and React Native Paper
- Feature screens should prefer app-owned UI wrappers instead of importing MUI/Paper directly everywhere
- Web/Mobile call NestJS API for application workflows
- Supabase remains replaceable infrastructure
- shared Invoice/Quote domain architecture
- shared document renderer
- immutable/frozen theme versions for sent documents

## UI architecture

```text
packages/design-tokens
        │
        ├── apps/web
        │    └── MUI theme
        │         └── Web UI wrappers
        │
        └── apps/mobile
             └── React Native Paper theme
                  └── Mobile UI wrappers
```

Planned shared tokens:

```text
packages/design-tokens/
├── colors
├── spacing
├── radius
├── typography
├── sizing
└── breakpoints
```

Web UI wrappers:

```text
apps/web/components/ui/
├── Button
├── TextField
├── Select
├── Checkbox
├── Dialog
├── Drawer
├── StatusBadge
└── other shared web primitives
```

Mobile UI wrappers:

```text
apps/mobile/src/components/ui/
├── Button
├── TextInput
├── Select
├── Checkbox
├── Dialog
├── BottomSheet
├── StatusBadge
└── other shared mobile primitives
```

## PLATFORM-02 requirements

In addition to the base Next.js bootstrap:

- Install and configure MUI Material.
- Install MUI Icons.
- Configure required MUI styling dependencies.
- Add the application MUI ThemeProvider.
- Create an initial InvoiceFlow MUI theme.
- Keep the theme ready to consume `packages/design-tokens`.
- Do not build feature screens yet.
- Do not scatter raw MUI styling throughout feature code.

## PLATFORM-03 requirements

In addition to the base React Native bootstrap:

- Install and configure React Native Paper.
- Add `PaperProvider` at the application root.
- Prepare Paper theme integration.
- Integrate cleanly with React Navigation when navigation is added.
- Keep the theme ready to consume `packages/design-tokens`.
- Do not build feature screens yet.

## PLATFORM-05 requirements

Create platform-neutral shared packages, including:

```text
packages/
├── domain/
├── calculations/
├── validation/
├── types/
├── api-client/
├── document-schema/
├── theme-schema/
├── design-tokens/
└── utils/
```

`packages/design-tokens` becomes the source of truth for shared visual tokens used by both MUI and React Native Paper.

## Environment status

```text
Repository/Git: initialized on main; origin configured and reachable; remote has no refs
Git authenticated: YES
GitHub CLI authenticated: YES
Node version: 22.18.0
pnpm version: 10.34.5 (repository-pinned)
Xcode/iOS prerequisites: READY — Xcode 26.5 runtime installed; simulator build succeeds
Android prerequisites: READY WITH WARNINGS — Android Studio, JDK 17, adb/emulator and SDK 34-36 installed
NestJS prerequisites: READY — Node available; Nest CLI 11.0.24 resolves through npx
Supabase CLI authenticated: YES
Supabase project linked: YES
Supabase target classification (dev/staging/prod): DEVELOPMENT
Android sdkmanager: VERIFIED
Watchman: VERIFIED
```

## Known blockers

- None.

## Last verified

- `pnpm install --frozen-lockfile`
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pnpm --filter mobile lint`, `typecheck`, and `test`
- `bundle exec pod install` (89 dependencies; native modules autolinked)
- Android `:app:assembleDebug`
- iOS 26.5 simulator build
- `pnpm --filter api lint`, `typecheck`, `test`, `test:e2e`, and `build`
- Shared-package lint, typecheck, build, and design-token contract test
- Web theme lint, typecheck, test, and production build using finalized tokens
- Mobile theme lint, typecheck, test, and Metro production bundle using finalized tokens
- Web/Mobile UI primitive lint, typecheck, and contract tests
- Root `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`

## Status update format

After each ticket, keep only concise entries:

```text
Completed:
- PLATFORM-01 — Monorepo

Current:
- PLATFORM-02 — Next.js + MUI bootstrap

Known blockers:
- none

Last verified:
- pnpm lint ...
- pnpm typecheck ...
```

Do not turn this into a changelog. Git history is the detailed history.
