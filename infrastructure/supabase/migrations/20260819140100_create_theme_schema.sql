-- DB-03: Theme schema
-- Document themes, immutable versions, and document/version references.

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text not null,
  applies_to_invoice boolean not null default false,
  applies_to_quote boolean not null default false,
  current_version_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists themes_business_id_idx
  on public.themes (business_id);

create table if not exists public.theme_versions (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  version integer not null,
  schema_version integer not null,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references public.accounts(id),
  created_at timestamptz not null default now(),
  unique (theme_id, version)
);

create index if not exists theme_versions_theme_id_idx
  on public.theme_versions (theme_id);

alter table public.themes
  add constraint themes_current_version_id_fkey
  foreign key (current_version_id) references public.theme_versions(id);

alter table public.businesses
  add constraint businesses_default_invoice_theme_id_fkey
  foreign key (default_invoice_theme_id) references public.themes(id);

alter table public.businesses
  add constraint businesses_default_quote_theme_id_fkey
  foreign key (default_quote_theme_id) references public.themes(id);

alter table public.invoices
  add constraint invoices_theme_id_fkey
  foreign key (theme_id) references public.themes(id);

alter table public.invoices
  add constraint invoices_theme_version_id_fkey
  foreign key (theme_version_id) references public.theme_versions(id);

alter table public.quotes
  add constraint quotes_theme_id_fkey
  foreign key (theme_id) references public.themes(id);

alter table public.quotes
  add constraint quotes_theme_version_id_fkey
  foreign key (theme_version_id) references public.theme_versions(id);

alter table public.themes enable row level security;
alter table public.theme_versions enable row level security;
