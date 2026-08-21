-- Business document defaults for new invoices/quotes.
create table if not exists public.document_defaults (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  default_due_rule text,
  default_notes text,
  default_terms text,
  default_invoice_theme_id uuid,
  default_quote_theme_id uuid,
  default_tax_ids uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.document_defaults enable row level security;
