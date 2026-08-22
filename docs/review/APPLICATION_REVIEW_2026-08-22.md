# InvoiceFlow Application Review

Date: 2026-08-22  
Reviewed revision: `ea41815`  
Perspective: senior software engineering, product UI/UX, responsive design, and accessibility

## Executive summary

InvoiceFlow has a sound intended architecture: a NestJS workflow API, repository boundaries around Supabase, shared financial and rendering packages, a coherent web design language, and broad domain coverage. The web application demonstrates most of the invoice and quote lifecycle, and the shared renderer/calculation packages are stronger than a typical early-stage implementation.

The application is not production-ready. The most important risks are authoritative validation and transactional integrity in the API, misleading or broken draft behavior in the web editor, incomplete tenant/reference validation, a development regression in detail-page loading, and a mobile application that remains an authentication bootstrap rather than a usable product. Several customer-facing document and payment behaviors can also show incorrect information.

Recommended release posture:

| Surface | Assessment |
|---|---|
| Web demo | Usable for controlled demonstrations after P0/P1 fixes |
| Web production | Not ready |
| API production | Not ready due to integrity, validation, and delivery risks |
| Mobile | Bootstrap only; not a functional InvoiceFlow client |
| Accessibility | Partial; key keyboard, responsive, announcement, and touch-target gaps remain |

## Review method and scope

The review covered:

- `apps/api`, including authentication, authorization boundaries, invoice/quote/payment workflows, repository persistence, and transport handling.
- `apps/web`, including primary workflows, state management, responsive layouts, accessibility semantics, document rendering, settings, and tests.
- `apps/mobile`, including navigation, authentication, session handling, primitives, product scope, and tests.
- Shared API client, calculation, validation, renderer, and schema packages where they affect application behavior.
- Supabase migrations for integrity and tenancy constraints.
- Product requirements in `docs/handoff/01_PRODUCT_REQUIREMENTS.md` and responsive/accessibility requirements in `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`.

This was primarily a static review. No browser, screen-reader, real-device, concurrency, or failure-injection pass was performed. Web and mobile package tests were run during the review; their current coverage is too shallow to validate the workflows discussed below.

## Priority definitions

- **P0 - Release blocker:** likely data loss/corruption, unusable core flow, false delivery state, or missing product surface.
- **P1 - High:** major correctness, security, customer-facing document, payment, or responsive workflow defect.
- **P2 - Medium:** material usability, accessibility, maintainability, or reliability gap.
- **P3 - Low:** polish or consistency issue with limited workflow impact.

## P0 findings

### 1. Document workflows are not transactional or concurrency-safe

Evidence:

- Aggregate persistence performs parent, item deletion/insertion, and tax insertion as separate operations in `apps/api/src/modules/invoices/repositories/supabase-invoice.repository.ts:151-209` and `apps/api/src/modules/quotes/repositories/supabase-quote.repository.ts:146-204`.
- Invoice send reads status, sends email, then persists status in separate operations at `apps/api/src/modules/invoices/invoices.service.ts:139-180`.
- Quote conversion creates an invoice and updates the quote through independent operations at `apps/api/src/modules/quotes/quotes.service.ts:338-388`.

Impact:

- A failed aggregate save can leave a document without all items or taxes.
- Concurrent send requests can deliver the same document more than once.
- Concurrent quote conversions can create multiple invoices.
- A conversion can create an invoice without completing the reverse link or activity event.

Recommendation:

Create transactional repository operations for complete document saves and quote conversion. Use atomic compare-and-set status transitions, idempotency keys for external commands, and an outbox pattern for email. Add concurrent-request and fault-injection tests.

### 2. The API does not enforce complete document validation before send

Evidence:

- Invoice send validates status and email syntax only at `apps/api/src/modules/invoices/invoices.service.ts:139-180`.
- Quote send follows the same pattern at `apps/api/src/modules/quotes/quotes.service.ts:254-295`.
- Creation can substitute a draft client snapshot and accept unchecked item content at `apps/api/src/modules/invoices/invoices.service.ts:353-415` and `apps/api/src/modules/quotes/quotes.service.ts:126-186`.
- Shared validation exists in `packages/validation/src/index.ts:81-141` but is not authoritative in the API send path.

