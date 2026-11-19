# Tally: technical notes

The short version is in the [README](../README.md). This page has the detail.

Hackathon prototype for **Every Vote, Every Voice**. Tally is a WhatsApp and SMS companion that walks a first-time
voter through election day:

1. **Am I ready?** Is my card ready, and did my polling unit move?
2. **Live at my unit.** Count-based reports from other voters: officials arrived, accreditation started, long queue.
3. **Check the wall.** Send the figures from the result sheet; Tally checks the arithmetic and compares them with the
   published result.
4. **Journalist view.** The same reports, filterable by state and polling unit, with counts, photo flags, timestamps
   and CSV export.

One Next.js app (App Router, TypeScript, Tailwind), API logic in Route Handlers, Neon Postgres, deploys to Vercel.

## What is real and what is mocked

**No access to INEC data was assumed.** We have not confirmed that INEC offers a public lookup for PVC status or
polling-unit changes, or machine-readable access to IReV. Every data source we cannot actually reach sits behind an
adapter interface ([lib/providers/types.ts](../lib/providers/types.ts)) with a mock implementation driven by seed JSON.

| Part | Status |
| --- | --- |
| Command parser, replies (English, Pidgin) | Real |
| Result validation: party votes + rejected ≤ accredited ≤ registered | Real ([lib/rules/validate.ts](../lib/rules/validate.ts)) |
| One vote per sender per signal per unit; "unverified" for a single reporter | Real (DB unique constraint + [lib/rules/signals.ts](../lib/rules/signals.ts)) |
| Consensus (2+ identical submissions) and "matches" / "unmatched, needs review" | Real ([lib/rules/consensus.ts](../lib/rules/consensus.ts), [compare.ts](../lib/rules/compare.ts)) |
| Hash-chained, append-only log and `/verify` | Real ([lib/chain](../lib/chain), [migration](../db/migrations/0001_init.sql)) |
| Card readiness and polling-unit lookup (`VoterLookupProvider`) | **Mock**: [data/seed/voters.json](../data/seed/voters.json). Uses the last 4 digits of the card, which a real lookup could never rely on. Any other 4 digits get a made-up but stable answer. |
| Published results (`IRevProvider`) | **Mock**: [data/seed/irev_results.json](../data/seed/irev_results.json) |
| Other voters' reports | **Mock**: [data/seed/demo_reports.json](../data/seed/demo_reports.json), sent through the same code as live messages |
| WhatsApp and SMS delivery (`MessagingProvider`) | **Console / in-app by default.** Optional Twilio implementation behind `MESSAGING_PROVIDER=twilio`. |
| Polling units, places, "Party A to D" | **Fictional** |
| Hausa, Yorùbá, Igbo replies | **Stubs** that fall back to English and say so. Flagged "needs native review" in [lib/i18n/messages.ts](../lib/i18n/messages.ts). The Pidgin copy should also be reviewed by a native speaker. |
| Photos | Only a "photo attached" flag is recorded. Images are never downloaded, stored or shown, because face and voter-detail blurring is not built. |

The UI labels mocked data on every page that shows it.

## Quick start (no accounts needed)

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and go to **/simulator**. Without `DATABASE_URL` the app uses an in-memory store,
seeded with the demo data on start, and resets when the server restarts.

Demo script: `READY 4821` (card ready, unit moved) → `UNIT` (live counts) → `REPORT ARRIVED` →
`RESULT A112 B98 C41 D7 REJ6 ACC264` (matches) → press **New voter** and send the same `RESULT` to see two voters
agree → try `RESULT A90 B102 C30 D5 REJ4 ACC249 LA05-012` to see "unmatched, needs review" → open **/newsroom**
and **/verify**.

## Commands

The same parser serves WhatsApp, SMS and the simulator ([lib/commands/parse.ts](../lib/commands/parse.ts)).
Commands are case-insensitive, and any command can carry a unit code such as `LA03-007`.

| Command | What it does |
| --- | --- |
| `READY 4821` | Card readiness and whether the unit moved (last 4 digits of the card). Remembers the unit, not the digits. |
| `UNIT` / `UNIT LA03-007` | Live report counts and the result status for your unit |
| `REPORT ARRIVED` / `REPORT ACCRED` / `REPORT QUEUE` | Add your report. One per voter per signal per unit. |
| `RESULT A112 B98 C41 D7 REJ6 ACC264` | Check and log the wall figures (`A 112`, `a=112` and any order also work) |
| `LANG PIDGIN` / `LANG EN` / `LANG HAUSA` / `LANG YORUBA` / `LANG IGBO` | Change language |
| `HELP` | List commands |

## Set up Neon

1. Create a Neon project (free tier is fine) and copy its connection string from **Connection details**.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `PHONE_HASH_SALT`.
3. `npm run db:migrate` applies [db/migrations](../db/migrations) in order and records them in `schema_migrations`.
   (You can also paste the SQL into the Neon SQL editor.)
4. `npm run seed` adds the fictional polling units and the mock demo reports. It is safe to re-run.
5. `npm run dev`.

