# InvoiceFlow — Codex Bootstrap Overlay

Copy the contents of this folder into the InvoiceFlow repository root.

It is designed to:

- minimize repeated prompt/context tokens;
- minimize approval interruptions for routine repository work;
- let Codex use Git normally without repeated approval;
- let Codex use Supabase development tooling without repeatedly asking for access;
- keep destructive Git/database operations bounded;
- keep each implementation thread ticket-scoped.

## Files

```text
AGENTS.md
.codex/
├── config.toml
└── rules/
    └── default.rules

apps/
├── api/AGENTS.md
├── web/AGENTS.md
└── mobile/AGENTS.md

packages/AGENTS.md
infrastructure/supabase/AGENTS.md

docs/
├── CODEX_INDEX.md
├── IMPLEMENTATION_STATUS.md
├── FIRST_CODEX_TASK.md
├── TASK_PROMPTS.md
├── ACCESS_SETUP.md
└── handoff/
    └── full InvoiceFlow developer handoff
```

## Start

1. Copy this overlay to your repository.
2. Trust the project in Codex.
3. Complete `docs/ACCESS_SETUP.md`.
4. Start a fresh Codex thread with the prompt in `docs/FIRST_CODEX_TASK.md`.
5. After environment verification, start one fresh thread per ticket using `docs/TASK_PROMPTS.md`.

## Token strategy

Codex should read:
- root/nested AGENTS automatically;
- `IMPLEMENTATION_STATUS.md`;
- the target ticket;
- only the handoff docs mapped by `CODEX_INDEX.md`.

It should not reread the full handoff for every task.