Impact:

Malformed documents can be finalized and marked sent despite having no valid client, no usable items, invalid financial values, or an invalid theme assignment. Client-side validation is bypassable.

Recommendation:

Run authoritative review/send validation in the API immediately before an atomic workflow transition. Validate business-owned references, item descriptions, financial values, frozen theme assignment, and recipient requirements. Add API-level negative tests.

### 3. The editor claims unsaved work is saved and can create duplicate drafts

Evidence:

- Invoice creation occurs only when Review calls `createInvoice` at `apps/web/src/app/app/[businessId]/invoices/new/page.tsx:207-244`, while the sticky bar always displays `Saved ✓` at `apps/web/src/app/app/[businessId]/invoices/new/page.tsx:547-556`.
- Quotes have the same behavior at `apps/web/src/app/app/[businessId]/quotes/new/page.tsx:165-195` and `:425-430`.
- Review uses browser history for Back to Edit at `apps/web/src/app/app/[businessId]/invoices/[invoiceId]/review/page.tsx:190-192,252-254`; the returned new-document screen creates another document on the next Review.

Impact:

Refreshing, navigating away, or switching workspace loses data despite a saved confirmation. Returning from Review and reviewing again can create duplicate documents. This violates the required shared Create/Edit workflow.

Recommendation:

Choose one honest model:

1. Restore debounced draft autosave with visible saving/error/retry states and edit the existing draft after creation.
2. Keep create-on-review, replace `Saved ✓` with accurate copy such as `Not yet saved`, persist a local recovery draft, and route Back to Edit to an actual edit screen for the existing draft.

The first option best matches the product requirements.

### 4. The mobile application is not a functional product surface

Evidence:

- Mobile navigation contains only Sign In and Sign Up in `apps/mobile/src/navigation/AppNavigation.tsx:8-21`.
- Successful sign-in performs no authenticated navigation in `apps/mobile/src/screens/auth/SignInScreen.tsx:28-38`.
- `apps/mobile/package.json:13-24` has no API-client or shared application-domain dependencies.

Impact:

Mobile users cannot onboard a business or access invoices, quotes, clients, products, payments, settings, or the required bottom navigation. The current application is a themed authentication bootstrap.

Recommendation:

Do not describe mobile as implemented. Establish a session-driven root navigator, first-business onboarding, authenticated tabs/stacks, API integration, and one end-to-end core workflow before expanding feature breadth.

### 5. Email delivery is simulated while documents are marked sent

Evidence:

- `EMAIL_PROVIDER` is always bound to `LoggerEmailProvider` in `apps/api/src/modules/email/email.module.ts:6-13`.
- The provider logs the complete message and returns `{ accepted: true }` in `apps/api/src/modules/email/logger-email-provider.ts:13-15`.
- Invoice and quote workflows treat that response as delivery success and transition to sent.

Impact:

No customer email is delivered, but the product reports success and freezes workflow state. Full recipient and message content is also written to application logs.

Recommendation:

Restrict the logger provider to explicit local development, fail production startup without a real provider, redact message content and addresses from logs, and model provider acceptance separately from delivered status. Add provider failure tests.

### 6. New authenticated users may not have the required account record

Evidence:

- Authentication maps the Supabase user ID directly to `accountId` at `apps/api/src/modules/auth/supabase-authentication.ts:13-23`.
- Business creation writes that ID as owner and then membership at `apps/api/src/modules/businesses/businesses.service.ts:50-65`.
- Both columns reference `public.accounts`, whose rows are not created by the reviewed auth code or schema trigger: `infrastructure/supabase/migrations/20260819135444_create_core_schema.sql:4-15,38-43`.

Impact:

A newly registered user can fail first-business onboarding with a foreign-key error unless account provisioning occurred outside the versioned implementation.

Recommendation:

Provision the account idempotently at the auth/onboarding boundary or through an audited Auth synchronization mechanism. Create account, business, and owner membership atomically. Cover the flow with a real-database test starting from a fresh Auth user.

