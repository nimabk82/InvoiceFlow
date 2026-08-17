# One-Time Access Setup Checklist

Do these once before routine Codex implementation.

Do not put credentials in AGENTS.md or commit them.

## 1. Trust this repository in Codex

Project `.codex/config.toml` and `.codex/rules/` are loaded only for a trusted project.

After changing `.codex/config.toml` or `.codex/rules/`, restart/reopen Codex so the active configuration is refreshed.

## 2. Git / GitHub

Verify outside or before the first implementation task:

```bash
git status
git remote -v
gh auth status
```

Use your normal Git credential helper / GitHub CLI authentication.

Do not store GitHub tokens in repository files.

## 3. Supabase

Authenticate the Supabase CLI using your normal secure workflow.

Verify:

```bash
supabase --version
supabase status
```

If the repository is linked to a remote Supabase project, explicitly determine whether it is:
- development
- staging
- production

Record that classification in `docs/IMPLEMENTATION_STATUS.md`.

Do not place service-role keys or database passwords in committed files.

## 4. Environment files

Commit templates only:

```text
.env.example
apps/web/.env.example
apps/mobile/.env.example
apps/api/.env.example
```

Actual secret-bearing `.env*` files remain ignored.

## 5. Expected approval behavior

The project uses:
- `workspace-write`
- `on-request`
- auto-review
- network access
- project command rules

Routine workspace edits should not require approval.
Normal Git commands in `.codex/rules/default.rules` are pre-authorized.
Safe/local Supabase commands are pre-authorized.
Remote `supabase db push` intentionally remains reviewable because the rule engine cannot prove the linked target is development.
