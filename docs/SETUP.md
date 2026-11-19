# Setup

There are two levels. The first takes two minutes and shows everything except live research. The second turns on the research agent.

## 1. Run the app

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

- **My unit:** enter `4821` (card ready, unit moved). Other demo cards: `1234`, `5555`, `2027`.
- **Count:** opens on Rivers State, 2023. Tap Obio/Akpor or Oyigbo.
- **Ask:** tap a suggested question. It replays a note recorded from an earlier real research run.
- **Text Tally** (`/simulator`): the WhatsApp and SMS channel. Try `READY 4821`, `UNIT`, `REPORT ARRIVED`, `LANG PIDGIN`.

No accounts or keys are needed. Data is kept in memory and resets when the server restarts.

Check it:

```bash
npm test
npm run typecheck
```

## 2. Turn on live research

Live research runs an agent on your machine. It needs two things installed and logged in.

### a. Claude Code

Install Claude Code and sign in: https://claude.com/claude-code

```bash
claude --version
claude -p "say OK"
```

The second command must print a reply without opening a login page.

### b. Agent Reach

Agent Reach gives the agent its search and reading tools. Install it by following its guide: https://github.com/Panniantong/Agent-Reach

Then check which channels work on your machine:

```bash
agent-reach doctor
```

Tally uses these. Web search and page reading are enough to start; the rest add social media.

| Channel | Command the agent runs | Needs |
|---|---|---|
| Web search | `mcporter call exa.web_search_exa` | Nothing |
| Page reading | `curl -s https://r.jina.ai/<url>` | Nothing |
| X | `twitter search` | Your X session saved with `agent-reach configure twitter-cookies` |
| Reddit, Facebook, Instagram | `opencli <platform> search` | The OpenCLI browser extension, in a Chrome profile that is signed in to those sites, with Chrome running |

If a channel is missing the agent moves on to the others.

### c. Start Tally with live research on

```bash
# macOS / Linux
TALLY_RESEARCH=live npm run dev

# Windows PowerShell
$env:TALLY_RESEARCH = "live"; npm run dev
```

Now the Ask tab researches any question you type. A run takes one to four minutes. If a run fails, Tally falls back to a recorded note when one matches.

Optional settings:

| Variable | Default | What it does |
|---|---|---|
| `TALLY_RESEARCH` | off | `live` turns on the research agent |
| `TALLY_RESEARCH_MODEL` | `sonnet` | Model the agent uses |
| `TALLY_CLAUDE_BIN` | `claude` | Path to the Claude Code program, if it is not on your PATH |

### d. Record a note

A recorded note is what the hosted demo shows. To add one:

```bash
npx tsx scripts/record-note.ts "Is it true that ...?"
npx tsx scripts/record-note.ts --about 32/21 --langs pcm,ha,yo,ig
npx tsx scripts/record-note.ts --translate mismatch-32-15.en --langs pcm,yo
```

Notes are saved to `data/notes/recorded.json`. Commit that file to publish them.

### What the agent is allowed to do

The agent can only run the search and reading commands in the table above, plus built-in web search and fetch. It cannot read, write or edit files, and it starts in an empty temporary folder. The list is in [`lib/notes/localAgent.ts`](../lib/notes/localAgent.ts).

## 3. Optional: database, WhatsApp and SMS

See [TECHNICAL.md](TECHNICAL.md) for Neon Postgres, Twilio and deployment.
