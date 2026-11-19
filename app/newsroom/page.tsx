import type { Metadata } from "next";
import { getDeps } from "@/lib/context";
import { parseFilter } from "@/lib/newsroom";
import { newsroomSummaries } from "@/lib/queries";

export const metadata: Metadata = { title: "Newsroom · Tally" };
export const dynamic = "force-dynamic";

const time = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", timeStyle: "short" }).format(new Date(iso)) : "–";

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
  const [lgas, reported, rows] = await Promise.all([
    deps.store.listLgas(),
    newsroomSummaries(deps, { lga: filter.lga }),
    newsroomSummaries(deps, filter),
  ]);
  const qs = new URLSearchParams();
  if (filter.lga) qs.set("lga", filter.lga);
  if (filter.unitCode) qs.set("unit", filter.unitCode);

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Newsroom</h1>
          <p className="mt-2 text-mu">Live reports from voters, by polling unit. Counts, not confirmed facts.</p>
        </div>
        <a className="text-sm font-semibold text-gr hover:underline" href={`/api/newsroom/csv${qs.size ? `?${qs}` : ""}`} download>
          Export CSV ↓
        </a>
      </div>

      <form method="get" className="mt-8 flex flex-wrap gap-2">
        <label htmlFor="lga" className="sr-only">
          Local government
        </label>
        <select id="lga" name="lga" defaultValue={filter.lga ?? ""} className="field w-auto">
          <option value="">All local governments</option>
          {lgas.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <label htmlFor="unit" className="sr-only">
          Polling unit
        </label>
        <select id="unit" name="unit" defaultValue={filter.unitCode ?? ""} className="field w-auto">
          <option value="">All units with reports</option>
          {reported.map((s) => (
            <option key={s.unit.code} value={s.unit.code}>
              {s.unit.code} · {s.unit.name}
            </option>
          ))}
        </select>
        <button className="btn py-2" type="submit">
          Filter
        </button>
      </form>

      <ul className="mt-6 divide-y divide-ln border-y border-ln">
        {rows.map((s) => (
          <li key={s.unit.code} className="grid gap-4 py-6 md:grid-cols-[1.4fr_1.3fr_1fr] md:items-center">
            <div>
              <div className="font-semibold">{s.unit.name}</div>
              <div className="text-sm text-mu">
                {s.unit.ward}, {s.unit.lga} · {s.unit.code}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="arrived" n={s.counts.arrived} />
              <Stat label="accreditation" n={s.counts.accred} />
              <Stat label="long queue" n={s.counts.queue} />
            </div>
            <div className="text-sm text-mu">
              first report {time(s.firstReportAt)} · last {time(s.lastReportAt)} WAT
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="py-6 text-mu">No live reports yet for this selection.</li>}
      </ul>
    </div>
  );
}
