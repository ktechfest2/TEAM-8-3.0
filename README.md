# Tallie

**An election companion, from your polling unit to the final result.** Tallie answers a Nigerian voter at the three moments they are left guessing, in their own language:

| | The voter asks | Tallie answers from |
|---|---|---|
| **Election morning** | Where do I vote, and has my polling unit opened? | A check on the card and polling unit, and counts of what voters at that unit report |
| **After the results** | Is the result on the wall the one that was announced? | The result sheets INEC published, added up and set beside what was announced |
| **When a rumour spreads** | I heard something about the election. Is it true? | Public reporting, researched by an agent and returned as a sourced note |

Today Tallie works in the browser, and voice in the browser is being added. WhatsApp, SMS and USSD are part of the design, so that it reaches a basic phone with no data, but they are not live: the text channel runs in an in-app simulator.

Built for the *Every Vote, Every Voice* hackathon (KTech Fest 3.0).

## The weak link we chose

A Nigerian election is counted in public at the polling unit, then added up on paper at ward, local-government and state collation centres. Where independent checks have caught altered results, the figures changed **after** the polling-unit count, during collation. INEC publishes a photo of every polling-unit result sheet, but not the collation forms, and has said it will not for 2027.

So Tallie does the addition in the open. It sums the published polling-unit results for each area and shows that sum beside the announced figure. Where they differ by more than the missing sheets could explain, it says so, and an agent researches what has been reported about it.

Read more: [problem brief](docs/PROBLEM-BRIEF.md) · [system sketch](docs/SYSTEM-SKETCH.md) · [write-up](docs/WRITE-UP.md)

## It runs on real data

The count in this prototype is not invented. It is the **2023 presidential election in Rivers State**: 6,866 polling units, with figures read from the result sheets on INEC's portal by [CCIJ](https://github.com/anndawn/Nigeria-2023-election), and the local-government figures INEC released under a freedom-of-information request.

On that data Tallie flags two local governments, the same two the BBC reported on in 2023:

| Local government | Party | Result sheets add up to | Announced |
|---|---|---|---|
| Obio/Akpor | LP | 68,521 | 3,829 |
| Oyigbo | LP | 17,875 | 10,784 |

In both, a *partial* sum of sheets is already above the announced figure. Sheets still missing could only add votes, so they cannot explain it. The other 21 local governments are not flagged.

Card lookups and live reports from polling units are simulated. [What is real and what is not](docs/TECHNICAL.md#what-is-real-and-what-is-simulated).

## Run it

```bash
npm run demo
```

That one command installs what is missing, starts Tallie, and opens a page showing whether everything is connected: the data, the sealed log, Claude Code, and each place the research agent reads. If Claude Code is installed it turns live research on. `npm run dev` still starts the app on its own.

No accounts needed. Once it is running:

- **The landing page** (`/`) plays three walkthroughs, one for each question above. They are scripted, but every figure and note in them is read from the same data the app uses.
- **The app** (`/unit`, `/count`, `/ask`) is the working product, laid out as a phone. On the first screen, tap **Use a demo card**.
- **Run it yourself** (`/setup`) is this guide as a page, with the commands to copy.
- **Connections** (`/status`) shows what is connected on this computer.

To turn on live research for the Rumours tab, follow [docs/SETUP.md](docs/SETUP.md). Without it, the tab replays notes recorded from earlier real research runs.

## How it stays honest

- **A sum, never a result.** Tallie labels its figure as a sum of published sheets with how many were read. It names no winner. [Why](docs/adr/0001-portal-sums-never-a-result-or-winner.md)
- **INEC's figures against INEC's figures.** The count comes from the results portal, not from numbers voters type in. [Why](docs/adr/0002-count-comes-from-the-portal-not-from-voters.md)
- **Notes describe, they do not rule.** A note says what has been reported, by whom, with links, and how solid it is.
- **Tamper-evident.** The published results Tallie uses are sealed in a hash chain anyone can re-check at `/verify`.
- **Private.** The voter identification number is used for one lookup and never stored. Phone numbers are stored only as salted hashes.

## For developers

- [GLOSSARY.md](GLOSSARY.md): the words this project uses, and the ones it avoids
- [docs/TECHNICAL.md](docs/TECHNICAL.md): architecture, data, commands, tests, deployment
- [docs/adr/](docs/adr): decisions and their reasons
- [docs/SETUP.md](docs/SETUP.md): local setup, including live research

## Credits

- **Data:** Center for Collaborative Investigative Journalism (CCIJ), [Nigeria-2023-election](https://github.com/anndawn/Nigeria-2023-election). Details in [data/rivers-2023/SOURCE.md](data/rivers-2023/SOURCE.md).
- **Research tooling:** [Agent Reach](https://github.com/Panniantong/Agent-Reach) for web and social search.
- **AI assistance:** Claude (Anthropic), through Claude Code, helped write the code, tests and documents, and is the model behind the research agent. The team reviewed what it produced.
- **Process:** Matt Pocock's [engineering skills](https://github.com/mattpocock/skills) for the glossary, decision records and module design.
- Next.js, React, Tailwind CSS, Vitest, PGlite, Neon.
