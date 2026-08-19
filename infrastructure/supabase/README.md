# Supabase Infrastructure

Supabase is replaceable infrastructure behind the API's repository/provider
abstractions. The API talks to PostgreSQL through repository interfaces; it
never scatters direct Supabase queries through Web/Mobile product code.

## Database migrations

Version-controlled forward migrations live in `infrastructure/supabase/migrations/`
and are the schema source of truth. Migration files are named
`<timestamp>_<description>.sql`.

The Supabase CLI is configured via `config.toml` in this directory, with
`[db.migrations].schema_paths = ["./migrations"]`.

### Workflow

Run `supabase` commands from **inside** `infrastructure/supabase/` (the CLI
resolves the project, `config.toml`, and `migrations/` relative to the working
directory; the `--workdir` flag does not drive migration discovery).

```bash
# Lint migration SQL (requires sqlfluff: pip install sqlfluff)
sqlfluff lint infrastructure/supabase/migrations --dialect postgres

# Diff local schema against the linked remote (requires DB password)
supabase db diff --linked

# Push pending local migrations to the linked development database
supabase db push
```

Credentials come from the repo `.env` (gitignored): `SUPABASE_ACCESS_TOKEN`
and `SUPABASE_DB_PASSWORD`. The project must be linked first:
`supabase link --project-ref <ref>`.

### Rules

- Prefer forward migrations; do not edit applied migrations.
- Use explicit constraints and indexes for integrity/performance.
- Keep the model compatible with the API's business-scoped authorization.
- Applying to production is destructive and requires explicit user instruction.
