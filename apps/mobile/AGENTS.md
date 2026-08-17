# Mobile — Codex Instructions

Applies to `apps/mobile/**`.

## Architecture

- Plain React Native + TypeScript.
- Native `ios/` and `android/` projects are first-class.
- Mobile calls the NestJS API for application workflows.
- Do not duplicate authoritative backend workflow logic.
- Share platform-neutral domain/types/validation/calculation packages where appropriate.
- Do not import Web-only DOM/Next.js code into React Native.

## UX

Follow mobile rules in:
- `docs/handoff/01_PRODUCT_REQUIREMENTS.md`
- `docs/handoff/06_RESPONSIVE_ACCESSIBILITY.md`

Prefer:
- mobile item cards instead of dense invoice tables
- full-screen selectors/sheets where appropriate
- touch targets >= 44px
- sticky primary action where specified

Full advanced Theme Builder editing does not need to be forced onto a phone.

## Native changes

When changing native projects:
- modify only what the feature requires;
- keep iOS/Android behavior aligned where possible;
- do not regenerate native projects unnecessarily.

## Tests

Run the narrowest available equivalents of:

```bash
pnpm --filter mobile lint
pnpm --filter mobile typecheck
pnpm --filter mobile test
```

Run native builds only when the ticket affects native configuration or integration.
