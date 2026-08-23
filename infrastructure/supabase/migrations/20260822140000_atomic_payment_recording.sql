-- Atomically record a payment and its derived invoice state and activity.
-- Only the API service role may execute this workflow RPC.

create or replace function public.record_invoice_payment(
  p_payment_id uuid,
  p_invoice_id uuid,
  p_business_id uuid,
  p_amount numeric,
  p_invoice_total numeric,
  p_paid_at timestamptz,
  p_method text,
  p_reference text,
  p_recorded_at timestamptz
)
returns table (status text, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice_status text;
  paid_total numeric;
  next_status text;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  if p_invoice_total is null or p_invoice_total <= 0 then
    raise exception 'Invoice total must be greater than zero';
  end if;

  if p_paid_at is null or p_recorded_at is null then
    raise exception 'Payment timestamps are required';
  end if;

  select invoice.status
  into invoice_status
  from public.invoices as invoice
  where invoice.id = p_invoice_id
    and invoice.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  if invoice_status not in ('sent', 'viewed', 'partially_paid', 'overdue') then
    raise exception 'Invoice status is not eligible for payment';
  end if;

  select coalesce(sum(payment.amount), 0)
  into paid_total
  from public.payments as payment
  where payment.invoice_id = p_invoice_id;

  if paid_total + p_amount > p_invoice_total then
    raise exception 'Payment amount exceeds invoice balance';
  end if;

  if paid_total + p_amount = p_invoice_total then
    next_status := 'paid';
  else
    next_status := 'partially_paid';
  end if;

  insert into public.payments (
    id,
    invoice_id,
    amount,
    paid_at,
    method,
    reference
  ) values (
    p_payment_id,
    p_invoice_id,
    p_amount,
    p_paid_at,
    p_method,
    p_reference
  );

  update public.invoices as invoice
  set status = next_status,
      updated_at = p_recorded_at
  where invoice.id = p_invoice_id;

  insert into public.activity_events (
    business_id,
    entity_type,
    entity_id,
    type,
    occurred_at,
    metadata
  ) values (
    p_business_id,
    'invoice',
    p_invoice_id,
    'payment_recorded',
    p_recorded_at,
    jsonb_build_object('amount', p_amount::text)
  );

  return query select next_status, p_recorded_at;
end;
$$;

revoke all on function public.record_invoice_payment(
  uuid,
  uuid,
  uuid,
  numeric,
  numeric,
  timestamptz,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.record_invoice_payment(
  uuid,
  uuid,
  uuid,
  numeric,
  numeric,
  timestamptz,
  text,
  text,
  timestamptz
) to service_role;
