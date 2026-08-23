-- Atomically create themes with their initial version and append later versions.
-- Only the API service role may execute these lifecycle operations.

create or replace function public.create_theme_with_initial_version(
  p_business_id uuid,
  p_name text,
  p_applies_to_invoice boolean,
  p_applies_to_quote boolean,
  p_schema_version integer,
  p_config jsonb,
  p_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_theme public.themes%rowtype;
  version_id uuid := gen_random_uuid();
begin
  insert into public.themes (
    business_id,
    name,
    applies_to_invoice,
    applies_to_quote
  )
  values (
    p_business_id,
    p_name,
    p_applies_to_invoice,
    p_applies_to_quote
  )
  returning * into created_theme;

  insert into public.theme_versions (
    id,
    theme_id,
    version,
    schema_version,
    config,
    created_by
  )
  values (
    version_id,
    created_theme.id,
    1,
    p_schema_version,
    p_config,
    p_created_by
  );

  update public.themes
  set current_version_id = version_id,
      updated_at = now()
  where id = created_theme.id
  returning * into created_theme;

  return to_jsonb(created_theme);
end;
$$;

create or replace function public.append_theme_version(
  p_theme_id uuid,
  p_business_id uuid,
  p_schema_version integer,
  p_config jsonb,
  p_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_version integer;
  created_version public.theme_versions%rowtype;
begin
  perform 1
  from public.themes
  where id = p_theme_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.theme_versions
  where theme_id = p_theme_id;

  insert into public.theme_versions (
    theme_id,
    version,
    schema_version,
    config,
    created_by
  )
  values (
    p_theme_id,
    next_version,
    p_schema_version,
    p_config,
    p_created_by
  )
  returning * into created_version;

  update public.themes
  set current_version_id = created_version.id,
      updated_at = now()
  where id = p_theme_id;

  return to_jsonb(created_version);
end;
$$;

revoke all on function public.create_theme_with_initial_version(
  uuid,
  text,
  boolean,
  boolean,
  integer,
  jsonb,
  uuid
) from public, anon, authenticated;
revoke all on function public.append_theme_version(
  uuid,
  uuid,
  integer,
  jsonb,
  uuid
) from public, anon, authenticated;

grant execute on function public.create_theme_with_initial_version(
  uuid,
  text,
  boolean,
  boolean,
  integer,
  jsonb,
  uuid
) to service_role;
grant execute on function public.append_theme_version(
  uuid,
  uuid,
  integer,
  jsonb,
  uuid
) to service_role;
