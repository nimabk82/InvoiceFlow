# 07 — Implementation Roadmap

## Phase 0 — Monorepo + Backend Foundation

Set up:
- `apps/web` — Next.js
- `apps/mobile` — plain React Native
- `apps/api` — Node.js + NestJS + Fastify
- shared packages
- Supabase infrastructure folder
- pnpm workspace
- Turborepo
- shared TypeScript/lint config
- NestJS Fastify bootstrap
- environment validation
- health endpoint
- repository abstractions
- Supabase connection
- authenticated business context

Exit:
- Web can call API
- Mobile can call API
- API can access Supabase through repository/provider abstractions


## Phase 1 — Foundations

Build:
- design tokens
- typography
- spacing/radius
- Button
- Input
- Select
- Badge
- Dialog
- Drawer
- BottomSheet
- Toast
- Skeleton
- EmptyState

Exit:
shared UI library stable.

---

## Phase 2 — Auth + Business

Build:
- Sign In
- Sign Up
- Forgot/Reset
- Create First Business
- business context
- business switcher
- first-time dashboard

Exit:
user can enter a business workspace.

---

## Phase 3 — Core domain

Build:
- money types
- document calculations
- taxes
- deposits
- validation
- snapshot types
- autosave contract

Exit:
financial logic test-covered.

---

## Phase 4 — Invoice

Build:
- invoice list
- editor
- add client inline
- line items
- tax
- deposit
- notes
- Review
- Send
- Detail
- Record Payment

Exit:
primary usability test succeeds.

---

## Phase 5 — Quote

Build shared-document variant:
- quote list/editor/review/send/detail
- acceptance
- decline
- expiry
- quote → invoice conversion

Exit:
quote conversion works without duplicated editor architecture.

---

## Phase 6 — Clients / Products

Build:
- client list/detail/create/edit/archive
- multiple emails
- products/services list/create/edit/archive

Exit:
document shortcuts complete.

---

## Phase 7 — Settings

Build:
- profile
- defaults
- taxes
- payments
- numbering
- businesses

Exit:
business configuration complete.

---

## Phase 8 — Shared renderer

Build:
- normalized render model
- section renderer
- pagination
- diagnostics
- preview/print parity
- PDF adapter

Test:
3 themes × 6 fixtures.

Exit:
one renderer contract works for Preview, Review, Print, PDF.

---

## Phase 9 — Document Themes

Build:
- theme list
- preset creation
- duplicate
- rename
- defaults
- archive
- version storage
- Theme Builder
- diagnostics
- theme selection in Review

Exit:
user can create a branded theme without breaking multi-page output.

---

## Phase 10 — Finalization

Build:
- Draft theme selection
- newer version notification
- explicit adopt latest
- freeze theme version on send
- sent historical rendering
- version retention

Exit:
later theme edits do not change sent documents.

---

## Phase 11 — Hardening

- responsive QA
- accessibility
- offline/error states as actually supported
- performance
- security
- audit/history
- analytics/events
- e2e
