import type { Metadata } from "next";

export const metadata: Metadata = { title: "Run it yourself · Tallie" };

const REPO = "https://github.com/ktechfest2/TEAM-8-3.0";

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-bg p-4 font-mono text-[13.5px] leading-relaxed text-tx">
      <code>{children}</code>
    </pre>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-3 border-t border-ln py-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <div>
        <span className="num text-sm text-mu">{n}</span>
        <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      </div>
      <div className="min-w-0 max-w-[72ch] space-y-4 text-[17px]">{children}</div>
    </section>
  );
}

const CHANNELS = [
  { name: "Web search", needs: "Nothing" },
  { name: "Page reading", needs: "Nothing" },
  { name: "X", needs: "Your X session, saved with agent-reach configure twitter-cookies" },
  { name: "Reddit, Facebook, Instagram", needs: "The OpenCLI browser extension, in a Chrome profile signed in to those sites, with Chrome running" },
];

export default function SetupPage() {
  return (
    <>
      <header className="py-10">
        <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Run it on your own computer</h1>
        <p className="mt-2 max-w-[40em] text-mu">
          The demo on this site replays research that was recorded earlier. On your own computer you can run the same thing live: the results
          check on the real data, and the research agent answering your own question.
        </p>
      </header>

      <Step n="01" title="Start Tallie">
        <p>You need Node 20 or newer. No accounts or keys.</p>
        <Code>{`git clone ${REPO}.git tally\ncd tally\nnpm install\nnpm run dev`}</Code>
        <p>
          Open <span className="font-mono text-[15px]">http://localhost:3000</span>. The results check runs on the real Rivers State data straight away. For the
          card check, try <span className="num font-semibold">4821</span>.
        </p>
      </Step>

      <Step n="02" title="Install Claude Code">
        <p>
          The research agent is Claude, run through Claude Code. Install it from{" "}
          <a className="font-medium text-gr underline-offset-4 hover:underline" href="https://claude.com/claude-code" target="_blank" rel="noreferrer">
            claude.com/claude-code
          </a>{" "}
          and sign in, then check it answers without opening a login page:
        </p>
        <Code>{`claude --version\nclaude -p "say OK"`}</Code>
      </Step>

      <Step n="03" title="Install Agent Reach">
        <p>
          Agent Reach gives the agent its search and reading tools. Follow{" "}
          <a className="font-medium text-gr underline-offset-4 hover:underline" href="https://github.com/Panniantong/Agent-Reach" target="_blank" rel="noreferrer">
            its install guide
          </a>
          , then see which channels work on your machine:
        </p>
        <Code>agent-reach doctor</Code>
        <p>Web search and page reading are enough to start. The others add social media. If a channel is missing, the agent moves on to the rest.</p>
        <table className="w-full border-collapse text-left text-[15px]">
          <thead className="text-sm text-mu">
            <tr className="border-b border-ln">
              <th className="py-2 pr-4 font-medium">Channel</th>
              <th className="py-2 font-medium">Needs</th>
            </tr>
          </thead>
          <tbody>
            {CHANNELS.map((c) => (
              <tr key={c.name} className="border-b border-ln last:border-0">
                <th scope="row" className="whitespace-nowrap py-2.5 pr-4 align-top font-medium">
                  {c.name}
                </th>
                <td className="py-2.5 text-mu">{c.needs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Step>

      <Step n="04" title="Turn on live research">
        <p>Stop Tallie and start it again with live research on.</p>
        <Code>{`# macOS / Linux\nTALLY_RESEARCH=live npm run dev\n\n# Windows PowerShell\n$env:TALLY_RESEARCH = "live"; npm run dev`}</Code>
        <p>
          Now open Rumours and type any question. The agent searches, reads and writes a note with its sources. A run takes one to four minutes. If
          it fails, Tallie falls back to a recorded note when one matches.
        </p>
      </Step>

      <Step n="05" title="What the agent is allowed to do">
        <p>
          It can only run the search and reading commands above, plus built-in web search and fetch. It cannot read, write or edit files, and it
          starts in an empty temporary folder. It is told that anything it reads online is material to assess, never an instruction.
        </p>
        <p>
          The full guide, with optional settings and how to record a note, is in{" "}
          <a className="font-medium text-gr underline-offset-4 hover:underline" href={`${REPO}/blob/main/docs/SETUP.md`} target="_blank" rel="noreferrer">
            docs/SETUP.md
          </a>
          .
        </p>
      </Step>
    </>
  );
}
