# Tallie

An election companion for Nigerian voters, from their polling unit to the final result: where do I vote and has it opened, is the result on the wall the one that was announced, and is this thing I heard true. It runs in the browser as a phone-style app (`/unit`, `/count`, `/ask`) with a landing page (`/`) whose walkthroughs are scripted in `components/landing/Reel.tsx`; WhatsApp, SMS and USSD are designed but not live. Hackathon prototype for "Every Vote, Every Voice". One Next.js app (App Router, TypeScript, Tailwind); details in `docs/TECHNICAL.md`.

## Commands

- `npm run demo`: start the app, check what is connected, and open `/status`. Turns live research on when Claude Code is found.
- `npm run dev`: run locally. With no `DATABASE_URL` it uses a seeded in-memory store, so no accounts are needed.
- `npm test`: Vitest. Takes about 35 seconds because one suite runs the real migration on embedded Postgres.
- `npm run typecheck`

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on the team repo, `ktechfest2/TEAM-8-3.0`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the repo root and decisions in `docs/adr/`. See `docs/agents/domain.md`.
