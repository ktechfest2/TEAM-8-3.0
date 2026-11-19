import type { Metadata } from "next";
import { getDeps } from "@/lib/context";
import { parseFilter, resultLabel, signalLabel } from "@/lib/newsroom";
import { newsroomSummaries } from "@/lib/queries";
import type { UnitSummary } from "@/lib/rules/summary";

export const metadata: Metadata = { title: "Newsroom · Tally" };
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) + " WAT"
    : "none";

const needsReview = (s: UnitSummary) =>
  s.resultStatus === "consensus_unmatched" || s.resultStatus === "submissions_differ" || s.resultStatus === "single_unverified";

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
  const csvHref = `/api/newsroom/csv${qs.size ? `?${qs}` : ""}`;

  return (
    <div className="py-8">
      <h1 className="text-[clamp(30px,5vw,44px)] font-extrabold">Newsroom</h1>
      <p className="mt-3 max-w-[40em] text-mu">
        The same voter reports, for journalists. Every item shows how many independent voters reported it, whether a photo was
        attached, and when. Nothing is presented as confirmed on the strength of one claim.
      </p>

      <div className="card-warn mt-5 text-[15px]">
        <b>Mock data.</b> Published figures are mock IReV data, and the reports come partly from seeded demo voters. Do not cite
        anything on this page as real.
      </div>

      <form method="get" className="panel mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div>
          <label htmlFor="state" className="block text-sm text-mu">
            State
          </label>
          <select id="state" name="state" defaultValue={filter.state ?? ""} className="field">
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm text-mu">
            Polling unit
          </label>
          <select id="unit" name="unit" defaultValue={filter.unitCode ?? ""} className="field">
            <option value="">All units</option>
            {allUnits.map((u) => (
              <option key={u.code} value={u.code}>
                {u.code} · {u.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">
          Filter
        </button>
        <a className="btn-o text-center" href={csvHref} download>
          Export CSV
        </a>
      </form>

      <p className="mt-6 text-sm text-mu" aria-live="polite">
        {rows.length} polling unit{rows.length === 1 ? "" : "s"}
        {filter.state ? ` in ${filter.state}` : ""}
        {filter.unitCode ? `, unit ${filter.unitCode}` : ""}. Counts are of reports, not confirmed facts. 1 report is unverified.
      </p>

      <ul className="mt-3 grid gap-4">
        {rows.map((s) => (
          <li key={s.unit.code} className="panel">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">
                {s.unit.state} · {s.unit.name}
              </h2>
              <span className="mono">
                {s.unit.code} · {s.unit.registeredVoters} registered
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
              {(
                [
                  ["Officials arrived", s.counts.arrived],
                  ["Accreditation started", s.counts.accred],
                  ["Long queue", s.counts.queue],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-lg border border-ln p-2">
                  <dt className="text-xs text-mu sm:text-sm">{label}</dt>
                  <dd className={`font-display text-xl font-semibold ${n === 1 ? "text-am" : ""}`}>{signalLabel(n)}</dd>
                </div>
              ))}
            </dl>

            <div className={`mt-3 text-[15px] ${needsReview(s) ? "card-warn" : s.resultStatus === "no_submissions" ? "rounded-[10px] border border-ln px-3.5 py-2.5" : "card-ok"}`}>
              <b>Result:</b> {resultLabel(s)}
            </div>

            <p className="mono mt-3">
              {s.submissions} result submission{s.submissions === 1 ? "" : "s"} from {s.consensus.submitters} voter
              {s.consensus.submitters === 1 ? "" : "s"} · {s.photos ? `${s.photos} with photo attached` : "no photo"} · first report{" "}
              {fmt(s.firstReportAt)} · last report {fmt(s.lastReportAt)}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-mu">
        Photos: the prototype only records that a photo was attached. It does not store or show images, because face and
        voter-detail blurring is not built yet. Every result submission is in the <a className="text-gr underline" href="/verify">hash-chained log</a>.
      </p>
    </div>
  );
}
