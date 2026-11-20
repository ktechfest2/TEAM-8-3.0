# Tallie: technical notes

The short version is in the [README](../README.md). Words in **bold** below are defined in the [glossary](../GLOSSARY.md).

One Next.js app (App Router, TypeScript, Tailwind). Server logic lives in `lib/`; pages and Route Handlers in `app/` are thin.

## What is real and what is simulated

| Part | Status |
| --- | --- |
| **Published results** per polling unit, Rivers State 2023 | **Real.** Read from result sheets on INEC's portal by CCIJ. [Source and caveats](../data/rivers-2023/SOURCE.md) |
| **Announced results** per local government, Rivers State 2023 | **Real.** Released by INEC under a freedom-of-information request, via CCIJ |
| Polling units, wards, local governments | **Real** names and codes, from the same dataset |
| **Count trail**, **portal sums**, **coverage**, **mismatch** rules | Real ([lib/count/trail.ts](../lib/count/trail.ts)) |
| **Notes** from live research | Real when run locally ([lib/notes](../lib/notes)); the hosted site replays **recorded notes** |
| **Log** sealing the published results | Real ([lib/log](../lib/log)) |
| **Readiness check** (`VoterLookupProvider`) | **Simulated**: [data/seed/voters.json](../data/seed/voters.json). The app takes the 19-character voter identification number, uses it for the one lookup and never stores it. The simulated lookup reads only its last 4 digits |
| **Live reports** from other voters | **Simulated** seed data, sent through the same code as real ones |
| WhatsApp and SMS delivery | Not live. An in-app simulator runs the same code; Twilio webhooks exist but are not connected |
| USSD | Designed, not built |
| Voice in the browser | In progress |
| Hausa, Yorùbá, Igbo chat replies | Fall back to English. Notes in those languages are machine-translated and not reviewed by native speakers |

## Modules

| Module | Interface | What sits behind it |
| --- | --- | --- |
| `lib/count` | `buildCountTrail(input)`, `findArea`, `unitsIn` | Sums by ward, local government and state; coverage; the two tests for an unexplained mismatch; reading-noise allowance. Pure |
| `lib/count/explain.ts` | `explainComparison`, `headlineComparison`, `unexplainedAreas` | Plain-language wording for a comparison |
| `lib/notes` | `ask(request)` | Chooses live or recorded research, falls back when a live run fails. Two adapters behind the `Researcher` seam: `LocalAgentResearcher` and `RecordedResearcher` |
| `lib/myUnit.ts` | `voterFrom`, `checkReadiness`, `sendLiveReport` | The voter and their polling unit. Used by both the chat handler and the app |
| `lib/log` | `sealLog(units)`, `verifyLog(units, seal)` | Hash chain over the published results, with a checkpoint per local government |
| `lib/commands` | `handleMessage(deps, inbound)` | Parser and replies for the text channel |
| `lib/store` | `Store` | Two adapters: in-memory and Postgres |

## The count trail

For each area Tallie computes a **portal sum** per party from the polling units whose sheet could be read, and the **coverage**: units read, units that exist, and the registered voters in the units not read.

Where an **announced result** exists (local governments, and the state when every local government has one), each party gets one of three findings:

- **Unexplained**, if the portal sum is above the announced figure by more than reading noise. Unread units can only add votes.
- **Unexplained**, if the announced figure is above the portal sum by more than the registered voters in the unread units, plus reading noise.
- **Consistent**, if the two are within reading noise.
- **Open** otherwise: they differ, but the unread units could account for it.

Reading noise is `max(100, 10% of the announced figure, one vote per four sheets read)`. It is deliberately generous, because the figures were machine-read from photographs.

Wards have no announced result, so they have a portal sum and nothing to compare it with.

## The landing page

`/` tells the story in order: what Tallie found on the real election, the three moments a voter is left guessing, what's next, and how to run it. Copy lives in `app/(landing)/content.ts`.

The three moments are walkthroughs in `components/landing/Reel.tsx`. Each plays by itself like a screen recording, with a caption for every step, and can be paused or stepped through. They are scripted and fetch nothing while playing, but they invent nothing either: `reelData()` in `app/(landing)/page.tsx` reads every figure from `currentTrail()` and every note from the recorded notes.

## The app

`/unit`, `/count` and `/ask` are the working product, laid out as a phone with four tabs: Election, Results, Rumours, More. On a wide screen the phone sits beside a panel that says how the tab on screen works (`components/app/Context.tsx`).

