# InvoiceFlow — Implementation Status

Keep this file short. Update it at the end of every completed ticket.

## Current phase

Design-First — prioritize matching `sample.html`; defer feature breadth to the end. See `docs/PLAN_DESIGN_FIRST.md`.

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
- SET-03 — Taxes (Web + API): taxes module with `GET/POST /businesses/:id/taxes` + `GET/PATCH /taxes/:taxId`; Taxes settings screen (create/edit, rate, registration number, default).
- RENDER-03 — Semantic section renderer (`@invoiceflow/renderer`): platform-neutral `renderDocumentSections` producing ordered semantic sections (header→footer) with theme presentation + protected totals/items/deposit.
- RENDER-04 — Item table renderer (`@invoiceflow/renderer`): `renderItemTable` builds table columns (description/amount always, qty/rate per theme) and aligned rows.
- RENDER-05 — Totals + Deposit block (`@invoiceflow/renderer`): `renderTotalsAndDeposit` builds totals rows (subtotal/discount/taxes/total) + deposit block with theme layout/emphasis/style.
- INV-11 — Theme selector in Review (Web): Invoice Review now renders the shared "paper" via `DocumentPaper` + `@invoiceflow/renderer`; built-in preset theme selector (Clean/Modern/Minimal/Blank) changes appearance only.
- DASH-01 — First-Time Dashboard (Web): `/app/:businessId` landing with empty state CTA + stats (total/outstanding/overdue), needs-attention and recent-activity lists.
- FOUND-03 — App shell & navigation (Web): business-scoped layout with desktop sidebar + mobile bottom nav (Dashboard/Invoices/Clients/Products/Settings), active-state highlighting.
- FOUND-04 — Business context & switcher (Web): `BusinessSwitcher` (list + switch via URL context) and `CurrentBusiness` in the app shell; business is the workspace context, data isolated per `businessId`.
- CLIENT-03 — Multiple emails (Web): client form supports adding/removing multiple email addresses.
- Activity timeline (Stage 3): audit module (`SupabaseActivityEventRepository`) + events recorded on create/send/payment/void; `GET /invoices/:id/activity`; timeline on Invoice Detail.
- Stage 3 polish — Invoice list (Web): status tabs (All/Draft/Sent/Partial/Paid/Overdue/Void), search by number/client, and status pills on rows.
- Stage 4 — Settings finish (Web + API): `business_settings` table + `GET/PATCH /businesses/:id/settings`; Payments, Numbering, Branding screens; Manage Businesses screen; settings sub-navigation layout.
- Design pass (web, match `sample.html`): rethemed MUI to the sample design system; app shell (sidebar/topbar/mobile nav); dashboard, invoice list, invoice editor (client card, inline items, sticky summary + sticky editor bar), invoice detail (hero + amount-strip + timeline), clients/products entity grids; review page to preview layout; toast; inline styles moved to reusable CSS classes.
- QUOTE-01 — Quote list (Web + API): quotes module (Supabase repo + service + controller) with `GET/POST /businesses/:id/quotes` + `GET /quotes/:quoteId`; quote list page with tabs/search/pills; Quotes nav.
- QUOTE-02 — Quote editor (Web): quote editor with client selector, items, proposed deposit ("Deposit upon acceptance"), sticky summary + Review bar.
- QUOTE-03 — Quote Review (Web): paper preview via shared renderer + theme selector + summary side panel.
- QUOTE-04 — Send Quote (Web + API): `POST /quotes/:id/send` (draft→sent, email validation, email provider, activity event); send screen with To/CC/BCC/subject/message.
- QUOTE-05..08 — Acceptance, Detail, Convert, Quote↔Invoice (Web + API): `POST /quotes/:id/accept|decline|convert`, `GET /quotes/:id/activity`; quote detail screen with Accept/Decline/Convert actions + activity; convert creates a draft invoice copying snapshots/items/deposit/notes with `sourceQuoteId`, appends `convertedInvoiceIds`, records `converted` event; "View Invoice" link.
- CLIENT-04/05 — Client detail + Archive (Web + API): `POST /clients/:clientId/archive|restore`; list excludes archived unless `includeArchived`; client detail screen (info, invoices for the client, Edit + Archive/Restore).
- PRODUCT-03 — Document library selector (Web + API): `ProductLibraryDialog` searchable picker in the invoice/quote editors; selecting a saved product/service appends a pre-filled line item (name/description/rate) and links it via `sourceProductServiceId` (accepted + persisted on invoice/quote create; custom items still fully supported).
- RENDER-06 — Pagination controller (`@invoiceflow/renderer`): `paginateSections`/`paginateDocument` decompose rendered sections into blocks with estimated heights; page metrics from theme (letter/A4 + compact/standard/spacious + footer reserve); keep-together/keep-with-next/splittable packing (item table splits by row with repeating header, totals+deposit stay together, notes/terms split by paragraph with heading kept with first paragraph, items-header repeats on continuation pages).
- RENDER-07 — Continuation headers (`@invoiceflow/renderer`): pages after the first carry a compact `continuationHeader` (business name + document number via `buildContinuationHeader`); continuation pages reserve header height so content does not collide.
- RENDER-08 — Footer/page numbering (`@invoiceflow/renderer`): footer no longer a flow block; every page carries a resolved `footer` (`buildPageFooter`: business name/website/custom text per theme flags + divider + correct page number), footer height already reserved per page.
- RENDER-09 — Render diagnostics (`@invoiceflow/renderer`): `diagnoseRender` emits `LOW_CONTRAST` (WCAG), `UNSUPPORTED_FONT` (curated set), `INVALID_SECTION_ORDER` (Items<Totals<Deposit + footer last, deposit-aware), `FINANCIAL_BLOCK_SPLIT`, `OVERFLOW` (block taller than page); `contrastRatio` helper.
- RENDER-10 — Print adapter (`@invoiceflow/renderer`): `renderForPrint` returns `{ pages, diagnostics, html }` — a self-contained printable HTML document with `@page` size/margins from the theme, one print page per paginated page, continuation strip + numbered footer per page, HTML escaping, and embedded diagnostics when present.
- RENDER-11 — PDF adapter (`@invoiceflow/renderer`): `renderForPdf` reuses the print HTML (one renderer contract for Print + PDF) and adds a platform-neutral `pdf` render spec (page size/margins in points, page count, footer/continuation reserves) a host can pass to a PDF engine.
- RENDER-12 — Renderer fixture suite (`@invoiceflow/renderer`): 6 fixtures (standard, deposit, long client, long items, 45-item multi-page, quote) × 3 preset themes = 18 render cases asserting the full pipeline (sections → pagination → print → pdf).
- THEME-01..07 — Theme management (Web + API): `ThemesModule` (`GET/POST /businesses/:id/themes`, `GET/PATCH /:themeId`, `/:id/duplicate|archive|restore`, `POST /:id/versions`); create-from-preset (validated), duplicate, rename, archive/restore, set invoice/quote default, immutable version creation on saveConfig; Settings → Document Themes screen with preset picker, rename/duplicate/archive/restore/defaults actions.
- TVER-02..08 — Theme lifecycle (Web + API): `ThemeAssignmentModule` resolves the default invoice/quote theme and assigns `themeId`/`themeVersionId`/`themeNameSnapshot` on document create (TVER-07); theme is frozen on send (TVER-04); quote→invoice convert preserves the quote theme (TVER-08); `GET /themes/:id/versions/:versionId` historical lookup (TVER-05); `version-state` (newer version available) + `adopt-latest-theme` endpoints with Review-page "Adopt latest" banner on invoices and quotes (TVER-02/03); old versions retained (TVER-06).
- THEME-08..22 — Theme Builder (Web): `/settings/themes/:themeId/edit` three-panel builder — Structure (section toggles + safe reorder, Items<Totals<Deposit + footer last enforced), live `DocumentPaper` preview, and Properties (page size/margin/border/background, brand colors + logo size, typography, header/bill-to/items/totals/deposit/footer controls); undo/redo history; live `diagnoseRender` diagnostics banner (warnings don't block save); Save creates a new immutable version. Themes list links to the builder.
- AUTH-03 — Forgot/Reset Password (Web): `/auth/forgot-password` sends a Supabase reset email with a redirect to `/auth/reset-password`, which verifies the recovery session and updates the password; "Forgot password?" link on sign-in.
- QA-01..09 — Acceptance matrices (docs/QA_ACCEPTANCE_STATUS.md): QA-05 calculation tests, QA-06 renderer 18-case baseline, and QA-07/08/09 service-level E2E are automated; QA-01..04 device/keyboard matrices documented for manual pass.
- INV-08 — Draft editing without autosave (Web + API): draft update endpoints `PATCH /invoices/:id` and `PATCH /quotes/:id` are used by `/invoices/new?draftId=` and `/quotes/new?draftId=`; editors hydrate persisted drafts and save only on Review. New drafts POST once, then Review links explicitly return to edit mode.
- Phase 1 web stabilization — API client coalesces identical in-flight GETs by base URL/path/auth and evicts settled requests; detail pages retain cancellable effects without broken start guards; invoice/quote draft Review loops persist edits without claiming autosave.
- Phase 1 API validation slice — authoritative invoice/quote final-send checks, explicit client ownership validation, and decimal-safe payment eligibility/balance enforcement through shared validation/calculation packages.
- Phase 1 account/email hardening — first-business provisioning atomically creates the auth-backed account, business, and owner membership through a service-role-only RPC; validated email provider selection rejects logger use in production and otherwise fails closed when delivery is disabled.
- Phase 1 atomic workflow hardening — PostgreSQL RPCs provide transactional invoice/quote aggregate saves, draft-to-sent compare-and-set transitions, and atomic quote-to-invoice conversion with stale-write protection.

## Current ticket

- Phase 1 production hardening — web draft/load stabilization and the first API validation, atomic workflow, account provisioning, and email-safety slices are implemented. Remaining work: atomic payment recording, atomic theme-version creation, and a durable email outbox/real provider.

## In-progress (session handoff, 2026-08-22)

- None. Phase 1 migrations `20260822120000_atomic_document_workflows.sql` and `20260822130000_provision_owner_business.sql` are applied to the linked development project. Supabase commands must run from `infrastructure/supabase/`; running from the repository root makes the CLI miss the configured migration directory and falsely reports remote-only versions.
- **Earlier fix this session: invoice/quote detail routes returned 404** because the `next dev` server (PID 8804) had a stale route manifest after many file additions. Restarted web dev server (`nohup pnpm dev > /tmp/web-dev.log 2>&1 &` in `apps/web`); all routes now 200. If 404s reappear after route additions, restart the dev server.
- **Committed this session:** `1dbbd1c` — reverted INV-08 autosave in web editors (static "Saved ✓", create on Review/Submit; `useAutosave` + `SaveStateBadge` deleted, `@invoiceflow/domain` removed from web deps; API PATCH draft endpoints retained). All web + api + root checks green before commit.

## Next recommended tickets

All planned tickets (Platform, Foundation, Domain, API, DB, Renderer, Themes, Lifecycle, Quotes, Clients, Products, Settings, Auth, QA) are complete. Remaining work is the manual device/keyboard QA pass documented in `docs/QA_ACCEPTANCE_STATUS.md`, plus optional deferred surfaces (currency-change warning, client-facing view, re-enabling autosave).

## Deferred to the end (design plan)

- Manual QA pass (device/keyboard matrices) — see `docs/QA_ACCEPTANCE_STATUS.md`.
- Currency-change warning, client-facing view / email attachment renderer surface, re-enable autosave (INV-08).
- CLIENT-04 — Detail, CLIENT-05 — Archive
- AUTH-03 — Forgot/Reset Password
- QA-01..09 — matrices (acceptance at end)

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
- SET-03 — web lint/typecheck/build; api lint/typecheck/test (118 passed)/build; api-client lint/typecheck/test/build; end-to-end taxes CRUD verified
- RENDER-03 — renderer package lint/typecheck/build + test (3 passed); root typecheck
- RENDER-04 — renderer package lint/typecheck/build + test (6 passed)
- RENDER-05 — renderer package lint/typecheck/build + test (10 passed)
- INV-11 — web lint/typecheck/build; api-client lint/typecheck/test/build; renderer/document-schema/theme-schema tests pass; shared render packages export dist
- DASH-01 — web lint/typecheck/build
- FOUND-03 — web lint/typecheck/build
- FOUND-04 — web lint/typecheck/build
- CLIENT-03 — web lint/typecheck/build
- Activity timeline — web lint/typecheck/build; api lint/typecheck/test (118 passed)/build; api-client lint/typecheck/test/build; end-to-end activity recording verified
- Invoice list polish — web lint/typecheck/build
- Stage 4 settings — web lint/typecheck/build; api lint/typecheck/test (118 passed)/build; api-client lint/typecheck/test/build; sqlfluff migration clean; migration applied; end-to-end settings GET/PATCH verified
- PRODUCT-03 — web lint/typecheck/test/build; api lint/typecheck/test (126 passed); api-client lint/typecheck/test/build
- RENDER-06 — renderer package lint/typecheck/build + test (22 passed); root typecheck
- RENDER-07 — renderer package lint/typecheck/build + test (27 passed); root typecheck
- RENDER-08 — renderer package lint/typecheck/build + test (31 passed); root typecheck
- RENDER-09 — renderer package lint/typecheck/build + test (39 passed); root typecheck
- RENDER-10 — renderer package lint/typecheck/build + test (46 passed); root typecheck
- RENDER-11 + RENDER-12 — renderer package lint/typecheck/build + test (69 passed); root typecheck
- THEME-01..07 — api lint/typecheck/test (132 passed)/build; api-client lint/typecheck/test/build; web lint/typecheck/test/build; root typecheck
- TVER-02..08 — api lint/typecheck/test (133 passed)/build; api-client lint/typecheck/test/build; web lint/typecheck/build; root typecheck
- THEME-08..22 — web lint/typecheck/test/build; root typecheck
- AUTH-03 — web lint/typecheck/test/build (routes /auth/forgot-password, /auth/reset-password)
- QA-01..09 — matrices documented in docs/QA_ACCEPTANCE_STATUS.md; automated coverage via calculations/validation/renderer/api suites
- INV-08 — api lint/typecheck/test (136 passed)/build; api-client lint/typecheck/test/build; web lint/typecheck/test/build; domain dist export + root typecheck. (Autosave disabled — editors create on Review/Submit; PATCH endpoints retained.)
- Phase 1 web stabilization — api-client lint/typecheck/test (9 passed)/build; web lint/typecheck/test (2 passed)/build.
- Phase 1 API hardening — API lint/typecheck/test (156 passed)/build; validation lint/typecheck/test (9 passed)/build.
- Phase 1 migrations — linked local/remote history aligned through `20260822130000`; `supabase db push --linked --dry-run` reports up to date; linked schema lint reports no errors. Commands run from `infrastructure/supabase/`.

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
