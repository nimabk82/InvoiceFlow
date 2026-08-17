# 11 — Backend and Monorepo Architecture

## Final stack

```text
Web:      Next.js + React + TypeScript
Mobile:   Plain React Native + TypeScript
Backend:  Node.js + NestJS + Fastify
Database: Supabase PostgreSQL
Auth:     Supabase Auth
Storage:  Supabase Storage
Monorepo: pnpm + Turborepo
```

## High-level architecture

```text
Next.js Web ───────┐
                   │ HTTPS
React Native ──────┼────→ NestJS + Fastify API
                   │             │
                   │       repositories/providers
                   │             │
                   └─────────────┼───────────────┐
                                 ▼               ▼
                         Supabase Postgres   Supabase Storage/Auth
```

Web and Mobile do not need to know which database provider is used.

## NestJS responsibility

The API owns:
- business-scoped authorization
- invoice workflow
- quote workflow
- quote → invoice conversion
- payment recording
- document status transitions
- numbering
- theme lifecycle
- immutable theme versions
- freeze theme version on send
- audit events
- storage/email/PDF orchestration

Pure calculations may live in shared packages, but the backend is authoritative for sensitive workflow transitions.

## Supabase role

Use Supabase for infrastructure:
- PostgreSQL
- Auth
- Storage
- optional Realtime where useful

Avoid making Supabase SDK calls the foundation of product-domain code.

## Replaceable infrastructure

Define interfaces such as:

```ts
interface InvoiceRepository {
  findById(id: string, businessId: string): Promise<Invoice | null>
  save(invoice: Invoice): Promise<void>
}
```

```ts
interface FileStorage {
  upload(input: UploadFileInput): Promise<StoredFile>
  delete(fileId: string): Promise<void>
}
```

```ts
interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult>
}
```

Initial:
```text
InvoiceRepository → Supabase/PostgreSQL
FileStorage       → Supabase Storage
Authentication    → Supabase Auth
```

Possible future:
```text
InvoiceRepository → Azure Database for PostgreSQL
FileStorage       → Azure Blob Storage
Authentication    → another identity provider
```

Migration should primarily affect infrastructure adapters and data migration, not Web/Mobile/domain architecture.

## Practical NestJS layering

```text
Controller
    ↓
Service / Use Case
    ↓
Shared domain/calculations
    ↓
Repository interface
    ↓
Supabase/PostgreSQL repository
```

## Suggested API modules

```text
apps/api/src/modules/
├── auth/
├── businesses/
├── clients/
├── products/
├── taxes/
├── invoices/
├── quotes/
├── payments/
├── themes/
├── rendering/
├── files/
├── email/
└── audit/
```

## Example API surface

```text
POST   /businesses

GET    /invoices
POST   /invoices
GET    /invoices/:id
PATCH  /invoices/:id
POST   /invoices/:id/send
POST   /invoices/:id/payments
POST   /invoices/:id/void

GET    /quotes
POST   /quotes
POST   /quotes/:id/send
POST   /quotes/:id/accept
POST   /quotes/:id/convert

GET    /themes
POST   /themes
POST   /themes/:id/versions
POST   /documents/:id/adopt-theme-version
```

Exact endpoint naming may evolve.
