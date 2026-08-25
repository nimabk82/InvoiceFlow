# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

InvoiceFlow: a multi-business invoicing/quoting product. Stack is locked:

```text
Web:      Next.js + React + TypeScript
Mobile:   Plain React Native + TypeScript
Backend:  Node.js + NestJS + Fastify
Database: Supabase PostgreSQL
Auth:     Supabase Auth
Storage:  Supabase Storage
Monorepo: pnpm workspaces + Turborepo
```

Web and Mobile call the NestJS API for application workflows; neither talks to Supabase directly for product data. Supabase is infrastructure behind repository/provider abstractions — don't couple domain code directly to Supabase-generated types or scatter direct database queries through Web/Mobile.

## Commands

Run from repo root using pnpm workspace filters (`--filter <pkg>`); package names are `api`, `web`, `mobile`, or the `packages/*` names (e.g. `@invoiceflow/calculations`).

```bash
pnpm --filter api dev              # nest start --watch
pnpm --filter api test             # jest --runInBand --no-watchman
pnpm --filter api test:e2e         # jest -c test/jest-e2e.json
pnpm --filter api lint
pnpm --filter api typecheck

pnpm --filter web dev              # next dev
pnpm --filter web test             # vitest run
pnpm --filter web lint
pnpm --filter web typecheck

pnpm --filter mobile test          # jest --runInBand --no-watchman
pnpm --filter mobile lint
pnpm --filter mobile typecheck

# Run a single test file (jest, from apps/api or apps/mobile):
pnpm --filter api test -- src/modules/invoices/invoices.service.spec.ts

# Run a single test file (vitest, from apps/web):
pnpm --filter web test -- src/theme/theme.test.ts
```

Root-level scripts fan out via Turborepo across the whole workspace: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm typecheck`.

Supabase migrations (run from `infrastructure/supabase/`, not repo root — the CLI resolves `config.toml`/`migrations/` relative to cwd):

```bash
sqlfluff lint infrastructure/supabase/migrations --dialect postgres
supabase db diff --linked
supabase db push
```

Migrations in `infrastructure/supabase/migrations/` are the schema source of truth (forward-only; don't edit applied migrations). Credentials (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`) come from a gitignored `.env`; the project must be linked first (`supabase link --project-ref <ref>`).

## Architecture

### Layering (API)

```text
Controller → Service/Use Case → shared domain/calculations packages → Repository interface → Supabase/PostgreSQL repository
```

Feature modules live under `apps/api/src/modules/<feature>/` (module, controller, service, `dto/`, `domain/`, `repositories/`, `mappers/`). Controllers stay thin; business/workflow rules live in services and platform-neutral packages. Repositories are interfaces (e.g. `InvoiceRepository`) with a Supabase implementation (`SupabaseInvoiceRepository`) bound via DI token — this is what makes Supabase swappable later. The API is authoritative for: business-scoped authorization, invoice/quote workflow and status transitions, quote→invoice conversion, payment recording, numbering, theme lifecycle and immutable theme versions, audit events, and storage/email/PDF orchestration. Pure calculations may live in shared packages, but sensitive workflow transitions never move to Web/Mobile.

### Shared packages (`packages/*`)

Platform-neutral only — must not import Next.js, React Native, or NestJS runtime APIs:

- `domain` — domain models/rules
- `calculations` — deterministic financial calculations (must be covered by focused unit tests)
- `validation` — shared validation contracts
- `types` — cross-platform transport/utility types
- `api-client` — typed client boundary consumed by Web and Mobile
- `document-schema` — shared document contracts (`normalizeDocumentForRendering`, `RenderableDocument`)
- `theme-schema` — document-theme contracts
- `design-tokens` — shared visual tokens consumed by platform themes
- `renderer` — the shared document rendering pipeline (pagination, section/item/totals rendering, print/PDF adapters, diagnostics)
- `utils` — generic platform-neutral utilities

### Document rendering & theming

One shared pipeline drives every surface — do not build separate templates per surface:

```text
Document data + Business/Client snapshots + Selected Theme Version + Document Type
  → normalizeDocumentForRendering() → paginateDocument() → SharedDocumentRenderer
  → Preview / Review / Print / PDF / Client View / Email Attachment
```

Key invariants (see `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`):
- A theme *rename* does not create a new version; a theme *save* does — old versions are retained and drafts don't auto-update.
- Sending a document freezes its `themeVersionId`; later theme edits never change an already-sent document's appearance.
- Historical documents preserve business/client/item snapshots.
- Protected semantic order: `Items < Totals < Deposit`, footer always last.
- Theme controls appearance only — it can never hide invoice/quote number, total, amount column, client identity, an active deposit block, or due/valid-until semantics.
- Theme styling never changes financial calculations.

### Web routing

App Router under `apps/web/src/app/app/[businessId]/...` — every authenticated route is scoped to a business (multi-business is a core concept, see `docs/handoff/01_PRODUCT_REQUIREMENTS.md` and `02_ROUTES_AND_STATES.md`). Document flows (invoices/quotes) follow **Create → Review → Send**. `docs/handoff/design-tokens.json` and `06_RESPONSIVE_ACCESSIBILITY.md` govern UI; prefer desktop-dense-but-responsive layouts and shared component primitives (`src/components/ui/`) over one-offs.

### Mobile

`apps/mobile` is a plain React Native app (native `ios/`/`android/` are first-class — don't regenerate them speculatively) that also calls the NestJS API. Don't import Web-only/DOM/Next.js code into it. Prefer item cards over dense tables and full-screen sheets over desktop-style popovers; the full Theme Builder is not meant to be forced onto a phone.

## Working conventions (from AGENTS.md)

This repo was originally set up for Codex with a layered `AGENTS.md` doc set (root + one per `apps/api`, `apps/web`, `apps/mobile`, `packages`, `infrastructure/supabase`) plus a `docs/handoff/` product/architecture spec and `docs/CODEX_INDEX.md` mapping ticket prefixes (e.g. `INV-*`, `THEME-*`, `API-*`) to the handoff docs actually needed for that ticket. The intent — read only what's relevant, don't reread the whole handoff per task — applies equally here:

- Prefer whichever `AGENTS.md`/`CLAUDE.md` is nearest to the files being changed; it's authoritative for that directory.
- When product behavior is unclear, `docs/handoff/01_PRODUCT_REQUIREMENTS.md` and the other numbered handoff docs are source-of-truth ahead of guessing; `docs/IMPLEMENTATION_STATUS.md` tracks what's actually been built so far.
- Don't build independent Invoice and Quote architectures, and don't duplicate financial calculation logic across Web, Mobile, and API — route it through the shared packages above.
- Supabase migrations are forward-only and are never destructively reset/applied to production without explicit instruction.
