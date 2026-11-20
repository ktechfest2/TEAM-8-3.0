import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Comparison, comparisonScale } from "@/components/app/Comparison";
import { Chevron, CoverageBar, ScreenHeader } from "@/components/app/ui";
import { currentElection, currentTrail, currentUnits } from "@/lib/count/current";
import { coverageLine, n } from "@/lib/count/explain";
import { findArea, PARTIES, unitsIn, type AreaTrail, type PublishedUnit } from "@/lib/count/trail";

type Props = { params: Promise<{ code: string[] }> };

function load(segments: string[]): AreaTrail {
  if (segments.length < 2 || segments.length > 3 || !segments.every((s) => /^\d{2}$/.test(s))) notFound();
  const area = findArea(currentTrail(), segments.join("/"));
  if (!area || area.kind === "state") notFound();
  return area;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = load((await params).code);
  return { title: `${area.name} · After the results · Tallie` };
}

const SHEET_NOTE: Record<PublishedUnit["sheet"], string> = {
  read: "",
  not_uploaded: "No sheet on the portal",
  unreadable: "Sheet could not be read",
};

function PortalSum({ area }: { area: AreaTrail }) {
  return (
    <dl className="mt-3 grid grid-cols-4 gap-2">
      {PARTIES.map((p) => (
        <div key={p}>
          <dd className="num text-lg font-semibold">{n(area.portalSum[p])}</dd>
          <dt className="text-xs text-mu">{p}</dt>
        </div>
      ))}
    </dl>
  );
}

export default async function AreaPage({ params }: Props) {
  const area = load((await params).code);
  const lgaCode = area.code.slice(0, 5);

  if (area.kind === "lga") {
    const scale = comparisonScale(area);
    return (
      <div className="pb-8">
        <ScreenHeader title={area.name} sub={`Local government · ${currentElection.state.name} State`} back={{ href: "/count", label: "Results" }} />
        <div className="space-y-4 px-4">
          {area.finding === "unexplained" && (
            <Link href={`/ask?about=${encodeURIComponent(area.code)}`} className="btn w-full">
              See what was reported about this
            </Link>
          )}

          <section className="card">
            <CoverageBar read={area.coverage.read} total={area.coverage.total} />
            <p className="num mt-2 text-sm font-medium">{coverageLine(area)}</p>
          </section>

          <section className="card rows !py-1">
            {area.comparisons.map((c) => (
              <Comparison key={c.party} c={c} area={area} scale={scale} />
            ))}
          </section>

          <details className="group card overflow-hidden !p-0">
            <summary className="flex min-h-[60px] cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex-1 text-lg font-semibold">{area.areas.length} wards</span>
              <span className="text-sm text-mu group-open:hidden">Show</span>
              <span className="hidden text-sm text-mu group-open:inline">Hide</span>
            </summary>
            <p className="border-t border-ln px-5 py-3 text-sm text-mu">
              Ward results are never announced publicly, so these sums have nothing to be compared with.
            </p>
            <ul className="rows border-t border-ln">
              {area.areas.map((w) => (
                <li key={w.code}>
                  <Link href={`/count/${w.code}`} className="flex min-h-[64px] items-center gap-3 px-5 py-3 text-tx no-underline">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{w.name}</div>
                      <div className="num text-xs text-mu">
                        {n(w.coverage.read)} of {n(w.coverage.total)} sheets · {PARTIES.map((p) => `${p} ${n(w.portalSum[p])}`).join(" · ")}
                      </div>
                    </div>
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    );
  }

  const lga = findArea(currentTrail(), lgaCode)!;
  const units = unitsIn(currentUnits(), area.code);
  return (
    <div className="pb-8">
      <ScreenHeader title={area.name} sub={`Ward · ${lga.name}`} back={{ href: `/count/${lgaCode}`, label: lga.name }} />
      <div className="space-y-4 px-4">
        <section className="card">
          <p className="eyebrow">Sheets in this ward add up to</p>
          <PortalSum area={area} />
          <div className="mt-4">
            <CoverageBar read={area.coverage.read} total={area.coverage.total} />
            <p className="num mt-2 text-sm font-medium">{coverageLine(area)}</p>
          </div>
        </section>

        <section>
          <h2 className="eyebrow px-1 pb-2 pt-2">{units.length} polling units</h2>
          <ul className="card rows !p-0">
            {units.map((u) => (
              <li key={u.code} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0 font-medium">{u.name}</div>
                  <div className="num shrink-0 text-xs text-mu">{u.code}</div>
                </div>
                {u.figures ? (
                  <div className="num mt-1 text-sm text-mu">
                    {PARTIES.map((p) => `${p} ${n(u.figures![p])}`).join(" · ")}
                    {u.sheetUrl && (
                      <>
                        {" · "}
                        <a className="font-medium text-gr underline-offset-2 hover:underline" href={u.sheetUrl} target="_blank" rel="noreferrer">
                          See the sheet
                        </a>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-am">
                    {SHEET_NOTE[u.sheet]} · {n(u.registered)} registered voters
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
