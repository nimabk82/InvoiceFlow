# 06 — Responsive and Accessibility Requirements

## Breakpoints

Mobile:
`< 768px`

Tablet:
`768–1199px`

Desktop:
`>= 1200px`

These define UX modes, not only CSS widths.

---

## Desktop

- persistent ~240–250px sidebar
- document tables
- multi-column forms
- popovers/drawers
- keyboard-friendly
- page max approximately 1200–1280px
- document editor approximately 1000–1200px

---

## Tablet

- collapsible/compact navigation
- 1–2 column forms
- touch-friendly
- do not simply enlarge mobile layout

Theme Builder:
- preview remains primary
- Structure / Properties in drawers/sheets

---

## Mobile

Bottom navigation:
- Home
- Invoices
- Quotes
- Clients
- More

Patterns:
- single column
- full-screen selectors
- bottom sheets
- line item cards
- sticky primary CTA
- minimum touch target 44px

Theme Builder V1:
- list / preview / set default / duplicate / rename
- full editor can require larger screen

---

## Component behavior matrix

| Component | Desktop | Tablet | Mobile |
|---|---|---|---|
| Nav | Sidebar | Compact/drawer | Bottom nav |
| Business switcher | Sidebar | Compact/header | Header |
| Invoice items | Table | Compact rows | Cards |
| Client selector | Search popover | Popover/sheet | Full-screen |
| Add client | Drawer | Drawer | Full-screen |
| Filters | Inline | Wrap | Sheet/chips |
| Document Review | Side-by-side | Stacked | Stacked |
| Theme Builder | 3 panels | Preview + drawers | Limited |

---

## Accessibility

Minimum:
- WCAG AA text contrast
- visible labels
- visible focus
- full keyboard workflow
- errors not color-only
- status always has text
- icon buttons have accessible labels
- touch targets >= 44px
- dialogs manage focus
- focus returns to opener where practical

Keyboard:
- Tab / Shift+Tab
- Enter
- Escape
- arrows for menus/segments
- keyboard alternative for theme-section reorder

---

## Loading / errors

Prefer skeletons for page/list loading.

Autosave error:
`Not saved ⚠ — Retry`

Do not use giant whole-app spinners.

Empty states are distinct:
- no records
- no search results
- no filter results

Example:
- No invoices yet → Create Invoice
- No invoices match “Northern” → Clear Search
- No overdue invoices → You're all caught up
