# 01 — Product Requirements

## 1. Product model

Account
→ Business workspace
→ Business-scoped records

Business-scoped:
- Dashboard
- Invoices
- Quotes
- Clients
- Products & Services
- Taxes
- Payment instructions
- Numbering
- Document defaults
- Document Themes
- Branding assets

Account-scoped:
- Profile
- Email
- Password/security
- Preferences

---

## 2. Authentication

Screens:
- Sign In
- Sign Up
- Forgot Password
- Reset Password

Keep auth minimal.

Do not mix business setup into registration.

---

## 3. First business creation

First login with zero businesses:

Authentication
→ Create Business
→ First-Time Dashboard

Required:
- Business name
- Country
- Currency

Optional:
- Logo

Do not force:
- tax configuration
- address
- payment instructions
- numbering
- document themes

---

## 4. First-time dashboard

Primary goals:
- Create Invoice
- Create Quote
- Finish Setup

Do not show meaningless $0 metrics as the main content.

---

## 5. Established dashboard

Show:
- Overdue
- Outstanding
- Paid this month
- Needs attention
- Recent activity

Actions matter more than charts.

---

## 6. Invoice lifecycle

Core flow:

Create
→ Edit
→ Review
→ Send
→ Invoice Detail
→ Record Payment
→ Partially Paid
→ Paid

Statuses:
- Draft
- Sent
- Viewed
- Partially Paid
- Paid
- Overdue
- Void

Sent invoices should generally be voided instead of deleted.
Drafts may be deleted.

---

## 7. Invoice editor

Create and edit use the same screen.

Sections:
1. Client
2. Invoice details
3. Items
4. Totals / Tax
5. Deposit
6. Notes
7. More Options
8. Sticky Review Invoice action

Autosave:
- Saving…
- Saved ✓
- Not saved / Retry

Do not make Save Draft the dominant action.

---

## 8. Client selector

Search by:
- name
- company
- email
- phone

Actions:
- select existing
- add new client inline

After adding:
- auto-select the new client

Desktop:
- searchable popover/drawer

Mobile:
- full-screen selector

---

## 9. Invoice dates

Support due presets:
- On receipt
- 7 days
- 15 days
- 30 days
- 60 days
- Custom

---

## 10. Invoice items

Desktop:
- editable table/rows

Mobile:
- item cards
- dedicated add/edit sheet/screen

Fields:
- description
- optional secondary description
- quantity
- rate
- tax

Rules:
- custom item always allowed
- saved product/service optional
- quantity supports decimals
- do not aggressively format numeric values while typing
- editing an invoice item does not mutate the product library

---

## 11. Tax

Tax defaults belong to Business Settings.

Do not hard-code HST globally.

Tax architecture must support multiple tax components.

Example future use:
- GST
- PST
- GST + PST

---

## 12. Deposit

Deposit is not:
- discount
- line item
- second invoice

Display:

Total
Deposit Required
Remaining Balance

Example:

Subtotal        $5,000
Tax               $650
Total           $5,650
Deposit 30%     $1,695
Remaining       $3,955

Deposit types:
- Percentage
- Fixed

Deposit due:
- On receipt
- 7 days
- 15 days
- Custom date

Record Payment must not force payment amount to equal requested deposit.

---

## 13. More Options

Optional:
- Discount
- PO #
- Payment terms
- Custom fields
- Attachments

Deposit does not belong here.

---

## 14. Validation

Do not show a red wall on initial load.

Validate on blur or progression.

Review blocking messages:
- Select a client.
- Add at least one invoice item.
- Enter a rate.
- Invalid email address.

Focus or scroll to the first issue.

---

## 15. Invoice Review

Read-only.

Desktop:
- document preview
- summary / theme / send progression

Mobile:
- scaled preview
- summary
- sticky CTA

Review must not send immediately.

Primary:
- Continue to Send

Secondary:
- Download PDF
- Back to Edit

---

## 16. Send Invoice

Fields:
- To: one or more email chips
- CC
- BCC
- Subject
- Message
- PDF attachment
- total
- deposit due

Validate each email independently.

After send:
→ Invoice Detail

No dead-end success page.

---

## 17. Invoice Detail

Permanent home for sent invoice.

Show:
- status
- Total
- Paid
- Balance
- client
- actions
- activity timeline

Actions:
- Record Payment
- Send Again
- Download PDF
- Duplicate
- Void

---

## 18. Record Payment

Fields:
- amount
- date
- method
- reference

Status:
- balance > 0 and paid > 0 → Partially Paid
- balance == 0 → Paid

---

## 19. Invoice list

Desktop table:
- Number
- Client
- Due
- Total
- Status

Tabs:
- All
- Draft
- Outstanding
- Overdue
- Paid

Outstanding includes:
- Sent
- Viewed
- Partially Paid

Search:
- number
- client
- company
- email

Mobile:
- cards/list
- relative overdue text

No dedicated deposit column.

---

## 20. Quote lifecycle

Flow:

Create Quote
→ Review
→ Send
→ Viewed
→ Accept / Decline
→ Convert to Invoice

Statuses:
- Draft
- Sent
- Viewed
- Accepted
- Declined
- Expired

Viewing is not acceptance.

Acceptance must be explicit.

---

## 21. Quote fields

- Quote #
- Issue date
- Valid until
- Client
- Items
- Taxes
- Notes
- Terms
- Proposed deposit

Quote deposit wording:
- Deposit upon acceptance

---

## 22. Quote → Invoice conversion

Accepted quote:
Primary action:
- Convert to Invoice

Copy:
- client
- items
- prices
- taxes
- proposed deposit terms
- notes
- terms

Create:
- new Invoice #
- new dates
- Draft status

Never reuse Quote #.

Maintain links both ways.

---

## 23. Clients

Not a CRM.

Client fields:
- Name OR Company required
- multiple emails
- phone
- billing address
- tax number
- internal notes

List:
- display name/company
- email
- outstanding

Detail:
- client information
- outstanding
- New Invoice
- New Quote
- related invoices
- related quotes

Historical documents preserve client snapshots after client edits/archive.

---

## 24. Products & Services

Optional shortcuts.

Fields:
- Product / Service
- Name
- Description
- Default rate
- Unit
- Default tax

Units:
- Fixed
- Hour
- Day
- Unit
- Month
- Project

Document overrides do not mutate saved library item.

---

## 25. Business Settings

Sections:
1. Business Profile
2. Document Defaults
3. Taxes
4. Payments
5. Document Themes
6. Numbering
7. Manage Businesses

Business Profile:
- business/legal name
- email
- phone
- website
- address
- country
- currency
- default logo

Currency changes:
- apply to new documents only
- old docs retain original currency
- warn before changing

---

## 26. Multi-business

Business is a workspace context, not a filter.

Switching business:
- changes all business-scoped data
- must be visually obvious

If switching during edit:
- confirm draft saved
- Stay Here
- Switch Business

Business data is isolated by default.

---

## 27. Document Themes

See `05_DOCUMENT_RENDERER_AND_THEME_SYSTEM.md`.

Summary:
- multiple themes per business
- default invoice theme
- default quote theme
- Clean / Modern / Minimal presets
- structured Theme Builder
- no arbitrary CSS/HTML/JS
- immutable theme versions
- sent documents freeze version
