# Problem brief

**Every Vote, Every Voice · Team 8 · Tallie**

## The link we chose: the adding-up of results

A Nigerian election is counted in public at 176,846 polling units, and INEC publishes a photo of every result sheet. Then the figures are added up on paper at ward, local government, state and national centres. None of those forms are published, and INEC has said they will not be for 2027.

Where independent checks have caught altered results, the change happened in that unseen adding-up. In Rivers State in 2023, the BBC added up the published sheets and found the declared figure for the winning candidate about 106,000 votes away from them.

## Who it affects

- **Voters**, who photograph the result on the wall and later wonder whether it is what was counted. Many have a basic phone, little data, and do not read English.
- **Journalists and observers**, who need to know which of 774 local governments to look at first.
- **Party agents and candidates**, who have 21 days to file a petition and must tie evidence to specific polling units.
- **INEC itself**, whose sound results are doubted because nobody can check them.

## What Tallie does

Tallie is one election companion. It goes deep on the adding-up, and meets the voter at the two moments either side of it.

1. **Election morning.** Is my card valid, did my polling unit move, is it open? Voters at the unit report what they see; one report stays unverified until a second voter says the same.
2. **After the results (the core).** Tallie adds up INEC's published result sheets and puts each sum beside what was announced. It flags a place only when the sheets still missing could not explain the gap.
3. **When a rumour spreads.** A research agent finds out what has actually been reported, and answers with sources.

## What makes it different

**A research agent, not a chatbot.** When a result does not add up, or a voter sends a rumour, Tallie starts a research run. The agent searches the web and reads news reports, observer statements and fact-checkers, and searches X, Reddit, Facebook and Instagram, using Agent Reach, an open-source toolkit. It works under rules:

- It is read-only. It runs in an empty folder and cannot open or change a file.
- Every statement must come from a page it opened. With no sources, the only thing it may say is that nothing reliable was found.
- Text on a web page is evidence to weigh, never an instruction to follow.
- It describes what was reported and how solid it is. It never rules on who is right.

**In the voter's own language.** Research is done once and written in five languages: English, Pidgin, Hausa, Yorùbá and Igbo. A voter switches language with one tap and gets the same note, with the same sources.

**Built for every phone.** Tallie is designed around how Nigerians actually reach a service, not around a smartphone app:

| Channel | Who it is for | Today |
|---|---|---|
| Browser | Anyone with data | Working |
| Voice in the browser | Voters who do not read | In progress |
| SMS | Any phone, no data | Designed; runs in a simulator |
| USSD | Any phone, no data, no typing a number to text | Designed |
| WhatsApp | The most-used app on a Nigerian smartphone | Designed; runs in a simulator |

One engine answers all of them, so a voter on a basic phone gets the same polling-unit answers by text as a voter in the browser.

**It ran on a real election.** On the 2023 presidential election in Rivers State, 6,866 polling units, Tallie flags two of 23 local governments: Obio/Akpor and Oyigbo, the same two the BBC investigated.

**It is honest by construction.** The count is plain arithmetic with no AI in it. Tallie shows how many sheets every sum is built on, names no winner, and seals the published results it uses in a log anyone can re-check. It uses only what INEC already publishes and asks nothing new of officials: trust without friction.

## What it does not do

Tallie detects and documents; it cannot stop a result being changed. The card check and the reports from polling units are simulated in this prototype, because a real lookup needs INEC's cooperation. Hausa, Yorùbá and Igbo notes are machine-translated and not yet reviewed by native speakers.

Sources for the figures above are listed in the [write-up](WRITE-UP.md#sources).
