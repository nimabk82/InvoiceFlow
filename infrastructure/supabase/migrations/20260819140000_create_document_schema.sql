-- DB-02: Document schema
-- Invoices, quotes, document items, item taxes, payments, activity events.

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('invoice', 'quote')),
  document_id uuid not null,
  source_product_service_id uuid references public.product_services(id),
  description text not null,
  secondary_description text,
  quantity numeric not null default 1,
  rate numeric(19, 4) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists document_items_document_idx
  on public.document_items (document_type, document_id, sort_order);

create table if not exists public.document_item_taxes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.document_items(id) on delete cascade,
  tax_id uuid references public.taxes(id),
  name text not null,
  rate numeric(10, 6) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists document_item_taxes_item_id_idx
  on public.document_item_taxes (item_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  number text not null,
  client_id uuid references public.clients(id),
  client_snapshot jsonb not null default '{}'::jsonb,
  business_snapshot jsonb not null default '{}'::jsonb,
  currency_code text not null,
  issue_date date not null,
  due_date date,
  discount jsonb,
  deposit_terms jsonb,
  notes jsonb,
  terms jsonb,
  po_number text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void')),
  source_quote_id uuid,
  theme_id uuid,
  theme_version_id uuid,
  theme_name_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists invoices_business_status_idx
  on public.invoices (business_id, status);

create index if not exists invoices_business_created_idx
  on public.invoices (business_id, created_at desc);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  number text not null,
  client_id uuid references public.clients(id),
  client_snapshot jsonb not null default '{}'::jsonb,
  business_snapshot jsonb not null default '{}'::jsonb,
  currency_code text not null,
  issue_date date not null,
  valid_until date,
  proposed_deposit_terms jsonb,
  notes jsonb,
  terms jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  theme_id uuid,
  theme_version_id uuid,
  theme_name_snapshot text,
  converted_invoice_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists quotes_business_status_idx
  on public.quotes (business_id, status);

create index if not exists quotes_business_created_idx
  on public.quotes (business_id, created_at desc);

alter table public.invoices
  add constraint invoices_source_quote_id_fkey
  foreign key (source_quote_id) references public.quotes(id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  amount numeric(19, 4) not null,
  paid_at timestamptz not null,
  method text,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists payments_invoice_id_idx
  on public.payments (invoice_id);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  entity_type text not null check (entity_type in ('invoice', 'quote')),
  entity_id uuid not null,
  type text not null
    check (type in ('created', 'sent', 'viewed', 'accepted', 'declined', 'payment_recorded', 'voided', 'converted')),
  occurred_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists activity_events_business_idx
  on public.activity_events (business_id, occurred_at desc);

create index if not exists activity_events_entity_idx
  on public.activity_events (entity_type, entity_id);

alter table public.document_items enable row level security;
alter table public.document_item_taxes enable row level security;
alter table public.invoices enable row level security;
alter table public.quotes enable row level security;
alter table public.payments enable row level security;
alter table public.activity_events enable row level security;
