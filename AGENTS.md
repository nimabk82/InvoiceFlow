# InvoiceFlow — Codex Instructions

## Goal

Implement InvoiceFlow ticket-by-ticket with minimal context loading and minimal user interruption.

## Locked stack

- Web: Next.js + React + TypeScript
- Mobile: plain React Native + TypeScript
- Backend: Node.js + NestJS + Fastify
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Monorepo: pnpm workspaces + Turborepo

Web and Mobile primarily call the NestJS API for application workflows.

Supabase is infrastructure behind repository/provider abstractions. Do not couple product-domain code directly to Supabase-generated database types.

## Before every implementation task

1. Read `docs/CODEX_INDEX.md`.
2. Read `docs/IMPLEMENTATION_STATUS.md`.
3. Read ONLY the handoff documents mapped to the current ticket in `docs/CODEX_INDEX.md`.
4. Inspect the existing implementation relevant to the task.
5. Do not scan or summarize the entire repository unless the task genuinely requires it.

## Working behavior

- Do not ask permission to read or edit files inside this repository.
- Make normal repository changes required by the current ticket without asking for confirmation.
- Do not stop after planning when the task asks for implementation.
- Do not ask broad architectural questions when the answer already exists in `docs/handoff/`.
- If a minor implementation detail is unspecified, choose the smallest option consistent with existing code and the handoff.
- Ask the user only when a required secret/credential is missing, a destructive operation is necessary, or two materially different product decisions cannot be resolved from source-of-truth docs.
- Do not modify unrelated files.
- Prefer existing dependencies and patterns before adding new ones.
- Do not expose, print, copy, or commit secrets.

## Source-of-truth order

When sources disagree:

1. Current user task
2. `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
3. `docs/handoff/02_ROUTES_AND_STATES.md`
4. `docs/handoff/03_COMPONENT_ARCHITECTURE.md`
5. `docs/handoff/04_DATA_MODEL.md`
6. `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`
7. `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`
8. `docs/handoff/11_BACKEND_AND_MONOREPO_ARCHITECTURE.md`
9. Existing implementation
10. Prototype/reference code

Do not invent missing product behavior when a source-of-truth document can answer it.

## Architecture invariants

- Do not build independent Invoice and Quote architectures.
- Do not duplicate financial calculation logic across Web, Mobile, and API.
- Backend is authoritative for sensitive workflow/status transitions.
- Persistence is accessed through repository/provider interfaces.
- Do not scatter direct Supabase database queries through Web or Mobile.
- Theme styling never changes financial calculations.
- Preview, Review, Print, PDF, client view, and email attachment use one shared document renderer contract.
- Sent/finalized documents render their frozen theme version, never the theme's current version.
- Historical documents preserve client/business/item snapshots.

## Git

Routine Git work is authorized:

- inspect status/diff/log
- create/switch feature branches
- fetch/pull normally
- stage task-related files
- commit completed ticket work
- push a normal feature branch when the current task requires it
- create/update a PR when the current task requires it

Never:

- force-push
- rewrite published history
- use destructive reset to discard user work
- delete unrelated branches
- commit secrets
- push directly to `main` or `master` unless the user explicitly requests it

Before committing:
- inspect `git diff`
- ensure only task-related changes are included

## Supabase

The development Supabase project is authorized for normal implementation work.

Allowed without asking when needed for the ticket:

- inspect local/project configuration
- inspect schema and migrations
- create migrations
- run local Supabase
- run schema diff/lint commands
- inspect development data
- apply non-destructive migrations to the configured development environment
- create/update development-only seed data

Never without explicit user instruction:

- reset production
- delete production data
- delete a project
- rotate/reveal secrets
- apply an operation known to be destructive to production
- bypass repository/provider architecture by moving product business logic into database triggers or Edge Functions

Treat migrations in version control as the schema source of truth.

## Dependencies

Before adding a dependency:
1. search current workspace/package manifests;
2. prefer an existing library;
3. add the dependency only if it materially simplifies the ticket.

Avoid speculative dependencies.

## Testing

Run the smallest relevant verification first.

Examples:
- package-specific lint/typecheck/test
- focused unit test
- API module test
- affected app build only when useful

Before completion, run the checks required by the nearest nested `AGENTS.md`.

Fix failures caused by your changes.

Do not spend tokens narrating routine command output unless it represents a blocker.

## Ticket completion

For an implementation ticket:

1. implement it;
2. test it;
3. inspect diff;
4. commit it if Git is available;
5. update `docs/IMPLEMENTATION_STATUS.md`.

Do not mark a ticket complete if required tests are failing due to your changes.

## Response style

Keep final response short.

Report only:
- completed ticket / outcome
- important files changed
- tests/checks run
- commit hash if committed
- genuine remaining blocker, if any

Do not repeat architecture or provide a long retrospective unless asked.
