-- Business-level settings for payments, numbering, and branding.
create table if not exists public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  bank_transfer_instructions text,
  cheque_instructions text,
  invoice_prefix text,
  next_invoice_number integer,
  quote_prefix text,
  next_quote_number integer,
  accent_color text,
  style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;
