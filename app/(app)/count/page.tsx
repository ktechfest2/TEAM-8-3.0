import type { Metadata } from "next";
import Link from "next/link";
import { Chevron, CoverageBar, FindingPill, ScreenHeader } from "@/components/app/ui";
import { currentElection, currentTrail } from "@/lib/count/current";
import { coverageLine, explainComparison, headlineComparison, n, unexplainedAreas } from "@/lib/count/explain";

export const metadata: Metadata = { title: "After the results · Tallie" };

const STEPS = ["Polling unit", "Ward", "Local government", "State"];

export default function CountPage() {
  const trail = currentTrail();
  const flagged = unexplainedAreas(trail);

  return (
    <div className="pb-8">
      <ScreenHeader title="After the results" sub={`${currentElection.state.name} State · ${currentElection.election}`} />

      <div className="space-y-4 px-4">
        <section className="card">
          <ol className="flex items-center text-[12px] font-medium text-mu" aria-label="How a result travels">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center">
                {i > 0 && <span aria-hidden className="mx-1.5 h-px w-3 bg-ln" />}
                <span className={i >= 2 ? "text-tx" : undefined}>{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[15px] text-mu">
            Tallie adds up the result sheets INEC published for every polling unit, then sets that sum beside what was announced
            for each local government.
          </p>
          <div className="mt-4">
            <CoverageBar read={trail.coverage.read} total={trail.coverage.total} />
            <p className="num mt-2 text-sm font-medium">{coverageLine(trail)}</p>
          </div>
        </section>

        {flagged.length > 0 && (
          <section>
            <h2 className="eyebrow px-1 pb-2 pt-2">
              {flagged.length} unexplained {flagged.length === 1 ? "mismatch" : "mismatches"}
            </h2>
            <div className="space-y-3">
              {flagged.map((a, i) => {
                const c = headlineComparison(a)!;
                return (
                  <Link
                    key={a.code}
                    href={`/count/${a.code}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                    className="pop card block text-tx no-underline"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold">{a.name}</h3>
                      <Chevron />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="num text-2xl font-bold">{n(c.portalSum)}</div>
                        <div className="text-xs text-mu">{c.party} · sheets add up to</div>
                      </div>
                      <div>
                        <div className="num text-2xl font-bold text-am">{n(c.announced)}</div>
                        <div className="text-xs text-mu">{c.party} · announced</div>
                      </div>
                    </div>
                    <p className="mt-3 text-[15px] text-mu">{explainComparison(c, a)}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="eyebrow px-1 pb-2 pt-2">All {trail.areas.length} local governments</h2>
          <ul className="card rows !p-0">
            {trail.areas.map((a) => (
              <li key={a.code}>
                <Link href={`/count/${a.code}`} className="flex min-h-[64px] items-center gap-3 px-5 py-3 text-tx no-underline">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="num text-xs text-mu">
                      {n(a.coverage.read)} of {n(a.coverage.total)} sheets
                    </div>
                  </div>
                  {a.finding && <FindingPill finding={a.finding} />}
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="px-1 text-xs text-mu">
          A sum of published sheets is working shown as evidence. It is not a result and names no winner. Source:{" "}
          <a className="text-gr underline-offset-2 hover:underline" href={currentElection.sourceUrl}>
            {currentElection.source}
          </a>
          . Announced figures: {currentElection.announcedSource.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}
