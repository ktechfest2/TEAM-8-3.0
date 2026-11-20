import type { Metadata } from "next";
import Link from "next/link";
import { Chevron, CoverageBar, ScreenHeader } from "@/components/app/ui";
import { currentElection, currentTrail } from "@/lib/count/current";
import { headlineComparison, n } from "@/lib/count/explain";
import type { AreaTrail, Finding } from "@/lib/count/trail";

export const metadata: Metadata = { title: "After the results · Tallie" };

/** The three answers, worst first. Only the first group starts open. */
const GROUPS: { finding: Finding; title: (k: number) => string; dot: string }[] = [
  { finding: "unexplained", title: (k) => `${k} ${k === 1 ? "does" : "do"} not add up`, dot: "bg-am" },
  { finding: "consistent", title: (k) => `${k} add${k === 1 ? "s" : ""} up`, dot: "bg-gr" },
  { finding: "open", title: (k) => `${k} with too few sheets to tell`, dot: "bg-mu" },
];

/** One local government: its name, and the party where the sheets and the announcement are furthest apart. */
function Row({ area, big }: { area: AreaTrail; big: boolean }) {
  const c = headlineComparison(area);
  return (
    <Link href={`/count/${area.code}`} className="flex min-h-[64px] items-center gap-3 px-5 py-3 text-tx no-underline">
      <div className="min-w-0 flex-1">
        <div className={`truncate font-medium ${big ? "text-lg" : ""}`}>{area.name}</div>
        {c && (
          <table className={`num mt-1 w-full max-w-[250px] border-collapse text-left ${big ? "text-[15px]" : "text-xs text-mu"}`}>
            <tbody>
              <tr>
                <th scope="row" className="w-12 py-0.5 pr-2 font-medium text-mu">
                  {c.party}
                </th>
                <td className="py-0.5 pr-1 text-mu">Sheets</td>
                <td className="py-0.5 text-right font-semibold">{n(c.portalSum)}</td>
              </tr>
              <tr>
                <th scope="row" className="py-0.5 pr-2" />
                <td className="py-0.5 pr-1 text-mu">Announced</td>
                <td className={`py-0.5 text-right font-semibold ${big ? "text-am" : ""}`}>{n(c.announced)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      <Chevron />
    </Link>
  );
}

export default function CountPage() {
  const trail = currentTrail();
  const pct = Math.round((trail.coverage.read / trail.coverage.total) * 100);

  return (
    <div className="pb-8">
      <ScreenHeader title="After the results" sub="Do the result sheets add up to what was announced?" />

      <div className="space-y-4 px-4">
        <section className="rounded-3xl bg-tx p-5 text-bg">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ac">Run on real data</p>
          <p className="mt-1.5 text-[22px] font-bold leading-tight">
            {currentElection.state.name} State, {currentElection.election}
          </p>
          <div className="mt-4">
            <CoverageBar read={trail.coverage.read} total={trail.coverage.total} />
          </div>
          <p className="num mt-2 text-sm opacity-80">
            {n(trail.coverage.read)} of {n(trail.coverage.total)} result sheets read ({pct}%)
          </p>
        </section>

        <h2 className="eyebrow px-1 pt-2">{trail.areas.length} local governments</h2>

        {GROUPS.map((g) => {
          const areas = trail.areas.filter((a) => a.finding === g.finding);
          if (areas.length === 0) return null;
          const flagged = g.finding === "unexplained";
          return (
            <details key={g.finding} open={flagged} className="group card overflow-hidden !p-0">
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${g.dot}`} />
                <span className="flex-1 text-lg font-semibold">{g.title(areas.length)}</span>
                <svg
                  className="shrink-0 text-mu transition-transform group-open:rotate-180"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <ul className="rows border-t border-ln">
                {areas.map((a) => (
                  <li key={a.code}>
                    <Row area={a} big={flagged} />
                  </li>
                ))}
              </ul>
            </details>
          );
        })}

        <p className="px-1 text-xs text-mu">
          A sum of sheets is not a result and names no winner. Sheets:{" "}
          <a className="text-gr underline-offset-2 hover:underline" href={currentElection.sourceUrl}>
            {currentElection.source}
          </a>
          . Announced figures: {currentElection.announcedSource.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}
