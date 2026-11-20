// Copy for the landing page. It follows the voter through the three moments in the hackathon's
// problem statement. Every part follows one template: the question in the voter's words, what Tallie does, the product itself, what comes back and what each answer is for.

export type Answer = { name: string; decides: string };

export type Part = {
  id: string;
  /** The moment in the voter's election this part answers. */
  name: string;
  /** The voter's question. */
  question: string;
  /** The line under the question, addressed to the reader. */
  you: string;
  does: string;
  answers: Answer[];
  /** What is real and what is simulated in this prototype. */
  status: string;
  /** The page of the app this part lives on. */
  href: string;
  open: string;
  /** Path under /public once a recording of a real run exists; until then the live page is shown. */
  video?: string;
};

export const landing = {
  title: "An election companion, from your polling unit to the final result.",
  lede: "Tallie tells a Nigerian voter where to vote and whether their polling unit has opened, checks the announced result against the result sheets posted at the polling units, and looks into the rumours they hear. It answers in their own language, in the browser by text or by voice, and is designed to reach any phone over WhatsApp, SMS and USSD.",

  intro: {
    label: "The problem",
    statement: "Three moments when a voter is left guessing.",
    body: "On election morning Amaka finds out her polling unit has moved. That evening she photographs the result pasted on the wall, and days later she wonders whether it is what was announced. All the while, rumours reach her faster than anyone can check them. Tallie answers her at each of those moments.",
  },

  parts: [
    {
      id: "morning",
      name: "Election morning",
      question: "Where do I vote, and has my polling unit opened?",
      you: "Give the last four digits of your voter's card. Tallie tells you whether the card is valid, where your polling unit is now, and what voters already there are seeing.",
      does: "Tallie checks your card and your polling unit, then shows what other voters at that unit report: officials have arrived, accreditation has started, there is a long queue. You can add your own report in one tap. It remembers your polling unit and never your card.",
      answers: [
        { name: "Card valid, or not yet", decides: "Whether to sort it out before election day" },
        { name: "Polling unit moved", decides: "Where to go to vote" },
        { name: "Reports from the unit", decides: "When to set out, and what to expect there" },
      ],
      status: "Simulated in this prototype: a real card lookup needs INEC's cooperation. Try card 4821. One voter's report stays unverified until a second voter reports the same.",
      href: "/unit",
      open: "Check my polling unit",
    },
    {
      id: "results",
      name: "After the results",
      question: "Is the result on the wall the one that was announced?",
      you: "After counting, every polling unit pastes its result sheet on the wall and INEC publishes a photo of it. Tallie adds those sheets up at every step the result travels, from ward to local government to state to the national figure, and puts each sum beside what was announced there.",
      does: "Where the two agree, Tallie says so. Where they differ, it checks whether the sheets it could not read might explain the gap, and flags the place only when they could not. Then it researches what was reported about that gap. It shows how many sheets every sum is built on, and it never names a winner.",
      answers: [
        { name: "What the sheets add up to", decides: "The votes each party has on the published result sheets" },
        { name: "What was announced", decides: "The figure officials declared for the same place" },
        { name: "Where they do not match", decides: "Which places to look at first, and what was reported there" },
      ],
      status: "Real data: the 2023 presidential election in Rivers State, read from the result sheets on INEC's portal by CCIJ. In this data, announced figures exist for the local governments and the state.",
      href: "/count",
      open: "Check the results",
    },
    {
      id: "rumours",
      name: "When a rumour spreads",
      question: "I heard something about the election. Is it true?",
      you: "Type what you heard. An agent searches news, observer statements, fact-checkers and social media, and writes a short note with its sources.",
      does: "The note says what has been reported and by whom, how solid the evidence is, and what is still open. It describes the reporting and never rules on who is right. Notes come in English, Pidgin, Hausa, Yorùbá and Igbo.",
      answers: [
        { name: "What was reported", decides: "What is known, and who said it" },
        { name: "How solid it is", decides: "How much weight to give it" },
        { name: "Sources", decides: "Where to read it for yourself" },
      ],
      status: "On this site the notes are replayed from real research runs. Live research runs where Tallie is set up on a computer, with Claude Code and Agent Reach.",
      href: "/ask",
      open: "Check a rumour",
    },
  ] satisfies Part[],

  how: {
    label: "How it works",
    statement: "Add up what was published. Compare it with what was announced. Research the gap. Report what was found.",
    steps: [
      {
        n: "01",
        title: "Collect the published result sheets",
        text: "Every polling unit's result sheet is photographed to INEC's public portal. Tallie takes the figures read from those sheets and seals them in a log, so anyone can check they were not changed afterwards.",
      },
      {
        n: "02",
        title: "Add them up at every level",
        text: "Polling units into wards, wards into local governments, local governments into the state, states into the national figure. This is plain arithmetic: no AI model touches an election figure.",
      },
      {
        n: "03",
        title: "Compare with what was announced",
        text: "Each sum sits beside the announced figure, with the number of sheets it is built on. A gap counts only when the sheets Tallie could not read are too few to account for it.",
      },
      {
        n: "04",
        title: "Research the gap",
        text: "A gap can have a lawful cause: results cancelled at a polling unit, a court order, a rerun. An agent searches news, observer statements, fact-checkers and social media for what has been reported about it.",
      },
      {
        n: "05",
        title: "Report findings, not a verdict",
        text: "Where the reporting explains the gap, Tallie shows it with its sources. Where nothing does, it says the gap is unexplained and stops there. It does not tell anyone what to believe.",
      },
    ],
  },

  evidence: {
    label: "On real data",
    statement: "We ran it on a real election. It found the two places that do not add up.",
    body: "What you see in the demo is not a mock-up. It is the output of running Tallie on the published result sheets of a past election, and every figure on this page is read from that run.",
    bbc: { text: "The same two local governments the BBC reported on in 2023", url: "https://www.bbc.com/news/65163713" },
  },

  next: {
    label: "What's next",
    statement: "From one past election to the next live one.",
    steps: [
      { when: "Done", title: "Tested on a real election", text: "Rivers State, 2023: every published result sheet added up, two local governments flagged.", done: true },
      { when: "Now", title: "Voice in the browser", text: "Ask out loud and hear the answer in your own language, for voters who do not read.", done: false },
      { when: "16 January 2027", title: "Live on election night", text: "A live feed of portal results from a group already reading the sheets, so the check runs as results come in.", done: false },
      { when: "After", title: "Any phone, every level", text: "WhatsApp, SMS and USSD for a basic phone with no data, and collation forms photographed by party agents, so a gap can be pinned to a ward.", done: false },
    ],
  },

  close: {
    title: "Run it on your own computer.",
    body: "Start Tallie in two minutes, then turn on the research agent and ask it your own question.",
  },

  credits: [
    { what: "Data", who: "CCIJ, Nigeria-2023-election", url: "https://github.com/anndawn/Nigeria-2023-election" },
    { what: "Research tooling", who: "Agent Reach", url: "https://github.com/Panniantong/Agent-Reach" },
    { what: "Research agent", who: "Claude, through Claude Code", url: "https://claude.com/claude-code" },
  ],
};
