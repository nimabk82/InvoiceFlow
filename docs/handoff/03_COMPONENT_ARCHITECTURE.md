# 03 — Component Architecture

## Shared UI primitives

```text
Button
Input
Textarea
Select
SearchableSelect
Checkbox
RadioGroup
SegmentedControl
StatusBadge
Card
Dialog
Drawer
BottomSheet
Toast
Skeleton
EmptyState
Tabs
DataTable
```

---

# App shell

```text
AppShell
├ BusinessSwitcher
├ DesktopSidebar
├ TabletNavigation
├ MobileHeader
├ MobileBottomNav
└ PageContainer
```

---

# Document architecture

Do not implement Invoice and Quote as unrelated screens.

```text
DocumentEditor
├ ClientSection
├ DocumentMetaSection
├ LineItemsEditor
│  ├ DesktopLineItemsTable
│  └ MobileLineItemCards
├ MoneySummary
├ DepositEditor
├ NotesSection
├ MoreOptions
└ ReviewAction
```

Config differences:

```ts
type DocumentType = 'invoice' | 'quote'
```

Invoice:
- Due Date
- Deposit required
- Review Invoice

Quote:
- Valid Until
- Deposit upon acceptance
- Review Quote

---

# Review / Send

```text
DocumentReview
├ SharedDocumentRenderer
├ DocumentSummary
├ ThemeSelector
└ ContinueToSend

SendDocument
├ RecipientChips
├ CcBcc
├ Subject
├ Message
├ AttachmentSummary
└ SendAction
```

---

# Detail

```text
InvoiceDetail
├ FinancialSummary
├ PrimaryActions
├ PaymentHistory
└ ActivityTimeline
```

---

# Theme Builder

```text
ThemeBuilder
├ ThemeBuilderToolbar
├ StructurePanel
├ DocumentPreview
├ PropertiesPanel
├ DiagnosticsPanel
└ PreviewToolbar
```

Structure:
- Page
- Brand
- Typography
- Header
- Business
- Document Info
- Bill To
- Items
- Totals
- Deposit
- Payment Instructions
- Notes
- Terms
- Footer

---

# Shared renderer

```text
SharedDocumentRenderer
├ normalizeDocumentForRendering()
├ paginateDocument()
├ DocumentPage
│  ├ HeaderSection
│  ├ BusinessSection
│  ├ DocumentInfoSection
│  ├ BillToSection
│  ├ ItemsSection
│  ├ FinancialSummaryBlock
│  │  ├ TotalsSection
│  │  └ DepositSection
│  ├ PaymentInstructionsSection
│  ├ NotesSection
│  ├ TermsSection
│  └ FooterSection
└ diagnostics
```

The same renderer contract must drive:
- Theme Builder Preview
- Invoice Review
- Quote Review
- Client view
- Print
- PDF
- Email attachment

---

# Suggested React directory layout

```text
src/
├ app/
│  ├ auth/
│  ├ onboarding/
│  ├ dashboard/
│  ├ invoices/
│  ├ quotes/
│  ├ clients/
│  ├ products/
│  ├ settings/
│  └ account/
│
├ components/
│  ├ ui/
│  ├ navigation/
│  ├ documents/
│  └ themes/
│
├ domain/
│  ├ businesses/
│  ├ clients/
│  ├ products/
│  ├ taxes/
│  ├ invoices/
│  ├ quotes/
│  ├ payments/
│  └ themes/
│
├ renderer/
│  ├ normalize/
│  ├ paginate/
│  ├ sections/
│  └ diagnostics/
│
├ styles/
│  ├ tokens/
│  └ globals/
│
└ utils/
   ├ money/
   ├ validation/
   ├ dates/
   └ email/
```


# Backend application architecture

Backend:
- Node.js
- NestJS
- Fastify adapter

Recommended backend layout:

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/
│   ├── businesses/
│   ├── clients/
│   ├── products/
│   ├── taxes/
│   ├── invoices/
│   ├── quotes/
│   ├── payments/
│   ├── themes/
│   ├── documents/
│   ├── files/
│   └── notifications/
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
├── infrastructure/
│   ├── database/
│   ├── auth/
│   ├── storage/
│   ├── email/
│   └── jobs/
└── config/
```

Typical NestJS feature:

```text
invoices/
├── invoices.module.ts
├── invoices.controller.ts
├── invoices.service.ts
├── invoices.repository.ts
├── dto/
├── domain/
└── mappers/
```

Controllers stay thin. Workflow/business rules live in services/use-cases and shared domain packages. Persistence stays behind repository interfaces.

# Monorepo architecture

```text
invoiceflow/
├── apps/
│   ├── web/       # Next.js
│   ├── mobile/    # Plain React Native
│   └── api/       # NestJS + Fastify
├── packages/
│   ├── domain/
│   ├── calculations/
│   ├── validation/
│   ├── types/
│   ├── api-client/
│   ├── document-schema/
│   ├── theme-schema/
│   ├── design-tokens/
│   └── utils/
└── infrastructure/
    └── supabase/
```

Recommended workspace tooling:
- pnpm workspaces
- Turborepo

Share domain logic aggressively. Do not force shared visual UI between Next.js and React Native.
