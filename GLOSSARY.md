# Tallie

Tallie is an election companion for Nigerian voters. It answers three kinds of question in the voter's own language: is my polling unit ready and running, did the count change on its way up, and is this thing I heard true.

## Language

### People

**Voter**:
A person who asks Tallie about the election. Tallie knows a voter only by a salted hash of their phone number, never the number itself.
_Avoid_: User, sender, reporter, citizen

### Places

**Polling Unit**:
The place where a voter is registered to vote and where the result sheet is posted after counting.
_Avoid_: Station, booth, centre, PU

**Unit Code**:
The identifier of a polling unit, written state/local government/ward/unit, such as `32/15/04/012`.
_Avoid_: Unit ID, PU code, delimitation

**Area**:
A ward, local government or state: any place made of more than one polling unit.
_Avoid_: Region, level, zone

### Before and during election day

**Card**:
The voter's permanent voter card. Tallie uses it only to answer the Readiness Check and never keeps its digits.
_Avoid_: PVC, ID, voter ID

**Readiness Check**:
The answer to "is my card ready, and did my polling unit move?".
_Avoid_: Lookup, registration check, status check

**Live Report**:
A voter's statement of what is happening at their polling unit right now: officials arrived, accreditation started, or a long queue. One voter's live report stays unverified until another voter reports the same.
_Avoid_: Signal, incident, alert, update

### The count

**Result Sheet**:
The official form filled in at a polling unit after counting, posted on the wall and photographed to the results portal.
_Avoid_: Wall result, form, EC8A

**Figures**:
The numbers on a result sheet: votes per party, registered voters and accredited voters.
_Avoid_: Numbers, scores, tallies, counts

**Published Result**:
The figures the election authority has put on its public results portal for one polling unit.
_Avoid_: Official result, IReV result, portal result, uploaded result

**Announced Result**:
The figures an election official declares aloud at a collation centre for an area.
_Avoid_: Declared result, final result, official result

**Portal Sum**:
Tallie's own addition of the published results of every polling unit in an area that has one. It is working shown as evidence; it is never a result and never names a winner.
_Avoid_: Total, tally, estimate, projection, our result, actual number

**Coverage**:
How many of an area's polling units have a published result that could be read, out of how many exist.
_Avoid_: Completeness, turnout, upload rate

**Count Trail**:
One party's figures followed upward from polling units through ward and local government to the state, with the portal sum beside the announced result wherever one exists.
_Avoid_: Collation chain, audit, recount

**Mismatch**:
A difference between a portal sum and the announced result for the same area and party.
_Avoid_: Fraud, rigging, discrepancy, irregularity

**Unexplained Mismatch**:
A mismatch too large for the polling units missing from coverage to account for, even if every registered voter in them had voted one way.
_Avoid_: Proof, red flag, anomaly

### Rumours and research

**Rumour**:
Something a voter has heard or seen about the election and wants checked.
_Avoid_: Claim, fake news, misinformation, story

**Note**:
Tallie's written answer to a rumour or a mismatch: what was asked, what public reporting says, the sources, and how solid the evidence is. A note describes what has been reported; it never rules on who is right.
_Avoid_: Verdict, fact-check, ruling, answer

**Recorded Note**:
A note saved from an earlier real research run and shown as recorded, for places where live research cannot run.
_Avoid_: Cached answer, sample, mock

### Trust

**Log**:
The append-only, hash-chained record of what the results portal showed for each polling unit. Anyone can check that it has not been altered.
_Avoid_: Ledger, blockchain, audit trail

**Entry**:
One record in the Log.
_Avoid_: Block, row, record
