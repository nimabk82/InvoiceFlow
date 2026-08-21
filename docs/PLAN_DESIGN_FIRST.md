# InvoiceFlow — Design-First Delivery Plan

## Goal
Finish the UI so it looks like `sample.html`, and defer low-priority feature breadth to the end. Saved effort goes into design/polish.

**Current state:** functional invoice loop (create→review→send→detail→payment→void), clients, products, settings (profile/defaults/taxes). **Not yet:** dashboard, styled "paper" document renderer, quotes, activity timeline, and the full prototype look.

## A. Defer to the end (not necessary now — implement last)
These are functional breadth, not core design. Skipping them now frees effort for polish.

| Stage | Why deferred |
|---|---|
| **QUOTE-01..08 (Quotes)** | Full parallel domain. Add after the core invoice design is final. |
| **RENDER-06..11 (pagination, continuation headers, print & PDF adapters)** | Screen-first: needed only when printing/PDF is wired. Defer to end. |
| **THEME-08..21 (full visual Theme Builder)** | Huge sub-feature. Keep only presets + selection now; builder UI later. |
| **TVER-02..08 (theme lifecycle complexity)** | Keep minimal freeze-on-send; defer retention/historical-switch UX. |
| **SET-04 Payments, SET-05 Numbering, SET-06 Manage Businesses** | Low-visibility config screens; functional only. Defer. |
| **CLIENT-04 Detail, CLIENT-05 Archive** | Secondary to the core client list/picker. Defer. |
| **PRODUCT-03 library selector** | Editor can use custom items for now. Defer. |
| **AUTH-03 Forgot/Reset Password** | Not needed for the demo UI. Defer. |
| **QA-01..09 matrices** | Run at the end as acceptance, by nature. |

## B. Prioritize now (design-critical — where effort goes)
These are the screens/behaviors that make the app look like `sample.html`.

1. **DASH-01/02 — Dashboard** (stats: Overdue/Outstanding/Paid; Needs attention; Recent activity)
2. **RENDER-03/04/05 — core styled document renderer** (semantic sections, item table, Totals + Deposit block) — this is the "paper" in Review/Detail
3. **THEME-02 presets + INV-11 theme selection in Review + Settings→Branding** (accent color, Clean/Modern/Minimal style cards)
4. **FOUND-03/04 — app shell & navigation** (sidebar/mobile nav, business switcher, active-context)
5. **Activity timeline on Invoice Detail** (mirrors the sample timeline)
6. **CLIENT-03 — multiple emails** (client picker + new-client dialog parity)
7. **Design polish pass** — match prototype aesthetic: paper preview layout, status pills, tabs + search on lists, dialogs (client/item/deposit/payment), sticky "Review Invoice" editor bar, spacing/typography via existing design tokens

## C. Proposed stage sequence
- **Stage 1 — Renderer + Themes core:** the styled "paper" preview used by Invoice Review/Detail (RENDER-03/04/05, THEME-02, INV-11). *Biggest visual jump.*
- **Stage 2 — App shell + Dashboard:** navigation shell (FOUND-03/04) and the dashboard home (DASH-01/02).
- **Stage 3 — Detail parity + Clients:** activity timeline on Detail, multi-email clients, dialogs/pills/tabs/search polish.
- **Stage 4 — Settings finish (deferred scope):** Payments/Numbering/Manage Businesses + Branding wiring.
- **Stage 5 — Deferred breadth:** Quotes, Theme Builder, Print/PDF, QA matrices.

## Result
After Stage 1–3 the app closely matches `sample.html`'s look for the core invoice/client/product experience; Stages 4–5 add breadth without blocking the design.
