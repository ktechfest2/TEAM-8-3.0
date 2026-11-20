import type { Metadata } from "next";
import Link from "next/link";
import { systemStatus, type Check, type CheckState } from "@/lib/status";

export const metadata: Metadata = { title: "Is everything connected? · Tallie" };
export const dynamic = "force-dynamic";

const MARK: Record<CheckState, { sign: string; word: string; tone: string }> = {
  ok: { sign: "✓", word: "Connected", tone: "bg-gl text-gr" },
  off: { sign: "–", word: "Off", tone: "bg-bg text-mu" },
  missing: { sign: "!", word: "Not connected", tone: "bg-al text-am" },
};

const GROUPS: Check["group"][] = ["Data", "Research agent", "Where the agent reads"];

/** The page `npm run demo` opens: what is connected on this computer, then the way into the app. */
export default async function StatusPage() {
  const status = await systemStatus();
  return (
    <div className="mx-auto max-w-[720px] py-10">
      <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Is everything connected?</h1>

      <div className={`mt-6 rounded-3xl p-6 ${status.live ? "bg-tx text-bg" : "bg-sf"}`} role="status">
        <p className={`text-[13px] font-semibold uppercase tracking-[0.08em] ${status.live ? "text-ac" : "text-mu"}`}>{status.live ? "Live research is on" : "Recorded research"}</p>
        <p className="mt-2 text-xl font-semibold leading-snug">{status.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/unit" className="btn">
            Open Tallie
          </Link>
          <Link href="/ask" className="btn-o">
            Ask a question
          </Link>
        </div>
      </div>

      {GROUPS.map((group) => (
        <section key={group} className="mt-8">
          <h2 className="eyebrow px-1 pb-2">{group}</h2>
          <ul className="card rows !p-0">
            {status.checks
              .filter((c) => c.group === group)
              .map((c) => {
                const m = MARK[c.state];
                return (
                  <li key={c.name} className="flex items-start gap-4 px-5 py-4">
                    <span aria-hidden className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${m.tone}`}>
                      {m.sign}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-sm text-mu">{m.word}</span>
                      </div>
                      <p className="text-[15px] text-mu">{c.detail}</p>
                      {c.fix && <p className="mt-1 text-[15px] font-medium">{c.fix}</p>}
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <p className="mt-8 text-sm text-mu">
        This page only looks at what is installed and loaded on this computer. It runs no research and reads no password or token. Setup steps are on{" "}
        <Link href="/setup" className="font-medium text-gr underline-offset-4 hover:underline">
          Run it yourself
        </Link>
        .
      </p>
    </div>
  );
}
