# Final Stack Decision

- Web: Next.js + React + TypeScript
- Mobile: Plain React Native + TypeScript
- Backend: Node.js + NestJS + Fastify
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Monorepo: pnpm workspaces + Turborepo

Architecture boundary:

Web and Mobile call the NestJS API for application workflows.

NestJS accesses databases/providers through interfaces.

Supabase is the first infrastructure implementation and must remain replaceable.
