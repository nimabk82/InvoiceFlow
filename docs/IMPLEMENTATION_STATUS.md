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
- API-03 — Repository abstractions (`packages/domain` types + per-feature repository interfaces and DI tokens).
- DB-01 — Core schema migration (accounts, businesses, memberships, clients, client emails, product services, taxes).
- DB-02 — Document schema migration (invoices, quotes, items, item taxes, payments, activity events).
- DB-03 — Theme schema migration (themes, immutable versions, document/version references).
- DB-04 — Version-controlled migrations tooling (`infrastructure/supabase/config.toml`, sqlfluff, README).
- API-04 — Supabase auth verification boundary (`Authentication`, `AuthGuard`, `CurrentAccount`).
- API-05 — Business authorization guard and access service (`isMember` policy).
- API-06 — File storage abstraction + Supabase Storage adapter (`FileStorage`).
- API-07 — Email provider abstraction (`EmailProvider`, logger adapter).
- API-08 — Typed API client for Web + Mobile (`@invoiceflow/api-client`).
- DOMAIN-01 — Money model (decimal-safe, minor-unit) in `@invoiceflow/calculations`.
- DOMAIN-02 — Document calculator (subtotal/discount/tax/total/deposit) in `@invoiceflow/calculations`.
- DOMAIN-03 — Document validation layers (edit/review/send) in `@invoiceflow/validation`.
- DOMAIN-04 — Autosave state contract (`SaveState`, `autosaveReducer`) in `@invoiceflow/domain`.
- RENDER-01 — Normalize `RenderableDocument` for the shared renderer (`@invoiceflow/document-schema`).
- RENDER-02 — Theme schema validation (structure, enums, protected section order) in `@invoiceflow/theme-schema`.
- AUTH-01 — Sign In (Web): `/auth/sign-in` via Supabase Auth.
- AUTH-02 — Sign Up (Web): `/auth/sign-up` via Supabase Auth.
- AUTH-01 — Sign In (Mobile).
- AUTH-02 — Sign Up (Mobile).
- THEME-02 — Built-in presets (clean, modern, minimal, blank) in `@invoiceflow/theme-schema`.
- ONBOARD-01 — First Business (Web) + businesses API (`POST/GET /businesses`, Supabase repository adapter).
- CLIENT-01 — Client list (Web) + clients API (`GET /businesses/:businessId/clients`, Supabase repository adapter).
- PRODUCT-01 — Product/Service list (Web) + products API (`GET /businesses/:businessId/products`, Supabase repository adapter).
- INV-01 — Invoice list (Web) + invoices API (`GET /businesses/:businessId/invoices`, Supabase repository adapter).
- INV-02 — New Invoice editor (Web) + `POST /businesses/:businessId/invoices` (server-side snapshots + item persistence).
- INV-03 — Client selector + inline Add Client in the invoice editor (`POST /businesses/:businessId/clients`).
- INV-04 — Line item editor (secondary description + live per-item totals/subtotal via shared calculator).
- INV-05 — Taxes (per-item tax components + tax/total display in the invoice editor).
- CLIENT-02 — Create/Edit client (Web) + `GET/PATCH /clients/:clientId`.
- PRODUCT-02 — Create/Edit item (Web) + `POST/GET/PATCH /products/:productId`.
- INV-06 — Deposit editor (Web) + `depositTerms` through api-client and invoice create API.
- INV-07 — More Options (Web): Discount (percentage/fixed) + PO # through api-client and invoice create API.
- INV-09 — Review validation (Web): gate Review Invoice on blocking issues (select client, ≥1 item, rate), focus first issue; validate on progression (no red wall on load); wire `@invoiceflow/validation` into web.
- INV-10 — Invoice Review (Web): read-only preview + summary via `GET /invoices/:invoiceId`; Continue to Send / Back to Edit actions.
- INV-12 — Send Invoice (Web + API): `POST /invoices/:id/send` transitions draft→sent + sets sentAt, validates emails, sends via email provider; Send screen (To/CC/BCC chips, subject, message, total/deposit summary).
- INV-13 — Invoice Detail (Web): permanent home for an invoice — status badge, business/client, items + totals, Paid/Balance summary; Send Again action; list rows link to detail.
- INV-14 — Record Payment (Web + API): `POST/GET /invoices/:id/payments` via new `PaymentsModule`/Supabase repo; records a payment and derives status (paid / partially_paid); Record Payment dialog in Detail.
- INV-15 — Partial/Paid status derivation (API): derive effective payment status on read (`getInvoiceWithStatus`); shared `derivePaymentStatus` helper.
- SET-01 — Business Profile (Web + API): `GET/PATCH /businesses/:businessId`; profile screen (name, legal name, email, phone, website, address, country, currency).
- INV-16 — Duplicate / Void / Delete Draft (Web + API): `POST /invoices/:id/duplicate`, `POST /invoices/:id/void`, `DELETE /invoices/:id` (draft-only); Detail actions.
- SET-02 — Document Defaults (Web + API): `document_defaults` table + `GET/PATCH /businesses/:id/document-defaults`; screen for default due rule, notes, terms, default tax IDs (theme defaults stored but no picker yet).

