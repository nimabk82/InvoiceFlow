# 08 — Development Ticket Backlog

## Platform / Backend

### PLATFORM-01 — Monorepo
pnpm workspaces + Turborepo.

### PLATFORM-02 — Next.js web bootstrap
React + TypeScript.

### PLATFORM-03 — Plain React Native mobile bootstrap
TypeScript + native `ios/` and `android/`.

### PLATFORM-04 — NestJS API bootstrap
Node.js + NestJS + Fastify adapter.

### PLATFORM-05 — Shared packages
Domain, calculations, validation, types, API client, document/theme schemas.

### API-01 — Configuration / health / logging
### API-02 — Supabase PostgreSQL adapter
### API-03 — Repository abstractions
### API-04 — Supabase Auth verification boundary
### API-05 — Business authorization guards/policies
### API-06 — Storage abstraction + Supabase Storage adapter
### API-07 — Email provider abstraction
### API-08 — Typed API client for Web + Mobile

### DB-01 — Core schema
Businesses, memberships, clients, products, taxes.

### DB-02 — Document schema
Invoices, quotes, items, deposits, snapshots, payments.

### DB-03 — Theme schema
Themes, immutable versions, document version references.

### DB-04 — Version-controlled migrations
Under `infrastructure/supabase/migrations`.


Suggested IDs and build order.

## Foundation

### FOUND-01 — Design tokens
Create color, typography, spacing, radius, breakpoint tokens.

### FOUND-02 — UI primitives
Button, Input, Select, Badge, Dialog, Drawer, Bottom Sheet, Toast.

### FOUND-03 — App shell
Responsive sidebar/tablet/mobile navigation.

### FOUND-04 — Business context
Selected business context + switcher.

---

## Authentication / onboarding

### AUTH-01 — Sign In
### AUTH-02 — Sign Up
### AUTH-03 — Forgot/Reset Password
### ONBOARD-01 — First Business
### DASH-01 — First-Time Dashboard
### DASH-02 — Established Dashboard

---

## Domain

### DOMAIN-01 — Money model
Minor-unit/decimal-safe arithmetic.

### DOMAIN-02 — Document calculator
Subtotal, discounts, taxes, total, deposit, remaining.

### DOMAIN-03 — Document validation
Edit / Review / Send validation layers.

### DOMAIN-04 — Autosave contract

---

## Clients

### CLIENT-01 — Client list
### CLIENT-02 — Create/Edit client
### CLIENT-03 — Multiple emails
### CLIENT-04 — Client detail
### CLIENT-05 — Archive behavior

---

## Products

### PRODUCT-01 — Product/Service list
### PRODUCT-02 — Create/Edit item
### PRODUCT-03 — Document library selector

---

## Invoices

### INV-01 — Invoice list
### INV-02 — New/Edit Invoice shell
### INV-03 — Client selector + inline Add Client
### INV-04 — Line item editor
### INV-05 — Taxes
### INV-06 — Deposit editor
### INV-07 — More Options
### INV-08 — Autosave states
### INV-09 — Review validation
### INV-10 — Invoice Review
### INV-11 — Theme selector in Review
### INV-12 — Send Invoice
### INV-13 — Invoice Detail
### INV-14 — Record Payment
### INV-15 — Partial/Paid status derivation
### INV-16 — Duplicate / Void / Delete Draft

---

## Quotes

### QUOTE-01 — Quote list
### QUOTE-02 — Quote editor via shared DocumentEditor
### QUOTE-03 — Quote Review
### QUOTE-04 — Send Quote
### QUOTE-05 — Client acceptance
### QUOTE-06 — Quote Detail
### QUOTE-07 — Convert Quote to Invoice
### QUOTE-08 — Quote ↔ Invoice relationship

---

## Settings

### SET-01 — Business Profile
### SET-02 — Document Defaults
### SET-03 — Taxes
### SET-04 — Payments
### SET-05 — Numbering
### SET-06 — Manage Businesses

---

## Renderer

### RENDER-01 — Normalize RenderableDocument
### RENDER-02 — Theme schema validation
### RENDER-03 — Semantic section renderer
### RENDER-04 — Item table renderer
### RENDER-05 — Totals + Deposit block
### RENDER-06 — Pagination controller
### RENDER-07 — Continuation headers
### RENDER-08 — Footer/page numbering
### RENDER-09 — Render diagnostics
### RENDER-10 — Print adapter
### RENDER-11 — PDF adapter
### RENDER-12 — Renderer fixture suite

---

## Themes

### THEME-01 — Theme list
### THEME-02 — Built-in presets
### THEME-03 — Create from preset
### THEME-04 — Duplicate / Rename
### THEME-05 — Default Invoice / Quote
### THEME-06 — Archive / Restore
### THEME-07 — Immutable ThemeVersion persistence
### THEME-08 — Theme Builder shell
### THEME-09 — Page properties
### THEME-10 — Brand properties
### THEME-11 — Typography properties
### THEME-12 — Header / Business / Document Info
### THEME-13 — Bill To
### THEME-14 — Items
### THEME-15 — Totals
### THEME-16 — Deposit
### THEME-17 — Payment / Notes / Terms / Footer
### THEME-18 — Safe section reorder
### THEME-19 — Preview fixtures
### THEME-20 — Diagnostics
### THEME-21 — Undo / Redo
### THEME-22 — Tablet/mobile behavior

---

## Theme lifecycle

### TVER-01 — Draft theme selection
### TVER-02 — Newer version available state
### TVER-03 — Explicit Adopt Latest
### TVER-04 — Freeze on Send
### TVER-05 — Historical renderer lookup
### TVER-06 — Version retention
### TVER-07 — Default-theme assignment for new documents
### TVER-08 — Quote → Invoice theme selection

---

## QA

### QA-01 — Desktop matrix
### QA-02 — Tablet matrix
### QA-03 — Mobile matrix
### QA-04 — Keyboard / focus
### QA-05 — Calculation tests
### QA-06 — Renderer 18-case baseline
### QA-07 — Primary E2E invoice
### QA-08 — Quote conversion E2E
### QA-09 — Theme freeze E2E
