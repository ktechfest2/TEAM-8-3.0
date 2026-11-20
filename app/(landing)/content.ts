// Copy for the landing page. It follows the voter through the three moments in the hackathon's
// problem statement. Every part follows one template: the question in the voter's words, what Tallie does, the product itself, what comes back and what each answer is for.

export type Part = {
  /** The anchor on the landing page. */
  id: string;
  /** The moment in the voter's election this part answers. */
  name: string;
  /** The voter's question. */
  question: string;
};

export const landing = {
  title: "An election companion, from your polling unit to the final result.",
  lede: "Tallie tells a Nigerian voter where to vote and whether their polling unit has opened, checks the announced result against the result sheets posted at the polling units, and looks into the rumours they hear. It answers in five languages, and is built for every phone: voice, SMS, USSD, WhatsApp and the browser.",

  intro: {
    label: "The problem",
    statement: "Three moments when a voter is left guessing.",
    body: "On election morning Amaka finds out her polling unit has moved. Days later she wonders whether the result on the wall is what was announced. All the while, rumours reach her faster than anyone can check them. Watch Tallie answer each one.",
  },

  parts: [
    { id: "morning", name: "Election morning", question: "Where do I vote, and has my polling unit opened?" },
    { id: "results", name: "After the results", question: "Is the result on the wall the one that was announced?" },
    { id: "rumours", name: "When a rumour spreads", question: "I heard something about the election. Is it true?" },
  ] satisfies Part[],

  evidence: {
    label: "On real data",
    statement: "We ran it on a real election. It flagged two local governments, the same two the BBC reported on.",
    bbc: { text: "Read the BBC's 2023 report", url: "https://www.bbc.com/news/65163713" },
  },

  agent: {
    label: "The research agent",
    statement: "Not a chatbot. An agent that goes and reads, then shows its sources.",
    reads: {
      title: "It reads",
      channels: ["Web search", "News reports", "Fact-checkers", "Observer statements", "X", "Reddit", "Facebook", "Instagram"],
      note: "Claude, run through Claude Code, with Agent Reach: an open-source toolkit for search and reading.",
    },
    rules: [
      { name: "Sources or nothing", text: "Every statement comes from a page it opened. With none, it can only say nothing reliable was found." },
      { name: "Read-only", text: "It runs in an empty folder and cannot open or change a file." },
      { name: "Evidence, never orders", text: "Text on a web page cannot tell it what to do." },
      { name: "Findings, not a verdict", text: "It says what was reported and how solid it is. It never rules on who is right." },
    ],
  },

  reach: {
    label: "Every phone, every language",
    statement: "Built for the phone a voter already has, in the language they speak.",
    body: "Most Nigerian voters are not on a smartphone app with data to spare. One engine answers every channel, so a voter on a basic phone gets the same answers as a voter in the browser.",
    channels: [
      { name: "Voice", who: "For voters who do not read. Ask out loud, hear the answer.", state: "In progress, in the browser" },
      { name: "SMS", who: "Any phone, no data. Five short commands.", state: "Designed, runs in a simulator" },
      { name: "USSD", who: "Any phone, no data, nothing to install. Dial and choose.", state: "Designed" },
      { name: "WhatsApp", who: "The app most Nigerian smartphones already have.", state: "Designed, runs in a simulator" },
      { name: "Browser", who: "Anyone with data. The full product.", state: "Working today" },
    ],
    languages: {
      title: "Five languages",
      list: ["English", "Pidgin", "Hausa", "Yorùbá", "Igbo"],
      note: "Research is done once, then written in all five. A voter switches with one tap and gets the same note with the same sources.",
    },
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
