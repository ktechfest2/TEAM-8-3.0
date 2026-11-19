# Tally

**Know it counted.** A WhatsApp and SMS companion that walks first-time voters through election day.

| | The voter asks | They send |
|---|---|---|
| **Before** | Is my card ready? Did my polling unit move? | `READY 4821` |
| **During** | Is my unit running? | `REPORT ARRIVED` |
| **After** | Does the result on the wall match what was published? | `RESULT A112 B98 C41 D7 REJ6 ACC264` |

Journalists see the same reports at **/newsroom**, and anyone can check the log at **/verify**.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000/simulator. No accounts needed.

## Why trust it

- **Counts, not claims.** One report stays *unverified*.
- **Neutral.** A mismatch reads *unmatched, needs review*, never an accusation.
- **Tamper-evident.** Every result is hash-chained; edits break the chain.
- **Private.** Phone numbers are never stored, only salted hashes.

---

Hackathon prototype for *Every Vote, Every Voice*. Card, polling-unit and published-result data are simulated; no INEC
data access is assumed. Built with Claude (AI coding assistant).

Setup with Neon, Twilio, deployment and design details: [docs/TECHNICAL.md](docs/TECHNICAL.md).
