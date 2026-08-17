# InvoiceFlow — Short Codex Prompts

Once the repository is bootstrapped, use a new/fresh thread for each ticket or tightly-coupled ticket group.

## Normal implementation ticket

```text
Implement PLATFORM-01 from docs/handoff/08_DEVELOPMENT_TICKETS.md.

Follow AGENTS.md and docs/CODEX_INDEX.md.
Complete the ticket, run relevant checks, commit it, and update docs/IMPLEMENTATION_STATUS.md.
```

Replace `PLATFORM-01` with the target ticket.

## Focused bug

```text
Fix <brief bug description>.

Follow AGENTS.md.
Inspect only the affected flow and relevant docs from CODEX_INDEX.md.
Add/update a regression test where practical.
Run relevant checks and commit the fix.
```

## UI ticket

```text
Implement INV-10.

Follow AGENTS.md and CODEX_INDEX.md.
Match the handoff requirements exactly.
Check desktop, tablet, and mobile behavior relevant to this screen.
Test and commit.
```

## API ticket

```text
Implement API-05.

Follow AGENTS.md and apps/api/AGENTS.md.
Keep controllers thin and persistence behind repository interfaces.
Test and commit.
```

## Database ticket

```text
Implement DB-02.

Follow AGENTS.md and infrastructure/supabase/AGENTS.md.
Use a forward migration.
Validate locally/dev only.
Update repository mappings/tests and commit.
```

## Review after a ticket

Start a separate thread only when review is valuable:

```text
Review the changes for <ticket/commit> against its acceptance criteria.

Do not reimplement the feature unless you find a concrete issue.
Report only correctness, architecture, security, regression, or missing-test problems.
```

## Avoid prompts like

Do not repeatedly send:

```text
Read the entire repository and all handoff documents...
```

Do not paste the architecture into every ticket prompt.

Do not keep unrelated tickets in one long conversation.
