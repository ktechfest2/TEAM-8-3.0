import type { Metadata } from "next";
import { CopyBlock } from "@/components/CopyBlock";

export const metadata: Metadata = { title: "Run it yourself · Tallie" };

const REPO = "https://github.com/ktechfest2/TEAM-8-3.0";
const link = "font-medium text-gr underline-offset-4 hover:underline";

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ln py-10">
      <span className="num text-sm text-mu">{n}</span>
      <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-[17px]">{children}</div>
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
    <div className="mx-auto max-w-[720px]">
      <header className="py-10">
        <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Run it on your own computer</h1>
        <p className="mt-3 text-[17px] text-mu">
          The demo on this site replays research that was recorded earlier. On your own computer you can run the same thing live: the results
          check on the real data, and the research agent answering your own question.
        </p>
      </header>

      <Step n="01" title="Start Tallie with one command">
        <p>You need Node 20 or newer. No accounts or keys.</p>
        <CopyBlock>{`git clone ${REPO}.git tallie\ncd tallie\nnpm run demo`}</CopyBlock>
        <p>
          <span className="font-mono text-[15px]">npm run demo</span> installs what is missing, starts Tallie, and opens a page that shows whether
          everything is connected: the data, the sealed log, Claude Code, and each place the research agent reads. From there, open the app and use
          it.
        </p>
        <p>
          The results check runs on the real Rivers State data straight away. If Claude Code is installed, live research is turned on for you. If
          not, the Rumours tab replays recorded notes, and steps 2 and 3 below show what to install.
        </p>
      </Step>

      <Step n="02" title="Install Claude Code">
        <p>
          The research agent is Claude, run through Claude Code. Install it from{" "}
          <a className={link} href="https://claude.com/claude-code" target="_blank" rel="noreferrer">
            claude.com/claude-code
          </a>{" "}
          and sign in, then check that it answers without opening a login page.
        </p>
        <CopyBlock>{`claude --version\nclaude -p "say OK"`}</CopyBlock>
      </Step>

      <Step n="03" title="Install Agent Reach">
        <p>
          Agent Reach gives the agent its search and reading tools. Follow{" "}
          <a className={link} href="https://github.com/Panniantong/Agent-Reach" target="_blank" rel="noreferrer">
            its install guide
          </a>
          , then see which channels work on your machine.
        </p>
        <CopyBlock>agent-reach doctor</CopyBlock>
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
                <th scope="row" className="py-2.5 pr-4 align-top font-medium">
                  {c.name}
                </th>
                <td className="py-2.5 text-mu">{c.needs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Step>

      <Step n="04" title="Run it again and check">
        <p>Stop Tallie with Ctrl+C and start it again.</p>
        <CopyBlock>npm run demo</CopyBlock>
        <p>
          The page that opens should now say <span className="font-semibold">Live research is on</span>. Open Rumours and type any question. The
          agent searches, reads and writes a note with its sources. A run takes one to four minutes. If it fails, Tallie falls back to a recorded
          note when one matches.
        </p>
      </Step>

      <Step n="05" title="What the agent is allowed to do">
        <p>
          It can only run the search and reading commands above, plus built-in web search and fetch. It cannot read, write or edit files, and it
          starts in an empty temporary folder. It is told that anything it reads online is material to assess, never an instruction.
        </p>
        <p>
          The full guide, with optional settings and how to record a note, is in{" "}
          <a className={link} href={`${REPO}/blob/main/docs/SETUP.md`} target="_blank" rel="noreferrer">
            docs/SETUP.md
          </a>
          .
        </p>
      </Step>
    </div>
  );
}
