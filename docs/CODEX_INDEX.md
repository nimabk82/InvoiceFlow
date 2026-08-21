# InvoiceFlow — Codex Documentation Index

Purpose: load the minimum documentation needed for each ticket.

Do not read every handoff file by default.

## Always read

For every implementation ticket:

1. `docs/IMPLEMENTATION_STATUS.md`
2. `docs/PLAN_DESIGN_FIRST.md` (current design-first delivery plan; defer/priority)
3. the ticket entry in `docs/handoff/08_DEVELOPMENT_TICKETS.md`
4. only the mapped documents below

The nearest `AGENTS.md` is also authoritative for the directory being changed.

---

## Platform / monorepo / tooling

Ticket prefixes:
- `PLATFORM-*`
- `FOUND-*`

Read:
- `docs/handoff/10_DEVELOPER_START_HERE.md`
- `docs/handoff/11_BACKEND_AND_MONOREPO_ARCHITECTURE.md`
- `docs/handoff/03_COMPONENT_ARCHITECTURE.md` only when package/component boundaries are relevant

Do not read Product Requirements unless the platform task requires product behavior.

---

## API / authentication / authorization

Ticket prefixes:
- `API-*`
- `AUTH-*`
- `ONBOARD-*` when API-side

Read:
- `docs/handoff/11_BACKEND_AND_MONOREPO_ARCHITECTURE.md`
- `docs/handoff/04_DATA_MODEL.md`
- relevant section of `docs/handoff/01_PRODUCT_REQUIREMENTS.md`

For first business onboarding:
- also `docs/handoff/02_ROUTES_AND_STATES.md`

---

## Database / Supabase

Ticket prefixes:
- `DB-*`

Read:
- `docs/handoff/04_DATA_MODEL.md`
- `docs/handoff/11_BACKEND_AND_MONOREPO_ARCHITECTURE.md`

For document tables:
- also `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md` only if theme-version references/render snapshots are involved

---

## Dashboard

Ticket prefixes:
- `DASH-*`

Read:
- Dashboard sections in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

---

## Clients

Ticket prefixes:
- `CLIENT-*`

Read:
- Client section in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- Client model/snapshot sections in `docs/handoff/04_DATA_MODEL.md`
- `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md` for UI tickets

---

## Products & Services

Ticket prefixes:
- `PRODUCT-*`

Read:
- Products & Services section in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- ProductService section in `docs/handoff/04_DATA_MODEL.md`
- `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md` for UI tickets

---

## Invoice

Ticket prefixes:
- `INV-*`

Read:
- Invoice sections in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- Invoice/DocumentItem/Deposit/Payment models in `docs/handoff/04_DATA_MODEL.md`

For UI:
- also `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

For Review/theme rendering:
- also `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`

Do not read Quote details unless the ticket modifies shared DocumentEditor/domain code.

---

## Quote

Ticket prefixes:
- `QUOTE-*`

Read:
- Quote + Quote→Invoice sections in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- Quote/Invoice shared models in `docs/handoff/04_DATA_MODEL.md`

For UI:
- also `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

For render/theme behavior:
- also `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`

---

## Settings

Ticket prefixes:
- `SET-*`

Read:
- Business Settings + Multi-business sections in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- relevant model in `docs/handoff/04_DATA_MODEL.md`

For UI:
- also `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

---

## Financial calculations / validation

Ticket prefixes:
- `DOMAIN-*`

Read:
- Invoice / Deposit / Tax / Payment sections in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- `docs/handoff/04_DATA_MODEL.md`

Do not read Renderer/Theme docs unless the ticket explicitly touches rendering.

---

## Shared document renderer

Ticket prefixes:
- `RENDER-*`

Read:
- `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`
- relevant Invoice/Quote semantics in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- relevant render models in `docs/handoff/04_DATA_MODEL.md`

For responsive preview:
- also `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

---

## Document Themes / Theme Builder

Ticket prefixes:
- `THEME-*`

Read:
- `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`
- Theme models in `docs/handoff/04_DATA_MODEL.md`

For UI:
- also `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

For business defaults:
- relevant Business Settings section in `docs/handoff/01_PRODUCT_REQUIREMENTS.md`

---

## Theme version lifecycle / finalization

Ticket prefixes:
- `TVER-*`

Read:
- Theme lifecycle in `docs/handoff/05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`
- Invoice/Quote/Theme models in `docs/handoff/04_DATA_MODEL.md`
- backend workflow rules in `docs/handoff/11_BACKEND_AND_MONOREPO_ARCHITECTURE.md`

---

## QA

Ticket prefixes:
- `QA-*`

Read:
- only the relevant section(s) of `docs/handoff/09_QA_ACCEPTANCE.md`
- source-of-truth docs for the flow being tested

Do not load the entire product handoff for a focused QA ticket.

---

## Route questions

Read:
- `docs/handoff/02_ROUTES_AND_STATES.md`

---

## Design tokens

Read:
- `docs/handoff/design-tokens.json`

Do not reread the full UX requirements merely to get colors/spacing.

---

## Escalation rule

Only broaden document reading when:
- the mapped docs conflict;
- implementation spans multiple domains;
- the task changes architecture;
- a required behavior is genuinely unspecified.
