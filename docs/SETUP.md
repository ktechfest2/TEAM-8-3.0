# Setup

There are two levels. The first takes two minutes and shows everything except live research. The second turns on the research agent.

## 1. Run the app

Needs Node 20 or newer.

```bash
npm run demo
```

`npm run demo` installs what is missing, starts Tallie, prints what is connected, and opens http://localhost:3000/status, which shows the same thing: the data, the sealed log, Claude Code, and each place the research agent reads. When Claude Code is found it turns live research on (`TALLY_RESEARCH=live`) for you. Use `npm run demo -- --no-open` to keep the browser closed, or `PORT=4000 npm run demo` for another port. `npm run dev` still starts the app on its own, with live research off.

Open http://localhost:3000.

**The landing page** (`/`) plays three walkthroughs by themselves, with captions. They are scripted; the figures and notes in them are read from the same data the app uses.

**The app** is at http://localhost:3000/unit. It has three tabs:

- **Election:** tap **Use a demo card**, then **Check** (card valid, polling unit moved). Any 19-character voter identification number works in the demo; its last four digits pick the answer, so numbers ending `1234`, `5555` and `2027` show other cases.
- **Results:** opens on Rivers State, 2023. Open Obio/Akpor or Oyigbo under "2 do not add up", then **See what was reported about this**.
- **Rumours:** tap a suggested question. It replays a note recorded from an earlier real research run. Switch language at the top.

**Run it yourself** (`/setup`) is this guide as a page.

The text channel is not live; `/simulator` runs the same code in the browser. Try `READY 4821`, `UNIT`, `REPORT ARRIVED`, `LANG PIDGIN`.

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

Tallie uses these. Web search and page reading are enough to start; the rest add social media.

| Channel | Command the agent runs | Needs |
|---|---|---|
| Web search | `mcporter call exa.web_search_exa` | Nothing |
| Page reading | `curl -s https://r.jina.ai/<url>` | Nothing |
| X | `twitter search` | Your X session saved with `agent-reach configure twitter-cookies` |
| Reddit, Facebook, Instagram | `opencli <platform> search` | The OpenCLI browser extension, in a Chrome profile that is signed in to those sites, with Chrome running |

If a channel is missing the agent moves on to the others.

### c. Start Tallie with live research on

```bash
npm run demo
```

The page that opens should say **Live research is on**. To turn it on by hand instead:

```bash
# macOS / Linux
TALLY_RESEARCH=live npm run dev

# Windows PowerShell
$env:TALLY_RESEARCH = "live"; npm run dev
```

Now the Rumours tab researches any question you type. A run takes one to four minutes. If a run fails, Tallie falls back to a recorded note when one matches.

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