The app talks to Neon over its HTTP driver ([lib/db/neon.ts](../lib/db/neon.ts)): one statement per request, no
connection pool to manage, which suits Vercel functions. Only the server holds `DATABASE_URL`; there is no public
API in front of the database. The migration script uses Neon's WebSocket pool because it runs multi-statement SQL
in a transaction.

On the free tier Neon suspends an idle database, so the first request after a quiet spell is slower. Send a
message or two before a live demo.

To reset the demo data, run this in the Neon SQL editor (the log refuses row deletes, by design):

```sql
truncate result_submissions, signals, senders restart identity;
```

## How the tamper-evident log works

Every valid result submission is appended to one chain. Each entry stores `prev_hash` and
`hash = SHA-256(prev_hash + canonical JSON of {unitCode, senderHash, figures, hasPhoto, createdAt})`, where canonical
JSON has sorted keys and no whitespace ([lib/chain](../lib/chain)).

- **No forks under concurrent writes.** The app reads the head, computes the hash and calls the Postgres function
  `append_result_submission`, which runs in one transaction under an advisory lock and refuses if the head has
  moved. The app then re-reads the head and retries. A unique index on `prev_hash` is a second guard: no entry can
  have two successors.
- **Append-only.** A trigger blocks `UPDATE` and `DELETE` on `result_submissions`.
- **Checkable.** `/verify` (and `/api/verify`) recomputes the chain from genesis and reports the first break.

Live signals (arrived, accreditation, queue) are protected by the one-vote-per-sender constraint but are not in the
hash chain. Adding them is a straightforward extension.

## Privacy

- Phone numbers are never stored or logged. Senders are identified by a salted SHA-256 of the number
  ([lib/senders.ts](../lib/senders.ts)); WhatsApp and SMS from the same number hash the same.
- Card digits are used only for the lookup and never stored.
- Simulator senders must look like `sim:<id>`, so the open demo endpoint cannot pose as a real phone number.

## Twilio (optional)

1. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `PUBLIC_BASE_URL` (the URL Twilio calls).
2. Point the WhatsApp sandbox "when a message comes in" webhook to `https://<your-app>/api/whatsapp`, and an SMS
   number's webhook to `https://<your-app>/api/sms` (both HTTP POST).
3. Every webhook must carry a valid `X-Twilio-Signature`; unsigned or wrongly signed requests get 403.
4. By default the reply goes back inline as TwiML. With `MESSAGING_PROVIDER=twilio` (plus `TWILIO_WHATSAPP_FROM` and
   `TWILIO_SMS_FROM`) replies are sent through the REST API instead.

## Tests

```bash
npm test          # Vitest: rules, parser, hash chain, handler, concurrency, Twilio signature,
                  # and the real migration + Postgres store on PGlite (embedded Postgres)
npm run typecheck
```

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset: Next.js, no build settings to change).
2. Add Neon from the Vercel Marketplace (Storage tab), which creates the database and sets `DATABASE_URL`, or set
   `DATABASE_URL` yourself. Add the other variables from `.env.example`. **Use Neon for any shared deployment.**
   The in-memory store is per server instance, so on Vercel different requests can see different data.
3. Run `npm run db:migrate` and `npm run seed` against that database from your machine, with `.env.local`
   pointing at it.
4. Deploy. Check `/verify` shows "Chain intact" and `/simulator` replies.
5. For a public demo, consider `SIMULATOR_ENABLED=false` once Twilio is set up, since the simulator endpoint has no
   rate limiting.

## Project layout

```
app/                    pages (/, /simulator, /newsroom, /verify) and Route Handlers under app/api
components/             Simulator chat, theme toggle
lib/rules/              pure validation, consensus, comparison and summary rules (unit tested)
lib/chain/              canonical JSON, SHA-256 chain, verification, append-with-retry
lib/commands/           shared command parser and message handler
lib/providers/          VoterLookup, IRev and Messaging interfaces, mock and Twilio implementations
lib/store/              Postgres (Neon) store and in-memory store behind one interface
lib/db/                 Neon HTTP driver connection
lib/i18n/               English, Pidgin, and flagged Hausa/Yorùbá/Igbo stubs
data/seed/              mock JSON: polling units, cards, published results, demo reports
db/migrations/          SQL migrations
scripts/migrate.ts      applies migrations to DATABASE_URL
scripts/seed.ts         seeds the database
design/tally.html       the landing page/demo used as the design and copy reference
tests/                  Vitest
```

## Known limits

- No rate limiting or abuse controls beyond one vote per sender per signal.
- The mock readiness lookup uses only 4 digits; a real one needs INEC's cooperation and much stronger identification.
- Deterministic rules only: no ML, no OCR. Photos are flagged, not read.
- Times are shown in West Africa Time (Africa/Lagos).

## AI assistance

AI coding assistants were used to build this project, as the hackathon rules require us to state: Claude (Anthropic)
helped write the code, tests and documentation. The team is responsible for reviewing what it produced.