## P1 findings

### 7. The new StrictMode guards can leave detail pages loading forever in development

Evidence:

- The guarded effects are at `apps/web/src/app/app/[businessId]/invoices/[invoiceId]/page.tsx:54-60`, `quotes/[quoteId]/page.tsx:38-44`, and `clients/[clientId]/page.tsx:24-30`.
- Strict Mode is enabled in `apps/web/next.config.ts:4`.

Impact:

Strict Mode runs effect setup, cleanup, and setup again. The first cleanup marks its request cancelled; the second setup sees the same key and returns. The first request therefore cannot update state, and no replacement load runs.

Recommendation:

Remove the component-local one-shot guard. Prefer abortable GETs plus a request cache/deduplication layer whose result survives effect replay, or tolerate duplicate idempotent development GETs. Add Strict Mode component tests and route-ID change tests.

### 8. Payment recording accepts invalid amounts and lifecycle states

Evidence:

- Payment validation checks only non-empty amount and date at `apps/api/src/modules/invoices/invoices.service.ts:193-216`.
- There is no positive-amount database constraint in `infrastructure/supabase/migrations/20260819140000_create_document_schema.sql:99-107`.
- The web defaults a payment to full invoice total rather than remaining balance at `apps/web/src/app/app/[businessId]/invoices/[invoiceId]/page.tsx:119-127`.

Impact:

Negative, zero, malformed, draft, void, or uncontrolled overpayments can corrupt balance/status reporting. A partially paid invoice encourages accidental overpayment.

Recommendation:

Parse payment values with shared money types, require an amount greater than zero, define overpayment policy, restrict eligible statuses, add database constraints, and initialize the dialog from an authoritative remaining balance.

### 9. Cross-business document references are not consistently rejected

Evidence:

- Client and source product references are accepted during invoice/quote creation without complete business ownership validation in `apps/api/src/modules/invoices/invoices.service.ts:369-403` and `apps/api/src/modules/quotes/quotes.service.ts:142-176`.
- Foreign keys reference global IDs and do not enforce matching `business_id` in `infrastructure/supabase/migrations/20260819140000_create_document_schema.sql:33-83`.

Impact:

A member who knows another tenant's UUID can create cross-tenant references, violating data isolation and producing invalid retention/deletion dependencies.

Recommendation:

Reject every supplied reference that does not resolve within the route business. Add tenant-aware composite constraints where practical and adversarial two-business integration tests.

### 10. API transport inputs are not runtime validated

Evidence:

- No global validation pipe or equivalent runtime schema is installed in `apps/api/src/main.ts:12-35`.
- Controller body interfaces are TypeScript-only and are erased at runtime.

Impact:

Malformed JSON types can reach `.trim`, `.map`, date parsing, calculations, and provider calls, creating inconsistent 400/500 responses and possible partial writes.

Recommendation:

Add strict runtime DTO/schema validation with unknown-field handling, string/array bounds, date validation, and stable application-error mapping. Add malformed-body HTTP tests.

### 11. Quote previews are labeled as invoices

Evidence:

- `DocumentPaper` hard-codes `INVOICE` at `apps/web/src/components/documents/DocumentPaper.tsx:83-101`.

Impact:

Quote Review presents an incorrect customer-facing document type, reducing trust and risking accidental use of a mislabeled document.

Recommendation:

Render the document label from the normalized document kind or semantic renderer output. Assert that quote fixtures render `QUOTE`.

### 12. Review does not render the document's assigned immutable theme version

Evidence:

- Invoice Review uses local preset state and `themePresets[preset]` at `apps/web/src/app/app/[businessId]/invoices/[invoiceId]/review/page.tsx:30,103-150,176-184`.
- Quote Review follows the same model at `apps/web/src/app/app/[businessId]/quotes/[quoteId]/review/page.tsx:30,100-147,165-173`.

Impact:

The preview can differ from the version assigned to and frozen with the document. Local theme selection appears meaningful but is not persisted to the document.

Recommendation:

Fetch and render the assigned `themeVersionId`. Persist any allowed theme reassignment through the API and render the returned version. Test reload, adopt-latest, and send consistency.

