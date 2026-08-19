-- DB-01: Core schema
-- Accounts, businesses, memberships, clients, products & services, taxes.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references public.accounts(id),
  name text not null,
  legal_name text,
  email text,
  phone text,
  website text,
  address_line1 text,
  address_line2 text,
  address_city text,
  address_region text,
  address_postal_code text,
  address_country_code text,
  country_code text not null,
  currency_code text not null,
  logo_asset_id uuid,
  default_invoice_theme_id uuid,
  default_quote_theme_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_owner_account_id_idx
  on public.businesses (owner_account_id);

create table if not exists public.business_members (
  account_id uuid not null references public.accounts(id),
  business_id uuid not null references public.businesses(id),
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (account_id, business_id)
);

create index if not exists business_members_business_id_idx
  on public.business_members (business_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text,
  company text,
  phone text,
  billing_address_line1 text,
  billing_address_line2 text,
  billing_address_city text,
  billing_address_region text,
  billing_address_postal_code text,
  billing_address_country_code text,
  tax_number text,
  internal_note text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_require_name_or_company
    check (name is not null or company is not null)
);

create index if not exists clients_business_id_idx
  on public.clients (business_id);

create index if not exists clients_business_archived_idx
  on public.clients (business_id, archived_at);

create table if not exists public.client_emails (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  address text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, address)
);

create table if not exists public.product_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  type text not null check (type in ('product', 'service')),
  name text not null,
  description text,
  default_rate numeric(19, 4),
  unit text check (unit in ('fixed', 'hour', 'day', 'unit', 'month', 'project')),
  default_tax_ids uuid[] not null default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_services_business_id_idx
  on public.product_services (business_id);

create index if not exists product_services_business_archived_idx
  on public.product_services (business_id, archived_at);

create table if not exists public.taxes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text not null,
  rate numeric(10, 6) not null,
  registration_number text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists taxes_business_id_idx
  on public.taxes (business_id);

alter table public.accounts enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.clients enable row level security;
alter table public.client_emails enable row level security;
alter table public.product_services enable row level security;
alter table public.taxes enable row level security;
