-- Atomically provision the public account, business, and owner membership for
-- an authenticated Supabase user. Only the API service role may execute this.

create or replace function public.provision_owner_business(
  p_owner_account_id uuid,
  p_business_id uuid,
  p_name text,
  p_country_code text,
  p_currency_code text,
  p_legal_name text default null,
  p_email text default null,
  p_phone text default null,
  p_website text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_address_city text default null,
  p_address_region text default null,
  p_address_postal_code text default null,
  p_address_country_code text default null,
  p_logo_asset_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_email text;
  account_name text;
begin
  select
    auth.users.email,
    coalesce(
      nullif(auth.users.raw_user_meta_data ->> 'full_name', ''),
      nullif(auth.users.raw_user_meta_data ->> 'name', ''),
      auth.users.email
    )
  into auth_email, account_name
  from auth.users
  where auth.users.id = p_owner_account_id;

  if auth_email is null then
    raise exception 'Authenticated email account not found';
  end if;

  insert into public.accounts (id, name, email)
  values (p_owner_account_id, account_name, lower(auth_email))
  on conflict (id) do nothing;

  insert into public.businesses (
    id,
    owner_account_id,
    name,
    legal_name,
    email,
    phone,
    website,
    address_line1,
    address_line2,
    address_city,
    address_region,
    address_postal_code,
    address_country_code,
    country_code,
    currency_code,
    logo_asset_id
  )
  values (
    p_business_id,
    p_owner_account_id,
    p_name,
    p_legal_name,
    p_email,
    p_phone,
    p_website,
    p_address_line1,
    p_address_line2,
    p_address_city,
    p_address_region,
    p_address_postal_code,
    p_address_country_code,
    p_country_code,
    p_currency_code,
    p_logo_asset_id
  );

  insert into public.business_members (account_id, business_id, role)
  values (p_owner_account_id, p_business_id, 'owner');
end;
$$;

revoke all on function public.provision_owner_business(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
) from public, anon, authenticated;

grant execute on function public.provision_owner_business(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
) to service_role;
