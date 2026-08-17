# 04 — Data Model Expectations

This is a product-level model, not a migration script.

Use decimal-safe money handling:
- integer minor units, or
- a decimal library/type

Never use binary floating-point as the financial source of truth.

---

## Account

```ts
type Account = {
  id: string
  name: string
  email: string
}
```

---

## Business

```ts
type Business = {
  id: string
  ownerAccountId: string
  name: string
  legalName?: string
  email?: string
  phone?: string
  website?: string
  address?: Address
  countryCode: string
  currencyCode: string
  logoAssetId?: string
  defaultInvoiceThemeId: string
  defaultQuoteThemeId: string
}
```

---

## Client

```ts
type Client = {
  id: string
  businessId: string
  name?: string
  company?: string
  emails: ClientEmail[]
  phone?: string
  billingAddress?: Address
  taxNumber?: string
  internalNote?: string
  archivedAt?: string
}
```

Require at least one:
- name
- company

---

## ProductService

```ts
type ProductService = {
  id: string
  businessId: string
  type: 'product' | 'service'
  name: string
  description?: string
  defaultRate?: Money
  unit?: 'fixed' | 'hour' | 'day' | 'unit' | 'month' | 'project'
  defaultTaxIds?: string[]
  archivedAt?: string
}
```

---

## Tax

```ts
type Tax = {
  id: string
  businessId: string
  name: string
  rate: Decimal
  registrationNumber?: string
  isDefault: boolean
}
```

Support multiple applied tax lines per item/document.

---

## ClientSnapshot

Historical documents must not live-join current client data.

```ts
type ClientSnapshot = {
  displayName: string
  emails: string[]
  phone?: string
  address?: Address
  taxNumber?: string
}
```

---

## BusinessSnapshot

```ts
type BusinessSnapshot = {
  displayName: string
  legalName?: string
  email?: string
  phone?: string
  website?: string
  address?: Address
  taxNumbers?: string[]
  logoAssetId?: string
}
```

---

## DocumentItem

```ts
type DocumentItem = {
  id: string
  sourceProductServiceId?: string
  description: string
  secondaryDescription?: string
  quantity: Decimal
  rate: Money
  appliedTaxes: AppliedTax[]
}
```

Document item values are snapshots/overrides.

---

## DepositTerms

```ts
type DepositTerms =
  | {
      type: 'percentage'
      value: Decimal
      dueRule: 'on_receipt' | 'days_7' | 'days_15' | 'custom'
      dueDate?: string
    }
  | {
      type: 'fixed'
      value: Money
      dueRule: 'on_receipt' | 'days_7' | 'days_15' | 'custom'
      dueDate?: string
    }
```

Deposit does not reduce Total.

---

## Invoice

```ts
type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void'

type Invoice = {
  id: string
  businessId: string
  number: string

  clientId?: string
  clientSnapshot: ClientSnapshot
  businessSnapshot: BusinessSnapshot

  currencyCode: string

  issueDate: string
  dueDate?: string

  items: DocumentItem[]

  discount?: DocumentDiscount
  depositTerms?: DepositTerms

  notes?: RichTextDocument
  terms?: RichTextDocument
  poNumber?: string

  status: InvoiceStatus

  sourceQuoteId?: string

  themeId: string
  themeVersionId: string
  themeNameSnapshot?: string

  createdAt: string
  updatedAt: string
  sentAt?: string
}
```

For Draft:
- themeVersionId may change explicitly.

For Sent:
- themeVersionId freezes.

---

## Payment

```ts
type Payment = {
  id: string
  invoiceId: string
  amount: Money
  paidAt: string
  method?: string
  reference?: string
}
```

---

## Quote

```ts
type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'

type Quote = {
  id: string
  businessId: string
  number: string

  clientId?: string
  clientSnapshot: ClientSnapshot
  businessSnapshot: BusinessSnapshot

  currencyCode: string

  issueDate: string
  validUntil?: string

  items: DocumentItem[]
  proposedDepositTerms?: DepositTerms

  notes?: RichTextDocument
  terms?: RichTextDocument

  status: QuoteStatus

  themeId: string
  themeVersionId: string
  themeNameSnapshot?: string

  convertedInvoiceIds: string[]

  createdAt: string
  updatedAt: string
  sentAt?: string
}
```

---

## ActivityEvent

```ts
type ActivityEvent = {
  id: string
  businessId: string
  entityType: 'invoice' | 'quote'
  entityId: string
  type:
    | 'created'
    | 'sent'
    | 'viewed'
    | 'accepted'
    | 'declined'
    | 'payment_recorded'
    | 'voided'
    | 'converted'
  occurredAt: string
  metadata?: Record<string, unknown>
}
```

---

## Theme

```ts
type DocumentTheme = {
  id: string
  businessId: string
  name: string
  appliesToInvoice: boolean
  appliesToQuote: boolean
  currentVersionId: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

```ts
type DocumentThemeVersion = {
  id: string
  themeId: string
  version: number
  schemaVersion: number
  config: DocumentThemeConfig
  createdAt: string
  createdBy?: string
}
```

Versions are immutable.

Editing creates a new version.

---

## Autosave

```ts
type SaveState =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; savedAt: string }
  | { state: 'error'; retryable: boolean }
```


# Persistence boundary

Domain types must not depend on Supabase-generated database types.

Prefer application-owned domain types plus mapping at the infrastructure boundary.

Example:

```ts
interface InvoiceRepository {
  findById(id: string, businessId: string): Promise<Invoice | null>
  save(invoice: Invoice): Promise<void>
  list(query: InvoiceListQuery): Promise<InvoicePage>
}
```

```ts
interface ThemeRepository {
  getTheme(id: string, businessId: string): Promise<DocumentTheme | null>
  getVersion(id: string): Promise<DocumentThemeVersion | null>
  createVersion(version: DocumentThemeVersion): Promise<void>
}
```

Initial implementation:
- Supabase/PostgreSQL

Possible future implementation:
- Azure Database for PostgreSQL
- another PostgreSQL provider
- another persistence engine

The rest of the product should not need to know which database provider is used.
