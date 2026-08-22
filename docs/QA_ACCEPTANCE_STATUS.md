# QA Acceptance Matrices

Status for QA-01..09. "Automated" = covered by package/app test suites; "Manual" = device/browser pass required at acceptance.

## QA-01 — Desktop matrix
Manual. Browser ≥1200px. Verify sidebar nav, entity grids, invoice editor sticky summary/bar, Review side-by-side, Theme Builder 3-panel layout, settings sub-navigation.

## QA-02 — Tablet matrix
Manual. 768–1199px. Verify compact nav, 1–2 column forms, Review stacked, touch-friendly controls.

## QA-03 — Mobile matrix
Manual. <768px. Verify bottom nav (Dashboard/Invoices/Quotes/Clients/Settings), single column, sticky primary CTA, touch targets ≥44px.

## QA-04 — Keyboard / focus
Manual. Tab/Shift+Tab, Enter, Escape, arrows for menus/segments; visible focus; dialogs manage focus; icon buttons have labels.

## QA-05 — Calculation tests
Automated. `@invoiceflow/calculations` suite: money model, document calculator (subtotal/discount/taxes/total/deposit/remaining), deterministic decimal arithmetic. Also `@invoiceflow/validation` review/send layers.

## QA-06 — Renderer 18-case baseline
Automated. `packages/renderer/test/fixture-suite.test.ts` runs 6 fixtures × 3 preset themes = 18 render cases through the full pipeline (sections → pagination → print → pdf), asserting item-row count, protected order (items < totals < deposit, footer last), page count, and print/pdf output.

## QA-07 — Primary E2E invoice
Automated (service-level) + manual UI pass.
- Create $5,000 invoice → `InvoicesService.createInvoice` + `invoices.service.spec.ts`
- New client → `ClientsModule` + clients tests
- 30% deposit → deposit editor + `createInvoice` depositTerms
- Review + theme selector → `INV-10/INV-11`, Review page
- Send (draft→sent) → `invoices.service.spec.ts` (send test, theme-freeze test)
- Record partial then final payment → `recordPayment` tests (partial/paid status)

## QA-08 — Quote conversion E2E
Automated. `quotes.service.spec.ts` covers create, send, accept, decline, convert; convert test asserts new draft invoice with own id/dates, `sourceQuoteId`, preserved theme, `convertedInvoiceIds`, and `converted` activity event.

## QA-09 — Theme freeze E2E
Automated. `invoices.service.spec.ts` "assigns the default invoice theme on create and freezes it on send" verifies: default theme assigned on create, `themeVersionId` unchanged after send, and saved payload retains `themeId`/`themeVersionId`. Historical rendering uses the frozen version via `GET /themes/:id/versions/:versionId` (TVER-05).

---

## Acceptance checklist status (from `09_QA_ACCEPTANCE.md`)

### Platform / Backend
- [x] Next.js uses the API for application workflows.
- [x] Business authorization enforced by the API (`BusinessAccessGuard`).
- [x] Supabase persistence behind repository abstractions.
- [x] Domain models independent of Supabase-generated DB types (`@invoiceflow/domain`).
- [x] Authenticated API requests resolve business membership.
- [x] Financial results consistent across Web/API (shared `@invoiceflow/calculations`).

### Authentication
- [x] Sign In works independently of business setup.
- [x] First account with zero businesses routes to Create Business.
- [x] Business requires only name/country/currency.
- [x] Forgot/Reset password (AUTH-03).

### Business context
- [x] Current business always clear (`CurrentBusiness`, business switcher).
- [x] Business-scoped data never leaks (all endpoints business-scoped).
- [ ] Switching during edit confirms draft status (autosave parity — INV-08 deferred).

### Invoice editor
- [x] Client selection works.
- [x] Inline Add Client works and auto-selects.
- [x] Custom line item works without product library.
- [x] Quantity supports decimals (string inputs; calculator parses decimals).
- [x] Taxes business-configurable (Settings → Taxes).
- [x] Deposit percentage/fixed; deposit does not reduce total.
- [ ] Autosave success/error states (INV-08 deferred).

### Invoice Review
- [x] Invalid client/items/rate block progression (INV-09).
- [x] Review does not send.
- [x] Theme selector changes appearance only; financial values unchanged.
- [x] Continue to Send works.
- [x] Newer theme version banner + Adopt latest (TVER-02/03).

### Send
- [x] Multiple To recipients, CC/BCC, per-email validation, editable subject/message.
- [x] Send routes to Detail.
- [ ] PDF summary visible (PDF adapter available; download UI on Review).

### Payments
- [x] Editable amount; need not equal deposit.
- [x] Partial/Paid status derivation correct; Total/Paid/Balance consistent.

### Quotes
- [x] Shared document architecture; Valid Until replaces Due Date.
- [x] Deposit upon acceptance wording; viewing != acceptance; explicit accept.
- [x] Conversion creates new draft invoice with own number/dates; relationship preserved.

### Clients
- [x] Name OR Company required.
- [x] Multiple emails.
- [x] Historical documents preserve client snapshot.

### Products
- [x] Library optional; document edit does not mutate saved item.

### Settings
- [x] Taxes multiple components; Document Themes; payments/numbering/businesses screens.
- [ ] Currency change warning (SET note); old documents retain currency (currencyCode snapshot).

### Themes
- [x] List, create-from-preset, duplicate, rename, invoice/quote default, archive.
- [ ] Referenced theme cannot be deleted; default requires replacement before archive (archive is preferred; delete not exposed).

### Theme Builder
- [x] Page/brand/typography properties; header/bill-to/items/totals/deposit/footer styles.
- [x] Safe reorder (Items<Totals<Deposit, footer last).
- [x] Multi-page + quote fixtures (Renderer fixture suite).
- [x] Undo/Redo.
- [x] Warning vs blocking diagnostics (warnings displayed, invalid config rejected on save).

### Theme versions
- [x] Save creates immutable version; existing draft stays on older version.
- [x] Draft shows newer version available; explicit adopt works.
- [x] Send freezes selected version; later changes do not alter sent doc.
- [x] New draft uses current default theme/current version (TVER-07).

### Shared renderer
- [x] Same renderer drives Theme Builder Preview, Invoice Review, Quote Review, Print, PDF.
- [x] Item rows do not split; table header repeats; totals+deposit stay together; footer/page numbering correct.

### Responsive / Accessibility
- [x] Desktop sidebar, mobile bottom nav implemented.
- [x] Form labels, icon-button labels, errors/status have text.
- [ ] Tablet compact nav, mobile item cards, Theme Builder mobile limits, touch ≥44px (device pass).

## Out of scope / deferred
- INV-08 autosave parity (web currently shows a static "Saved ✓"; API autosave contract exists).
- Currency change warning UI.
- Client-facing view / email attachment renderer surface.