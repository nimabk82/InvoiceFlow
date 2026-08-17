# Shared Packages — Codex Instructions

Applies to `packages/**`.

Keep shared packages platform-neutral unless the package explicitly documents a platform target.

Good shared concerns:
- domain types
- financial calculations
- validation
- document/theme schemas
- API contracts/client
- design tokens
- generic utilities

Do not import:
- Next.js runtime APIs
- React Native native modules
- NestJS framework classes

into a platform-neutral package.

Financial logic must be deterministic and covered by focused unit tests.