### 13. Core web workflows do not implement required mobile modes

Evidence:

- Invoice and quote editors hard-code multi-column item rows at `apps/web/src/app/app/[businessId]/invoices/new/page.tsx:337-360` and `quotes/new/page.tsx:282-301`.
- Detail rows use the same fixed-grid approach at `invoices/[invoiceId]/page.tsx:280-288` and `quotes/[quoteId]/page.tsx:188-196`.
- Review fixes a 330px summary column at `invoices/[invoiceId]/review/page.tsx:209-224` and `quotes/[quoteId]/review/page.tsx:196-210`.
- Theme Builder fixes three columns at `settings/themes/[themeId]/edit/page.tsx:336-343`.

Impact:

Phone layouts overflow or clip controls instead of using item cards, stacked review, sticky progression, and limited/drawer-based theme editing.

Recommendation:

Move layout definitions into responsive classes or theme breakpoints. Implement item cards below 768px, stacked Review with a sticky CTA, and preview-first Theme Builder behavior. Add 375px, 767px, 768px, and tablet viewport tests.

### 14. Product-library selection leaves a blank validation-blocking item

Evidence:

- Editors initialize with one empty item and always append library selections in `apps/web/src/app/app/[businessId]/invoices/new/page.tsx:49,140-151,221-229` and `quotes/new/page.tsx:50,117-129,167-175`.

Impact:

Selecting the first saved product produces a populated second row while the original blank row remains and blocks Review.

Recommendation:

Replace the sole pristine empty row on first library selection; append only when existing rows contain user data. Add interaction tests for both document types.

### 15. Dashboard financial summaries are not authoritative

Evidence:

- The web derives totals from invoice status and adds the full total for partially paid invoices at `apps/web/src/app/app/[businessId]/page.tsx:77-100`.
- The established dashboard shows Total invoiced instead of Paid this month at `apps/web/src/app/app/[businessId]/page.tsx:148-160`.

Impact:

Outstanding is overstated for partially paid invoices, and the dashboard does not satisfy the product's primary financial summary.

Recommendation:

Return authoritative, currency-aware dashboard aggregates from the API. Do not reconstruct payment-sensitive balances from status in React. Add mixed-status and mixed-currency tests.

### 16. Mobile sessions are non-persistent and hard-wired to development infrastructure

Evidence:

- `persistSession` and `autoRefreshToken` are disabled at `apps/mobile/src/lib/supabase.ts:6-10`.
- Supabase URL and publishable key are hard-coded at `apps/mobile/src/lib/supabase.ts:3-4`.

Impact:

Sessions disappear on restart and expire during use. Every build targets the same project, making environment separation unsafe.

Recommendation:

Use React Native secure/persistent storage appropriate to the threat model, restore and observe auth state, manage token refresh with application foreground state, and inject validated environment-specific configuration.

## P2 findings

### 17. Required editor and client-selection behavior is incomplete

Evidence:

- Client selection is a basic non-searchable select in `apps/web/src/app/app/[businessId]/invoices/new/page.tsx:327-335` and `quotes/new/page.tsx:273-280`.
- Invoice due date is a raw date input at `invoices/new/page.tsx:340-342`.
- Invoice notes and quote notes/terms are absent from their create payloads at `invoices/new/page.tsx:66-89` and `quotes/new/page.tsx:59-78`.

Impact:

Users cannot search clients by contact information, add one inline with auto-selection, use due-date presets, or complete required document content.

Recommendation:

Implement the specified searchable responsive selector, inline client creation, due presets, and notes/terms fields before adding lower-priority settings breadth.

### 18. Mobile navigation and workspace context do not match requirements

Evidence:

- Mobile hides the business context and renders only the section title at `apps/web/src/app/app/[businessId]/layout.tsx:102-104`.
- Bottom navigation includes six destinations at `apps/web/src/app/app/[businessId]/layout.tsx:108-127` rather than Home, Invoices, Quotes, Clients, and More.
- Settings pages fall back to the title `Invoices` at `apps/web/src/app/app/[businessId]/layout.tsx:50`.

