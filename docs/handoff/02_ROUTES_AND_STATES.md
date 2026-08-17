# 02 — Routes and Application States

Recommended logical routes. Exact router structure may differ.

```text
/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/reset-password

/onboarding/business

/app/:businessId/dashboard

/app/:businessId/invoices
/app/:businessId/invoices/new
/app/:businessId/invoices/:invoiceId/edit
/app/:businessId/invoices/:invoiceId/review
/app/:businessId/invoices/:invoiceId/send
/app/:businessId/invoices/:invoiceId

/app/:businessId/quotes
/app/:businessId/quotes/new
/app/:businessId/quotes/:quoteId/edit
/app/:businessId/quotes/:quoteId/review
/app/:businessId/quotes/:quoteId/send
/app/:businessId/quotes/:quoteId

/app/:businessId/clients
/app/:businessId/clients/new
/app/:businessId/clients/:clientId

/app/:businessId/products
/app/:businessId/products/new
/app/:businessId/products/:productId/edit

/app/:businessId/settings/profile
/app/:businessId/settings/documents
/app/:businessId/settings/taxes
/app/:businessId/settings/payments
/app/:businessId/settings/themes
/app/:businessId/settings/themes/new
/app/:businessId/settings/themes/:themeId/edit
/app/:businessId/settings/numbering
/app/:businessId/settings/businesses

/account
```

---

# Key UI states

Invoice:
- empty
- draft editing
- autosaving
- autosave error
- review validation error
- review ready
- send form
- sent
- partial
- paid
- overdue
- void

Quote:
- draft
- sent
- viewed
- accepted
- declined
- expired
- converted

Lists:
- initial loading
- loaded
- no records
- search empty
- filter empty
- error

Theme:
- active
- archived
- current version
- historical versions
- draft using old version
- newer version available
- frozen on sent document

---

# Navigation

Desktop:
- Business switcher
- Dashboard
- Invoices
- Quotes
- Clients
- Products & Services
- Business Settings
- Help/profile lower

Tablet:
- compact/collapsible navigation

Mobile bottom nav:
- Home
- Invoices
- Quotes
- Clients
- More