## Current ticket

- SET-03 — Taxes (next).

## Next recommended tickets

1. INV-16 — Duplicate / Void / Delete Draft
2. SET-02 — Document Defaults

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
- `sqlfluff lint infrastructure/supabase/migrations` (all DB-01/02/03 migrations parse + lint clean)
- `pnpm --filter api lint`, `typecheck`, `test` (89 passed), and `build` (businesses/clients/products/invoices modules)
- `pnpm --filter @invoiceflow/domain lint`, `typecheck`, `build`, and `test` (4 passed)
- `pnpm --filter @invoiceflow/api-client lint`, `typecheck`, `build`, and `test` (3 passed)
- `pnpm --filter @invoiceflow/calculations lint`, `typecheck`, `build`, and `test` (11 passed)
- `pnpm --filter @invoiceflow/validation lint`, `typecheck`, `build`, and `test` (7 passed)
- `pnpm --filter @invoiceflow/domain lint`, `typecheck`, `build`, and `test` (4 passed)
- `pnpm --filter @invoiceflow/document-schema lint`, `typecheck`, `build`, and `test` (4 passed)
- `pnpm --filter @invoiceflow/theme-schema lint`, `typecheck`, `build`, and `test` (5 passed)
- `pnpm --filter web lint`, `typecheck`, `test` (2 passed), and `build` (routes `/`, `/auth/sign-in`, `/auth/sign-up`, `/onboarding/business`)
- `pnpm --filter mobile lint`, `typecheck`, and `test` (3 passed)
- `pnpm --filter @invoiceflow/theme-schema lint`, `typecheck`, `build`, and `test` (7 passed)
- `pnpm --filter @invoiceflow/api-client lint`, `typecheck`, `build`, and `test` (4 passed)
- Root `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- INV-06 — web lint/typecheck/test; api lint/typecheck/test (105 passed)/build; api-client lint/typecheck/test/build; end-to-end deposit persistence verified
- INV-07 — web lint/typecheck/test; api lint/typecheck/test/build; api-client lint/typecheck/test/build; end-to-end discount + PO # persistence verified
- INV-09 — web lint/typecheck/test/build; validation package lint/typecheck/test (7 passed); `@invoiceflow/validation` added to web deps + transpilePackages (consolidated to single-file entry)
- INV-10 — web lint/typecheck/build; api lint/typecheck/test/build; api-client lint/typecheck/test/build; end-to-end GET /invoices/:id verified
- INV-12 — web lint/typecheck/build; api lint/typecheck/test (107 passed)/build; api-client lint/typecheck/test/build; end-to-end send (draft→sent) verified
- INV-13 — web lint/typecheck/test/build
- INV-14 — web lint/typecheck/build; api lint/typecheck/test (109 passed)/build; api-client lint/typecheck/test/build; end-to-end record payment + status derivation verified
- INV-15 — api lint/typecheck/test (110 passed)/build; end-to-end read-time status derivation verified
- SET-01 — web lint/typecheck/build; api lint/typecheck/test/build; api-client lint/typecheck/test/build; end-to-end business GET/PATCH verified
- INV-16 — web lint/typecheck/build; api lint/typecheck/test (113 passed)/build; api-client lint/typecheck/test/build; end-to-end duplicate/void/delete verified
- SET-02 — web lint/typecheck/build; api lint/typecheck/test (115 passed)/build; api-client lint/typecheck/test/build; sqlfluff migration clean; migration applied; end-to-end GET/PATCH defaults verified

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