Impact:

Workspace context is not visually obvious, navigation is crowded, and settings pages are mislabeled.

Recommendation:

Show business context/switching in the mobile header, consolidate Products and Settings under More, and derive titles from route metadata.

### 19. Business switching does not protect in-progress work

Evidence:

- The shell switcher is only a settings link at `apps/web/src/app/app/[businessId]/layout.tsx:56-61`.
- Workspace selection immediately navigates at `apps/web/src/app/app/[businessId]/settings/businesses/page.tsx:84-90`.

Impact:

Users can switch business while editing and lose unpersisted work without a Stay Here/Switch Business confirmation. This compounds the false Saved state.

Recommendation:

Centralize dirty-draft navigation protection and provide the required confirmation. Keep current workspace visible throughout the confirmation.

### 20. Several visible primary actions are inert or available in invalid states

Evidence:

- Download PDF has no handler at `apps/web/src/app/app/[businessId]/invoices/[invoiceId]/review/page.tsx:243-251` and `quotes/[quoteId]/review/page.tsx:226-234`.
- Invoice Detail exposes Record Payment and Send Again without complete status gating at `invoices/[invoiceId]/page.tsx:253-267`.
- Quote Detail exposes Send Again broadly at `quotes/[quoteId]/page.tsx:150-175`.

Impact:

False affordances erode trust, and invalid actions let users bypass or misunderstand lifecycle rules.

Recommendation:

Remove actions until functional or wire them to the shared print/PDF pipeline. Define action availability centrally from authoritative status transition rules and expose pending states for every mutation.

### 21. Loading, error, and empty states lack recovery and distinction

Evidence:

- Main pages use spinners rather than skeletons, including `apps/web/src/app/app/[businessId]/page.tsx:112-117` and `invoices/page.tsx:97-102`.
- Invoice and quote list empties collapse no-data, no-search-results, and no-filter-results at `invoices/page.tsx:138-141` and `quotes/page.tsx:135-138`.
- Several missing-session loaders return without settling state, including `quotes/[quoteId]/send/page.tsx:86-103` and settings loaders.

Impact:

Users cannot distinguish empty data from filters or failures, and some authentication/network failures result in indefinite loading with no Retry.

Recommendation:

Adopt shared page-state components for skeleton, first-use empty, filtered empty, error with Retry, and expired-session handling.

### 22. Keyboard and assistive-technology semantics are incomplete

Evidence:

- Invoice/quote filters are plain buttons without selected tab semantics at `apps/web/src/app/app/[businessId]/invoices/page.tsx:126-136` and `quotes/page.tsx:123-133`.
- Search inputs lack accessible names at `invoices/page.tsx:111-135` and `quotes/page.tsx:108-132`.
- Toast is not a live region at `apps/web/src/components/ui/Toast.tsx:14-16`.
- Settings navigation nests a button inside a link at `apps/web/src/app/app/[businessId]/settings/layout.tsx:32-46`.
- Some tabs and controls are shorter than the required 44px target in `apps/web/src/app/globals.css:231-241` and `apps/web/src/theme/theme.ts:81`.

Impact:

Screen-reader and keyboard users receive weak state announcements and encounter invalid or undersized controls.

Recommendation:

Use accessible tab/toggle patterns, explicit search labels, `aria-current`, polite status live regions, single interactive elements, visible focus, and 44px minimum touch targets. Validate with keyboard, VoiceOver, and TalkBack.

### 23. Web and mobile tests do not cover user workflows

Evidence:

- Web tests only validate UI exports and theme token mapping in `apps/web/src/components/ui/ui.test.ts:16-25` and `apps/web/src/theme/theme.test.ts:5-29`.
- Mobile tests only check a render result and exports in `apps/mobile/__tests__/App.test.tsx:6-15` and `apps/mobile/src/components/ui/ui.test.ts:14-30`.

Impact:

The suite remains green while detail loading, draft duplication, payment defaults, quote labeling, session handling, and accessibility regressions ship.

Recommendation:

