# Research runs on a local machine; the hosted site shows recorded notes

Notes are written by an agent that searches the public web and social media through Agent Reach, driven by Claude Code running headless. Both need a local install and a logged-in Claude account, so live research runs only where Tally is set up locally. The hosted site serves recorded notes: real notes saved from earlier local runs, always marked as recorded.

We chose this over calling hosted search and model APIs from the server because Agent Reach reaches social platforms those APIs do not, and because it needed no new paid accounts before the hackathon deadline.

## Consequences

- Anyone who wants live research must follow the local setup guide.
- A recorded note must never be shown without its recorded mark and the date of the run.
