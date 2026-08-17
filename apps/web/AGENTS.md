# Web — Codex Instructions

Applies to `apps/web/**`.

## Architecture

- Next.js + React + TypeScript.
- Web calls the NestJS API for application workflows.
- Do not move authoritative invoice/quote/payment/theme workflow logic into React components or Next.js UI handlers.
- Reuse shared validation/types/calculation helpers where intended, but backend remains authoritative.

## UI

Follow:
- `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`
- `docs/handoff/design-tokens.json`

Requirements:
- desktop-first where the workflow is dense, while remaining responsive
- accessible labels and focus
- no unnecessary visual noise
- document flows follow Create → Review → Send
- use shared component primitives rather than one-off duplicates

## Tests

For affected Web work, run the narrowest available equivalents of:

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
```

Run build only when the ticket or change surface justifies it.
