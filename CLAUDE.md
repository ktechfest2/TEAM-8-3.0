# Tally

A WhatsApp and SMS companion that walks a first-time voter through election day. Hackathon prototype for "Every Vote, Every Voice". One Next.js app (App Router, TypeScript, Tailwind); details in `docs/TECHNICAL.md`.

## Commands

- `npm run dev`: run locally. With no `DATABASE_URL` it uses a seeded in-memory store, so no accounts are needed.
- `npm test`: Vitest. Takes about 35 seconds because one suite runs the real migration on embedded Postgres.
- `npm run typecheck`

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on the team repo, `ktechfest2/TEAM-8-3.0`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the repo root and decisions in `docs/adr/`. See `docs/agents/domain.md`.