- **Results** groups the local governments by finding: do not add up, add up, too few sheets to tell. A local government's page shows each party's portal sum beside the announced result, and for an unexplained mismatch a button to the research note.
- **Run it yourself** (`/setup`) is the setup guide as a page, with commands to copy.
- **Connections** (`/status`, and `/api/status` as JSON) says what is connected on this machine: the data, the sealed log, Claude Code, and each program the research agent reads through. It only checks what is loaded and what is on the PATH (`lib/status.ts`); it runs no research and reads no credential.
- `npm run demo` (`scripts/demo.mjs`) installs packages if needed, turns live research on when Claude Code is found, starts the app, prints the same checks and opens `/status`.

## Notes and the research agent

`ask()` takes a question, a language, and optionally the area a mismatch is in.

- With `TALLY_RESEARCH=live`, `LocalAgentResearcher` starts Claude Code headless (`claude -p`) in an empty temporary folder, with an allow-list of read-only search commands and a deny-list covering every file tool. The prompt is in [lib/notes/prompt.ts](../lib/notes/prompt.ts). The reply is parsed by `parseResearch`, which drops malformed sources and refuses to grade a note above "nothing found" if it has no sources.
- Otherwise `RecordedResearcher` looks for a recorded note: by area for a mismatch, by word overlap for a rumour, preferring the voter's language and falling back to English.

Setup is in [SETUP.md](SETUP.md). The reason for the split is in [ADR 0003](adr/0003-research-runs-locally-hosted-site-shows-recorded-notes.md).

## The log

`sealLog` chains every polling unit's published result: `hash = SHA-256(previous hash + canonical JSON of { unitCode, sheet, figures, registered, accredited })`. It records the head and one checkpoint per local government in `data/rivers-2023/seal.json`.

`/verify` and `/api/verify` recompute the chain from the data and compare. Changing, removing or reordering any polling unit breaks its local government's checkpoint and every later one.

Reseal after changing the data: `npx tsx scripts/seal-log.ts`.

## The text channel

One parser serves WhatsApp, SMS and the simulator. Commands are case-insensitive and can carry a unit code.

| Command | What it does |
| --- | --- |
| `READY 4821` | Readiness check. Remembers the polling unit, not the digits |
| `UNIT` / `UNIT 32/15/04/012` | Live report counts for a polling unit |
| `REPORT ARRIVED` / `REPORT ACCRED` / `REPORT QUEUE` | Add a live report. One per voter per kind per unit |
| `LANG PIDGIN` / `EN` / `HAUSA` / `YORUBA` / `IGBO` | Change language |
| `HELP` | List commands |

## Privacy

- Phone numbers are never stored or logged. A voter is a salted SHA-256 of the number ([lib/senders.ts](../lib/senders.ts)).
- The voter identification number is used for the lookup and never stored or logged.
- The app identifies a voter by a random id it keeps on the phone, namespaced so it cannot collide with a phone number.
- The research agent cannot read local files, and its X session is passed to the child process only.

## Database (optional)

Without `DATABASE_URL` the app uses a seeded in-memory store. For a shared deployment use Neon Postgres:

1. Copy `.env.example` to `.env.local`; set `DATABASE_URL` and `PHONE_HASH_SALT`.
2. `npm run db:migrate`, then `npm run seed`.

Only voters and live reports are stored. The count trail and notes are read from files in `data/`.

## Twilio (optional)

1. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `PUBLIC_BASE_URL`.
2. Point the WhatsApp sandbox webhook at `/api/whatsapp` and an SMS number's webhook at `/api/sms`.
3. Every webhook must carry a valid `X-Twilio-Signature`.

## Tests

```bash
npm test          # count trail (fixtures and real data), notes, log, parser, handler, store on embedded Postgres
npm run typecheck
```

## Deploy

Import the repository in Vercel (preset: Next.js). No environment variables are required for the demo. Leave `TALLY_RESEARCH` unset: the hosted site serves recorded notes. Add Neon and the variables in `.env.example` if live reports must be shared between visitors.

## Layout

```
app/(landing)/    the landing page
app/(app)/        the phone app: Election (home), Results, Rumours, More
app/(site)/       text-channel simulator, Verify, setup guide
app/api/          ask, app/unit, whatsapp, sms, verify
components/app/   app screens' client components
components/landing/ the landing page's walkthroughs (Reel.tsx)
lib/count/        count trail and its wording
lib/notes/        notes, the research agent, recorded notes
lib/log/          the sealed log
lib/commands/     text-channel parser and handler
lib/store/        in-memory and Postgres stores
data/rivers-2023/ real published and announced results, the seal, and their source
data/notes/       recorded notes
data/seed/        simulated cards and live reports
docs/adr/         decisions
scripts/          build-rivers, seal-log, record-note, migrate, seed
```

## Known limits

- One state, one election, four parties.
- No rate limiting on the open endpoints.
- A live research run takes minutes and is not streamed.
- Times are shown in West Africa Time.
