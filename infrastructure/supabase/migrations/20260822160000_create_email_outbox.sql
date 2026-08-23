-- Phase 1 delivery hardening: durable, claim-based document email outbox.

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  command_key text not null unique,
  entity_type text not null check (entity_type in ('invoice', 'quote')),
  entity_id uuid not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'accepted', 'failed')),
  to_addresses text[] not null,
  cc_addresses text[] not null default '{}',
  bcc_addresses text[] not null default '{}',
  subject text not null,
  text_body text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  provider_name text,
  provider_message_id text,
  claim_token uuid,
  claimed_at timestamptz,
  accepted_at timestamptz,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_outbox_requires_recipient
    check (cardinality(to_addresses) > 0),
  constraint email_outbox_requires_subject
    check (length(btrim(subject)) > 0)
);

create index email_outbox_claim_idx
  on public.email_outbox (status, available_at, created_at)
  where status in ('queued', 'failed', 'processing');

alter table public.email_outbox enable row level security;

create function public.send_invoice_and_enqueue_email(
  p_invoice_id uuid,
  p_business_id uuid,
  p_sent_at timestamptz,
  p_command_key text,
  p_to_addresses text[],
  p_cc_addresses text[],
  p_bcc_addresses text[],
  p_subject text,
  p_text_body text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_outbox_id uuid;
begin
  update public.invoices
  set status = 'sent', sent_at = p_sent_at, updated_at = p_sent_at
  where id = p_invoice_id
    and business_id = p_business_id
    and status = 'draft';

  if not found then
    return null;
  end if;

  insert into public.email_outbox (
    business_id,
    command_key,
    entity_type,
    entity_id,
    to_addresses,
    cc_addresses,
    bcc_addresses,
    subject,
    text_body
  ) values (
    p_business_id,
    p_command_key,
    'invoice',
    p_invoice_id,
    p_to_addresses,
    coalesce(p_cc_addresses, '{}'),
    coalesce(p_bcc_addresses, '{}'),
    p_subject,
    p_text_body
  )
  returning id into v_outbox_id;

  insert into public.activity_events (
    business_id,
    entity_type,
    entity_id,
    type,
    occurred_at
  ) values (
    p_business_id,
    'invoice',
    p_invoice_id,
    'sent',
    p_sent_at
  );

  return v_outbox_id;
end;
$$;

create function public.send_quote_and_enqueue_email(
  p_quote_id uuid,
  p_business_id uuid,
  p_sent_at timestamptz,
  p_command_key text,
  p_to_addresses text[],
  p_cc_addresses text[],
  p_bcc_addresses text[],
  p_subject text,
  p_text_body text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_outbox_id uuid;
begin
  update public.quotes
  set status = 'sent', sent_at = p_sent_at, updated_at = p_sent_at
  where id = p_quote_id
    and business_id = p_business_id
    and status = 'draft';

  if not found then
    return null;
  end if;

  insert into public.email_outbox (
    business_id,
    command_key,
    entity_type,
    entity_id,
    to_addresses,
    cc_addresses,
    bcc_addresses,
    subject,
    text_body
  ) values (
    p_business_id,
    p_command_key,
    'quote',
    p_quote_id,
    p_to_addresses,
    coalesce(p_cc_addresses, '{}'),
    coalesce(p_bcc_addresses, '{}'),
    p_subject,
    p_text_body
  )
  returning id into v_outbox_id;

  insert into public.activity_events (
    business_id,
    entity_type,
    entity_id,
    type,
    occurred_at
  ) values (
    p_business_id,
    'quote',
    p_quote_id,
    'sent',
    p_sent_at
  );

  return v_outbox_id;
end;
$$;

create function public.claim_email_outbox(p_outbox_id uuid default null)
returns setof public.email_outbox
language sql
set search_path = public
as $$
  with claimable as (
    select id
    from public.email_outbox
    where (p_outbox_id is null or id = p_outbox_id)
      and available_at <= now()
      and (
        status in ('queued', 'failed')
        or (status = 'processing' and claimed_at < now() - interval '5 minutes')
      )
    order by created_at
    limit 1
    for update skip locked
  )
  update public.email_outbox as outbox
  set status = 'processing',
      attempt_count = outbox.attempt_count + 1,
      last_error = null,
      claim_token = gen_random_uuid(),
      claimed_at = now(),
      updated_at = now()
  from claimable
  where outbox.id = claimable.id
  returning outbox.*;
$$;

create function public.mark_email_outbox_accepted(
  p_outbox_id uuid,
  p_claim_token uuid,
  p_provider_name text,
  p_provider_message_id text
)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.email_outbox
  set status = 'accepted',
      provider_name = p_provider_name,
      provider_message_id = p_provider_message_id,
      last_error = null,
      claim_token = null,
      accepted_at = now(),
      updated_at = now()
  where id = p_outbox_id
    and status = 'processing'
    and claim_token = p_claim_token;

  return found;
end;
$$;

create function public.mark_email_outbox_failed(
  p_outbox_id uuid,
  p_claim_token uuid,
  p_provider_name text,
  p_error text
)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.email_outbox
  set status = 'failed',
      provider_name = p_provider_name,
      last_error = left(p_error, 2000),
      claim_token = null,
      available_at = now(),
      updated_at = now()
  where id = p_outbox_id
    and status = 'processing'
    and claim_token = p_claim_token;

  return found;
end;
$$;

revoke execute on function public.send_invoice_if_draft(uuid, uuid, timestamptz)
  from service_role;
revoke execute on function public.send_quote_if_draft(uuid, uuid, timestamptz)
  from service_role;

revoke all on table public.email_outbox from public, anon, authenticated;
revoke all on function public.send_invoice_and_enqueue_email(
  uuid,
  uuid,
  timestamptz,
  text,
  text[],
  text[],
  text[],
  text,
  text
) from public, anon, authenticated;
revoke all on function public.send_quote_and_enqueue_email(
  uuid,
  uuid,
  timestamptz,
  text,
  text[],
  text[],
  text[],
  text,
  text
) from public, anon, authenticated;
revoke all on function public.claim_email_outbox(uuid)
  from public, anon, authenticated;
revoke all on function public.mark_email_outbox_accepted(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.mark_email_outbox_failed(uuid, uuid, text, text)
  from public, anon, authenticated;

grant select, insert, update on table public.email_outbox to service_role;
grant execute on function public.send_invoice_and_enqueue_email(
  uuid,
  uuid,
  timestamptz,
  text,
  text[],
  text[],
  text[],
  text,
  text
) to service_role;
grant execute on function public.send_quote_and_enqueue_email(
  uuid,
  uuid,
  timestamptz,
  text,
  text[],
  text[],
  text[],
  text,
  text
) to service_role;
grant execute on function public.claim_email_outbox(uuid) to service_role;
grant execute on function public.mark_email_outbox_accepted(uuid, uuid, text, text)
  to service_role;
grant execute on function public.mark_email_outbox_failed(uuid, uuid, text, text)
  to service_role;
