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

```bash
# Lint migration SQL (requires sqlfluff: pip install sqlfluff)
sqlfluff lint infrastructure/supabase/migrations --dialect postgres

# Diff local schema against the linked remote (requires DB password)
supabase db diff --workdir infrastructure/supabase --linked

# Push pending local migrations to the linked development database
supabase db push --workdir infrastructure/supabase
```

Run `supabase` commands with `--workdir infrastructure/supabase` so the CLI
picks up this directory's `config.toml`.

### Rules

- Prefer forward migrations; do not edit applied migrations.
- Use explicit constraints and indexes for integrity/performance.
- Keep the model compatible with the API's business-scoped authorization.
- Applying to production is destructive and requires explicit user instruction.
