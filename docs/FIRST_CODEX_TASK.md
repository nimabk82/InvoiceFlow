# First Codex Task — Environment Bootstrap

Use this as the first prompt in a fresh Codex thread:

```text
Prepare this repository for InvoiceFlow implementation.

Follow AGENTS.md.
Read docs/CODEX_INDEX.md and docs/IMPLEMENTATION_STATUS.md.

Do not implement product features yet.

Verify only:
- repository/Git state and remotes
- GitHub CLI authentication
- Node and pnpm versions
- React Native iOS prerequisites
- React Native Android prerequisites
- NestJS prerequisites
- Supabase CLI authentication
- current Supabase project linkage
- whether the linked Supabase target is development/staging/production

Make any non-destructive repository setup changes needed for Codex operation.

Update docs/IMPLEMENTATION_STATUS.md with the verified environment state and blockers.

Do not ask me questions unless a required credential is genuinely missing or the Supabase target cannot be safely classified.
```
