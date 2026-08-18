# InvoiceFlow shared packages

These private workspace packages contain platform-neutral contracts and logic.
They must not import Next.js, React Native, NestJS, or infrastructure-specific
runtime APIs.

- `domain`: domain models and rules
- `calculations`: deterministic financial calculations
- `validation`: shared validation contracts
- `types`: cross-platform transport and utility types
- `api-client`: typed client boundary for Web and Mobile
- `document-schema`: shared document contracts
- `theme-schema`: document-theme contracts
- `design-tokens`: shared visual tokens consumed by platform themes
- `utils`: generic platform-neutral utilities

Package entry points other than `design-tokens` are intentionally empty until
their owning implementation tickets define real contracts.
