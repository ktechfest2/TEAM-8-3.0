import { explainComparison, n, PARTY_NAME } from "@/lib/count/explain";
import type { AreaTrail, PartyComparison } from "@/lib/count/trail";
import { FindingPill } from "./ui";

/**
 * One party in one area: the portal sum and the announced result as two bars on the same scale,
 * then a sentence saying what the difference does and does not show.
 */
export function Comparison({ c, area, scale }: { c: PartyComparison; area: AreaTrail; scale: number }) {
  const w = (v: number) => `${Math.max(1.5, (v / scale) * 100)}%`;
  return (
    <section className="py-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{PARTY_NAME[c.party]}</h3>
        <FindingPill finding={c.finding} />
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <div className="flex justify-between">
            <dt className="text-mu">Sheets add up to</dt>
            <dd className="num font-semibold">{n(c.portalSum)}</dd>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-bg">
            <div className="grow-x h-full rounded-full bg-tx" style={{ width: w(c.portalSum) }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between">
            <dt className="text-mu">Announced</dt>
            <dd className="num font-semibold">{n(c.announced)}</dd>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-bg">
            <div className="grow-x h-full rounded-full bg-ac" style={{ width: w(c.announced) }} />
          </div>
        </div>
      </dl>
      <p className="mt-3 text-[15px] text-mu">{explainComparison(c, area)}</p>
    </section>
  );
}

export function comparisonScale(area: AreaTrail): number {
  return Math.max(1, ...area.comparisons.flatMap((c) => [c.portalSum, c.announced]));
}
