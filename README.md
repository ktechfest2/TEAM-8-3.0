# Tally

**Know it counted.** An election companion for Nigerian voters. It answers three questions, in the voter's own language:

| | The voter asks | Tally answers from |
|---|---|---|
| **My unit** | Is my card ready? Did my polling unit move? Is it running? | A readiness check, and counts of what voters at that unit report |
| **Count** | Did the count change on its way up? | The result sheets INEC published, added up and set beside what was announced |
| **Ask** | I heard something. Is it true? | Public reporting, researched by an agent and returned as a sourced note |

It runs as a phone app in the browser, and over WhatsApp and SMS for any phone.

Built for the *Every Vote, Every Voice* hackathon (KTech Fest 3.0).

## The weak link we chose

A Nigerian election is counted in public at the polling unit, then added up on paper at ward, local-government and state collation centres. Where independent checks have caught altered results, the figures changed **after** the polling-unit count, during collation. INEC publishes a photo of every polling-unit result sheet, but not the collation forms, and has said it will not for 2027.

So Tally does the addition in the open. It sums the published polling-unit results for each area and shows that sum beside the announced figure. Where they differ by more than the missing sheets could explain, it says so, and an agent researches what has been reported about it.

Read more: [problem brief](docs/PROBLEM-BRIEF.md) · [system sketch](docs/SYSTEM-SKETCH.md) · [write-up](docs/WRITE-UP.md)

## It runs on real data

The count in this prototype is not invented. It is the **2023 presidential election in Rivers State**: 6,866 polling units, with figures read from the result sheets on INEC's portal by [CCIJ](https://github.com/anndawn/Nigeria-2023-election), and the local-government figures INEC released under a freedom-of-information request.

On that data Tally flags two local governments, the same two the BBC reported on in 2023:

| Local government | Party | Result sheets add up to | Announced |
|---|---|---|---|
| Obio/Akpor | LP | 68,521 | 3,829 |
| Oyigbo | LP | 17,875 | 10,784 |

In both, a *partial* sum of sheets is already above the announced figure. Sheets still missing could only add votes, so they cannot explain it. The other 21 local governments are not flagged.

Card lookups and live reports from polling units are simulated. [What is real and what is not](docs/TECHNICAL.md#what-is-real-and-what-is-simulated).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No accounts needed. Try card `4821` on the first screen.

To turn on live research for the Ask tab, follow [docs/SETUP.md](docs/SETUP.md). Without it, Ask replays notes recorded from earlier real research runs.

## How it stays honest

- **A sum, never a result.** Tally labels its figure as a sum of published sheets with how many were read. It names no winner. [Why](docs/adr/0001-portal-sums-never-a-result-or-winner.md)
- **INEC's figures against INEC's figures.** The count comes from the results portal, not from numbers voters type in. [Why](docs/adr/0002-count-comes-from-the-portal-not-from-voters.md)
- **Notes describe, they do not rule.** A note says what has been reported, by whom, with links, and how solid it is.
- **Tamper-evident.** The published results Tally uses are sealed in a hash chain anyone can re-check at `/verify`.
- **Private.** Phone numbers are stored only as salted hashes. Card digits are never stored.

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
