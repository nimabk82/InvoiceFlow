-- Phase 1 workflow hardening: atomic document aggregates and CAS transitions.

create or replace function public.replace_document_items(
  p_document_type text,
  p_document_id uuid,
  p_items jsonb
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if p_document_type not in ('invoice', 'quote') then
    raise exception 'Unsupported document type';
  end if;

  delete from public.document_items
  where document_type = p_document_type
    and document_id = p_document_id;

  insert into public.document_items (
    id,
    document_type,
    document_id,
    source_product_service_id,
    description,
    secondary_description,
    quantity,
    rate,
    sort_order
  )
  select
    (item ->> 'id')::uuid,
    p_document_type,
    p_document_id,
    nullif(item ->> 'source_product_service_id', '')::uuid,
    item ->> 'description',
    item ->> 'secondary_description',
    (item ->> 'quantity')::numeric,
    (item ->> 'rate')::numeric,
    (item ->> 'sort_order')::integer
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  insert into public.document_item_taxes (item_id, tax_id, name, rate, sort_order)
  select
    (item ->> 'id')::uuid,
    nullif(tax ->> 'tax_id', '')::uuid,
    tax ->> 'name',
    (tax ->> 'rate')::numeric,
    tax_index - 1
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
  cross join lateral jsonb_array_elements(coalesce(item -> 'taxes', '[]'::jsonb))
    with ordinality as taxes(tax, tax_index);
end;
$$;

create or replace function public.save_invoice_aggregate(
  p_invoice jsonb,
  p_items jsonb
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_invoice_id uuid := (p_invoice ->> 'id')::uuid;
  v_saved_id uuid;
begin
  insert into public.invoices (
    id,
    business_id,
    number,
    client_id,
    client_snapshot,
    business_snapshot,
    currency_code,
    issue_date,
    due_date,
    discount,
    deposit_terms,
    notes,
    terms,
    po_number,
    status,
    source_quote_id,
    theme_id,
    theme_version_id,
    theme_name_snapshot,
    created_at,
    updated_at,
    sent_at
  ) values (
    v_invoice_id,
    (p_invoice ->> 'business_id')::uuid,
    p_invoice ->> 'number',
    nullif(p_invoice ->> 'client_id', '')::uuid,
    p_invoice -> 'client_snapshot',
    p_invoice -> 'business_snapshot',
    p_invoice ->> 'currency_code',
    (p_invoice ->> 'issue_date')::date,
    nullif(p_invoice ->> 'due_date', '')::date,
    p_invoice -> 'discount',
    p_invoice -> 'deposit_terms',
    p_invoice -> 'notes',
    p_invoice -> 'terms',
    p_invoice ->> 'po_number',
    p_invoice ->> 'status',
    nullif(p_invoice ->> 'source_quote_id', '')::uuid,
    nullif(p_invoice ->> 'theme_id', '')::uuid,
    nullif(p_invoice ->> 'theme_version_id', '')::uuid,
    p_invoice ->> 'theme_name_snapshot',
    (p_invoice ->> 'created_at')::timestamptz,
    (p_invoice ->> 'updated_at')::timestamptz,
    nullif(p_invoice ->> 'sent_at', '')::timestamptz
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    number = excluded.number,
    client_id = excluded.client_id,
    client_snapshot = excluded.client_snapshot,
    business_snapshot = excluded.business_snapshot,
    currency_code = excluded.currency_code,
    issue_date = excluded.issue_date,
    due_date = excluded.due_date,
    discount = excluded.discount,
    deposit_terms = excluded.deposit_terms,
    notes = excluded.notes,
    terms = excluded.terms,
    po_number = excluded.po_number,
    status = excluded.status,
    source_quote_id = excluded.source_quote_id,
    theme_id = excluded.theme_id,
    theme_version_id = excluded.theme_version_id,
    theme_name_snapshot = excluded.theme_name_snapshot,
    updated_at = excluded.updated_at,
    sent_at = excluded.sent_at
  where excluded.status <> 'draft'
    or invoices.status = 'draft'
  returning id into v_saved_id;

  if v_saved_id is null then
    raise exception 'Invoice aggregate compare-and-set failed';
  end if;

  perform public.replace_document_items('invoice', v_invoice_id, p_items);
end;
$$;

create or replace function public.save_quote_aggregate(
  p_quote jsonb,
  p_items jsonb
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_quote_id uuid := (p_quote ->> 'id')::uuid;
  v_saved_id uuid;
begin
  insert into public.quotes (
    id,
    business_id,
    number,
    client_id,
    client_snapshot,
    business_snapshot,
    currency_code,
    issue_date,
    valid_until,
    proposed_deposit_terms,
    notes,
    terms,
    status,
    theme_id,
    theme_version_id,
    theme_name_snapshot,
    converted_invoice_ids,
    created_at,
    updated_at,
    sent_at
  ) values (
    v_quote_id,
    (p_quote ->> 'business_id')::uuid,
    p_quote ->> 'number',
    nullif(p_quote ->> 'client_id', '')::uuid,
    p_quote -> 'client_snapshot',
    p_quote -> 'business_snapshot',
    p_quote ->> 'currency_code',
    (p_quote ->> 'issue_date')::date,
    nullif(p_quote ->> 'valid_until', '')::date,
    p_quote -> 'proposed_deposit_terms',
    p_quote -> 'notes',
    p_quote -> 'terms',
    p_quote ->> 'status',
    nullif(p_quote ->> 'theme_id', '')::uuid,
    nullif(p_quote ->> 'theme_version_id', '')::uuid,
    p_quote ->> 'theme_name_snapshot',
    array(select jsonb_array_elements_text(p_quote -> 'converted_invoice_ids'))::uuid[],
    (p_quote ->> 'created_at')::timestamptz,
    (p_quote ->> 'updated_at')::timestamptz,
    nullif(p_quote ->> 'sent_at', '')::timestamptz
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    number = excluded.number,
    client_id = excluded.client_id,
    client_snapshot = excluded.client_snapshot,
    business_snapshot = excluded.business_snapshot,
    currency_code = excluded.currency_code,
    issue_date = excluded.issue_date,
    valid_until = excluded.valid_until,
    proposed_deposit_terms = excluded.proposed_deposit_terms,
    notes = excluded.notes,
    terms = excluded.terms,
    status = excluded.status,
    theme_id = excluded.theme_id,
    theme_version_id = excluded.theme_version_id,
    theme_name_snapshot = excluded.theme_name_snapshot,
    converted_invoice_ids = excluded.converted_invoice_ids,
    updated_at = excluded.updated_at,
    sent_at = excluded.sent_at
  where excluded.status <> 'draft'
    or quotes.status = 'draft'
  returning id into v_saved_id;

  if v_saved_id is null then
    raise exception 'Quote aggregate compare-and-set failed';
  end if;

  perform public.replace_document_items('quote', v_quote_id, p_items);
end;
$$;

create or replace function public.send_invoice_if_draft(
  p_invoice_id uuid,
  p_business_id uuid,
  p_sent_at timestamptz
)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.invoices
  set status = 'sent', sent_at = p_sent_at, updated_at = p_sent_at
  where id = p_invoice_id
    and business_id = p_business_id
    and status = 'draft';

  return found;
end;
$$;

create or replace function public.send_quote_if_draft(
  p_quote_id uuid,
  p_business_id uuid,
  p_sent_at timestamptz
)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.quotes
  set status = 'sent', sent_at = p_sent_at, updated_at = p_sent_at
  where id = p_quote_id
    and business_id = p_business_id
    and status = 'draft';

  return found;
end;
$$;

create or replace function public.convert_quote_to_invoice(
  p_quote_id uuid,
  p_business_id uuid,
  p_expected_updated_at timestamptz,
  p_quote_updated_at timestamptz,
  p_invoice jsonb,
  p_items jsonb
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_invoice_id uuid := (p_invoice ->> 'id')::uuid;
begin
  if (p_invoice ->> 'business_id')::uuid <> p_business_id
      or (p_invoice ->> 'source_quote_id')::uuid <> p_quote_id then
    raise exception 'Converted invoice relationship does not match quote';
  end if;

  update public.quotes
  set converted_invoice_ids = array_append(converted_invoice_ids, v_invoice_id),
      updated_at = p_quote_updated_at
  where id = p_quote_id
    and business_id = p_business_id
    and status = 'accepted'
    and updated_at = p_expected_updated_at;

  if not found then
    return false;
  end if;

  perform public.save_invoice_aggregate(p_invoice, p_items);
  return true;
end;
$$;

revoke all on function public.replace_document_items(text, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.save_invoice_aggregate(jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.save_quote_aggregate(jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.send_invoice_if_draft(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.send_quote_if_draft(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.convert_quote_to_invoice(
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  jsonb,
  jsonb
) from public, anon, authenticated;

grant execute on function public.replace_document_items(text, uuid, jsonb)
  to service_role;
grant execute on function public.save_invoice_aggregate(jsonb, jsonb)
  to service_role;
grant execute on function public.save_quote_aggregate(jsonb, jsonb)
  to service_role;
grant execute on function public.send_invoice_if_draft(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.send_quote_if_draft(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.convert_quote_to_invoice(
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  jsonb,
  jsonb
) to service_role;
