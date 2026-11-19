import type { Metadata } from "next";
import { getDeps } from "@/lib/context";
import { parseFilter, resultLabel } from "@/lib/newsroom";
import { newsroomSummaries } from "@/lib/queries";
import type { UnitSummary } from "@/lib/rules/summary";

export const metadata: Metadata = { title: "Newsroom · Tally" };
export const dynamic = "force-dynamic";

const time = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", timeStyle: "short" }).format(new Date(iso)) : "–";

function tone(s: UnitSummary): "ok" | "warn" | "none" {
  if (s.resultStatus === "consensus_matches") return "ok";
  if (s.resultStatus === "consensus_unmatched" || s.resultStatus === "submissions_differ") return "warn";
  return "none";
}
const DOT = { ok: "bg-gr", warn: "bg-am", none: "bg-ln" };

function Stat({ label, n }: { label: string; n: number }) {
  return (
    <div>
      <div className={`font-display text-2xl font-semibold ${n === 1 ? "text-am" : ""}`}>{n}</div>
      <div className="text-xs text-mu">
        {label}
        {n === 1 && " · unverified"}
      </div>
    </div>
  );
}

export default async function NewsroomPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const deps = await getDeps();
  const filter = parseFilter(await searchParams);
  const [states, allUnits, rows] = await Promise.all([
    deps.store.listStates(),
    deps.store.listUnits(filter.state ? { state: filter.state } : {}),
    newsroomSummaries(deps, filter),
  ]);
  const qs = new URLSearchParams();
  if (filter.state) qs.set("state", filter.state);
  if (filter.unitCode) qs.set("unit", filter.unitCode);

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Newsroom</h1>
          <p className="mt-2 text-mu">Voter reports by polling unit. Counts, not claims.</p>
        </div>
        <a className="text-sm font-semibold text-gr hover:underline" href={`/api/newsroom/csv${qs.size ? `?${qs}` : ""}`} download>
          Export CSV ↓
        </a>
      </div>

      <form method="get" className="mt-8 flex flex-wrap gap-2">
        <label htmlFor="state" className="sr-only">State</label>
        <select id="state" name="state" defaultValue={filter.state ?? ""} className="field w-auto">
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label htmlFor="unit" className="sr-only">Polling unit</label>
        <select id="unit" name="unit" defaultValue={filter.unitCode ?? ""} className="field w-auto">
          <option value="">All units</option>
          {allUnits.map((u) => (
            <option key={u.code} value={u.code}>
              {u.code}
            </option>
          ))}
        </select>
        <button className="btn py-2" type="submit">
          Filter
        </button>
      </form>

      <ul className="mt-6 divide-y divide-ln border-y border-ln">
        {rows.map((s) => (
          <li key={s.unit.code} className="grid gap-4 py-6 md:grid-cols-[1.2fr_1.3fr_1.5fr] md:items-center">
            <div>
              <div className="font-semibold">{s.unit.name}</div>
              <div className="text-sm text-mu">
                {s.unit.state} · {s.unit.code}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="arrived" n={s.counts.arrived} />
              <Stat label="accreditation" n={s.counts.accred} />
              <Stat label="long queue" n={s.counts.queue} />
            </div>
            <div className="text-[15px]">
              <div className="flex items-start gap-2">
                <span className={`mt-2 size-2.5 shrink-0 rounded-full ${DOT[tone(s)]}`} aria-hidden />
                <span>{resultLabel(s)}</span>
              </div>
              <div className="mt-1 pl-[18px] text-xs text-mu">
                {s.photos > 0 ? `📷 ${s.photos} · ` : ""}
                {s.lastReportAt ? `last report ${time(s.lastReportAt)} WAT` : "no reports yet"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
