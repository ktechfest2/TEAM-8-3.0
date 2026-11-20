# Write-up

**Tallie: an election companion, from your polling unit to the final result.** Team 8, *Every Vote, Every Voice*, KTech Fest 3.0.

## The problem

Amaka votes, watches the count, and photographs the result sheet on the wall. Days later the final numbers are announced, and she has no way to tell whether what she saw is what was counted. Meanwhile rumours move faster than anyone can check them.

Between her polling unit and the announcement, the figures are added up on paper four times: ward, local government, state, nation. INEC publishes the polling-unit sheets but not the collation forms. Where independent checks have caught altered results, the change happened in that unseen addition. The full case is in the [problem brief](PROBLEM-BRIEF.md).

## The solution

Tallie is one companion with three parts that lead into each other.

1. **Election morning.** A voter gives the voter identification number on their card. Tallie says whether the card is valid and whether the polling unit moved, then shows what other voters at that unit report: officials arrived, accreditation started, long queue. One voter's report is shown as unverified; it takes two to count as reported.
2. **After the results.** Tallie adds up the published polling-unit results for each ward, local government and state, and shows each sum beside the announced figure. It says how many sheets it could read. It flags an *unexplained mismatch* only in two cases: the partial sum is already above the announced figure, or the announced figure is higher by more than every registered voter in the unread units.
3. **When a rumour spreads.** For a flagged mismatch, or any rumour the voter types, a research agent searches news, observer statements, fact-checkers and social media, and returns a *note*: what was reported, by whom, the sources, how solid the evidence is, and what is still open. It works like a community note that is not tied to one platform.

Tallie works in the browser today, and voice in the browser is being added. The same engine is built to serve WhatsApp, SMS and USSD, so that a voter with a basic phone gets the polling-unit features by text. Those channels are not live yet: the text channel runs in a simulator.

### What we built in the hackathon

The team's first version asked voters to type in the figures from the wall and compared them with a mocked published result. We then rebuilt it:

- Replaced voter-typed figures with the results INEC itself publishes, and built the count trail on them.
- Loaded real data: 6,866 polling units from the 2023 presidential election in Rivers State.
- Added the research agent and notes, with five languages.
- Redesigned the interface as a phone app, and renamed the product from Tally to Tallie.
- Added a landing page whose three walkthroughs play the product by themselves, using the real figures and recorded notes, and a page that walks through running it locally.
- Repurposed the tamper-evident log to seal the published results Tallie uses.
- Wrote a glossary and decision records so the product's language and reasons are explicit.

### Does it work?

On the Rivers 2023 data Tallie flags two of 23 local governments, Obio/Akpor and Oyigbo. Those are the two the BBC investigated. In Oyigbo both tests fire: the LP sum of sheets (17,875) is above the announced 10,784, and the announced APC figure (16,630) is higher than the sheets (2,435) by more than the 8,682 registered voters in the unread units.

## How AI is used

AI is used in two places, and deliberately not in a third.

- **Research agent (in the product).** The research feature runs Claude through Claude Code in headless mode on a local machine. It may only run a fixed list of read-only search and reading commands, provided by Agent Reach: web search (Exa), page reading (Jina), and searches of X, Reddit, Facebook and Instagram. It cannot read or write local files. It is told that anything it reads online is material to assess, never an instruction; that every statement must come from a source it opened; and that it must describe reporting without ruling on who is right. Its reply is parsed strictly: sources without a real web address are dropped, and a note with no sources can only be graded "nothing reliable found".
- **Translation.** Notes are researched once in English, then translated by the same model into Pidgin, Hausa, Yorùbá and Igbo. These translations have not been reviewed by native speakers.
- **Not used for the count.** Adding up results and deciding what counts as a mismatch is plain arithmetic in about 180 lines of tested code. No model decides anything about an election figure.
- **Building it.** Claude, through Claude Code, helped write the code, tests and these documents. The team reviewed what it produced.

Live research needs Claude Code and Agent Reach installed, so it runs on a local machine. The hosted demo replays notes recorded from real runs, marked as recorded. See [ADR 0003](adr/0003-research-runs-locally-hosted-site-shows-recorded-notes.md).

## Tools used

| For | Tool |
|---|---|
| App | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Tests | Vitest; PGlite (embedded Postgres) for the database tests |
| Storage | In-memory store for the demo; Neon Postgres when configured |
| Messaging | Twilio webhooks for WhatsApp and SMS (written, not connected) |
| Research agent | Claude (Anthropic) through Claude Code, headless |
| Search and social reading | Agent Reach: Exa, Jina reader, twitter-cli, OpenCLI |
| Data | CCIJ's *Nigeria-2023-election* dataset |
| Process | Matt Pocock's engineering skills: glossary, decision records, deep-module design |

## Fit with Nigerian conditions

- **Basic phones:** the polling-unit features are designed to work over SMS with five short commands. The commands run today in a simulator; the SMS, WhatsApp and USSD channels are not live.
- **Language:** replies in English and Pidgin; notes in five languages.
- **Poor network:** the text channel is designed to need no data; the app's results screens are plain server-rendered pages.
- **The law:** Tallie shows a labelled sum of INEC's published figures and names no winner. Our reading of section 124(4) of the Electoral Act 2026 and INEC's November 2026 statement on independent tabulation is in [ADR 0001](adr/0001-portal-sums-never-a-result-or-winner.md). It is not legal advice.
- **The existing field:** groups already read portal sheets into data. Tallie is designed to consume such a feed, and to hand journalists and observers a short list of where to look.

## Limits

- The count depends on someone reading the portal's sheets into figures. Coverage for Rivers 2023 is 77%, and the figures were machine-read.
- Tallie detects and documents. It cannot stop a result being changed.
- Card lookup and live reports are simulated; a real lookup needs INEC's cooperation.
- Only four parties are in the dataset.
- The research agent can be wrong. Every note shows its sources so a reader can check.

## What comes next

1. Take a live feed of portal results for the 16 January 2027 election from a group already producing one.
2. Add collation forms photographed by party agents and observers, who are entitled to copies, so a mismatch can be pinned to a ward and a polling-unit row.
3. Native-speaker review of Hausa, Yorùbá and Igbo.
4. A voice line, for voters who do not read.

## Sources

- Electoral Act 2026: https://placng.org/i/wp-content/uploads/2026/03/ElectoralAct2026.pdf
- BBC on Rivers 2023: https://www.bbc.com/news/65163713
- INEC on not publishing collation forms (Premium Times, Nov 2026): https://www.premiumtimesng.com/news/top-news/926086-2027-why-we-cant-upload-ward-lg-results-inec.html
- INEC on independent tabulation (Punch, 17 Nov 2026): https://punchng.com/inec-cautions-parties-observers-against-announcing-unofficial-election-results/
- Yiaga Africa on Edo 2024: https://brandeconomy.com.ng/wp-content/uploads/2024/09/Post-election-Press-Statement-on-2024-Edo-Gov-Election.pdf
- Yiaga Africa on ward collation: https://www.thecable.ng/yiaga-fct-council-polls-expose-ward-level-collation-as-nigerias-most-vulnerable-electoral-link/
- CCIJ dataset: https://github.com/anndawn/Nigeria-2023-election