Prioritize workflow tests over additional export/token tests. Add Strict Mode loading, route change, create-review-edit, product selection, payment balance, theme version, session restoration, responsive layout, and accessibility tests. Add API concurrency and real-database integration coverage.

## P3 findings

### 24. Financial, status, and date presentation is inconsistent

Raw status values such as `partially_paid`, ISO dates, and amounts without consistent currency context appear across lists and dashboard surfaces. Centralize status labels, date formatting, and currency-aware money formatting.

### 25. Business Profile duplicates Region

`apps/web/src/app/app/[businessId]/settings/profile/page.tsx:188-215` renders two controls bound to the same `region` state. Remove the duplicate and restore the intended address field/layout.

### 26. Some small Theme Builder labels do not meet text contrast

The 11px `#98A2B3` labels on white at `apps/web/src/app/app/[businessId]/settings/themes/[themeId]/edit/page.tsx:667-674` are below WCAG AA contrast for normal text. Increase contrast or size/weight and verify all token combinations.

## Engineering strengths

- Clear monorepo boundaries and platform-specific UI ownership.
- Repository/provider abstractions keep most product code decoupled from Supabase-generated database types.
- Shared decimal-safe calculation, validation, document schema, theme schema, and renderer packages are the correct architectural direction.
- Business-scoped controllers consistently use authentication and business-access guards in the reviewed routes.
- Immutable theme-version intent and a shared render contract are strong foundations.
- The web visual language is coherent across cards, status treatments, editor structure, and document preview.
- Existing API and shared-package unit coverage is broader than the web/mobile interaction coverage.

These strengths should be preserved while moving workflow invariants, validation, and transactional operations into authoritative backend use cases.

## Recommended remediation sequence

### Phase 1: Stabilize core workflows

1. Revert or replace the StrictMode one-shot loader guards.
2. Make the editor save state truthful and prevent duplicate draft creation.
3. Enforce authoritative document and payment validation in the API.
4. Add atomic transitions/transactions for send, aggregate save, conversion, and theme version creation.
5. Provision account/business/membership atomically.
6. Configure real email delivery or explicitly disable Send outside local development.

Exit criteria: create, edit, review, send, convert, and payment workflows survive retries, concurrent requests, navigation, and provider failures without duplicate or partial state.

### Phase 2: Correct customer-facing output

1. Bind Review to the assigned immutable theme version.
2. Correct quote labels and wire PDF actions to the shared renderer.
3. Return authoritative payment balances and dashboard aggregates.
4. Validate all tenant-scoped references and add database constraints.

Exit criteria: Preview, PDF, send attachment, and detail values agree for invoice and quote fixtures, including partial payments and historical themes.

### Phase 3: Complete responsive and accessible web UX

1. Implement mobile item cards, stacked Review, sticky CTAs, and responsive Theme Builder modes.
2. Correct mobile navigation and persistent business context.
3. Complete client search/add, notes/terms, and due-date preset workflows.
4. Standardize loading, empty, error, retry, focus, tab, live-region, and touch-target behavior.

Exit criteria: documented keyboard and viewport matrices pass at 375px, 767px, 768px, tablet, and desktop widths; critical flows pass VoiceOver/TalkBack smoke testing.

### Phase 4: Decide and execute mobile scope

1. If mobile is in the release scope, implement session restoration, onboarding, authenticated navigation, API integration, and the core invoice loop.
2. If mobile is not in the release scope, label it explicitly as a foundation/prototype and exclude it from product-complete claims.

Exit criteria: a mobile user can sign in, select/create a business, create and review a document, and safely resume a session after restart.

## Suggested acceptance gates

- No workflow mutation is implemented as an unprotected read-then-write transition.
- API rejects invalid documents, cross-tenant references, and invalid payments without partial writes.
- No screen claims content is saved until persistence succeeds.
- Every visible action is functional and status-appropriate.
- Invoice and quote Preview/PDF/Send use the same assigned renderer/theme version.
- Web core workflows pass interaction tests in React Strict Mode.
- Mobile scope is accurately represented and session handling is production-safe.
- Keyboard, mobile viewport, and screen-reader smoke matrices are completed before release.
