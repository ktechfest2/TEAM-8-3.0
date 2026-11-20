# System sketch

## Where Tallie sits in the election

The top row is the official process. Tallie reads what that process already makes public and never writes back into it.

```mermaid
flowchart LR
  subgraph official["Official process (INEC)"]
    direction LR
    A["Registration<br/>and voter cards"] --> B["Polling unit<br/>vote and public count"]
    B --> C["Result sheet<br/>photographed to the portal"]
    B --> D["Ward<br/>collation"]
    D --> E["Local government<br/>collation"]
    E --> F["State<br/>collation"]
    F --> G["Declaration"]
  end

  subgraph tally["Tallie"]
    direction LR
    U["My unit<br/>readiness and live reports"]
    S["Count<br/>add up the published sheets"]
    R["Ask<br/>research what was reported"]
  end

  A -. "is my card ready,<br/>did my unit move" .-> U
  B -. "what voters at the<br/>unit report" .-> U
  C == "published results" ==> S
  E == "announced results" ==> S
  F == "announced results" ==> S
  S -- "mismatch" --> R
  V(["Voter"]) --- U
  V --- S
  V -- "a rumour" --> R
  R --> N["Note with sources"]
```

Ward collation has no arrow into Tallie because ward results are never announced publicly. Tallie shows ward sums as working, and the first real comparison is at local-government level.

## How the parts fit together

```mermaid
flowchart TB
  subgraph channels["How voters reach Tallie"]
    APP["Browser<br/>text, and voice in progress"]
    WA["WhatsApp<br/>designed, not live"]
    SMS["SMS<br/>designed, not live"]
    USSD["USSD<br/>designed, not built"]
  end

  subgraph engine["One engine"]
    MU["My unit<br/>readiness check, live reports"]
    CT["Count trail<br/>portal sums, coverage, mismatches"]
    NT["Notes<br/>ask, research, record"]
    LG["Log<br/>hash-chained seal of published results"]
  end

  subgraph sources["Where the facts come from"]
    P[("Published results<br/>per polling unit")]
    AN[("Announced results<br/>per local government")]
    VL["Voter lookup<br/>simulated"]
    WEB["Public web and social media<br/>through Agent Reach"]
  end

  APP --> MU
  WA -.-> MU
  SMS -.-> MU
  USSD -.-> MU
  APP --> CT
  APP --> NT
  MU --> VL
  P --> CT
  AN --> CT
  P --> LG
  CT -- "unexplained mismatch" --> NT
  NT -- "local machine: live" --> AG["Research agent<br/>Claude Code, headless"]
  AG --> WEB
  NT -- "hosted site: recorded" --> RN[("Recorded notes")]
  AG -. "saved after a real run" .-> RN
```

## How a mismatch is decided

```mermaid
flowchart TD
  A["For one party in one local government"] --> B{"Is the sum of sheets<br/>above the announced figure,<br/>beyond reading noise?"}
  B -- yes --> U1["Unexplained mismatch<br/>missing sheets can only add votes"]
  B -- no --> C{"Is the announced figure higher by<br/>more than every registered voter<br/>in the unread units?"}
  C -- yes --> U2["Unexplained mismatch<br/>the unread units cannot make up the gap"]
  C -- no --> D{"Within reading noise?"}
  D -- yes --> OK["Adds up"]
  D -- no --> OPEN["Too few sheets to tell"]
```

The code for this is [`lib/count/trail.ts`](../lib/count/trail.ts), about 180 lines with no dependencies, tested on fixtures and on the real Rivers data.

## How it connects to the rest of the system

- **In:** any feed of polling-unit results read from the portal. Today that is one dataset (CCIJ, Rivers 2023). Groups such as the NEDO consortium and Yiaga Africa's ERAD already produce such feeds for 2027; Tallie would consume one, not build another reader.
- **Out:** a per-area mismatch with the two figures, the coverage, the sealed inputs and a sourced note. That is the starting material for a journalist, an observer's statement, or a request to INEC for certified copies.
- **Not replaced:** INEC's collation, observers' parallel vote tabulation, and fact-checkers. Tallie points each of them at where to look.
