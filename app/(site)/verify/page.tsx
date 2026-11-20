import type { Metadata } from "next";
import { RIVERS_2023 } from "@/lib/count/rivers2023";
import { RIVERS_2023_SEAL, verifyRivers2023 } from "@/lib/log/rivers2023";

export const metadata: Metadata = { title: "Verify the log · Tallie" };
export const dynamic = "force-dynamic";

const short = (h: string) => `${h.slice(0, 12)}…`;
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export default function VerifyPage() {
  const report = verifyRivers2023();
  const broken = report.checkpoints.find((c) => c.areaCode === report.firstBreak);

  return (
    <div className="py-10">
      <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Verify the log</h1>
      <p className="mt-2 max-w-[36em] text-mu">
        The log records what the results portal showed for every polling unit, each entry chained to the one before it. Change,
        remove or reorder any entry and the chain no longer matches its seal.
      </p>

      <div className={`mt-8 flex items-center gap-3 text-lg ${report.ok ? "card-ok" : "card-warn"}`} role="status">
        <span aria-hidden>{report.ok ? "✓" : "!"}</span>
        {report.ok ? (
          <span>
            <b>Log intact.</b> {report.length.toLocaleString("en-NG")} entries match the seal.
          </span>
        ) : (
          <span>
            <b>The log no longer matches its seal</b>
            {broken ? `, starting in ${broken.name}` : ""}. Needs review.
          </span>
        )}
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
        <div>
          <dt className="text-sm text-mu">Entries</dt>
          <dd>
            {report.length.toLocaleString("en-NG")} polling units, {RIVERS_2023.state.name} State, {RIVERS_2023.election}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-mu">Sealed</dt>
          <dd>{when(RIVERS_2023_SEAL.sealedAt)} WAT</dd>
        </div>
        <div>
          <dt className="text-sm text-mu">Head now</dt>
          <dd className="mono">{short(report.head)}</dd>
        </div>
        <div>
          <dt className="text-sm text-mu">Head when sealed</dt>
          <dd className="mono">{short(report.expectedHead)}</dd>
        </div>
      </dl>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[15px]">
          <thead className="text-sm text-mu">
            <tr className="border-b border-ln">
              <th className="py-2 pr-3 font-semibold">Local government</th>
              <th className="py-2 pr-3 font-semibold">Entries</th>
              <th className="py-2 font-semibold">
                <span className="sr-only">Check</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {report.checkpoints.map((c) => (
              <tr key={c.areaCode} className="border-b border-ln">
                <td className="py-2 pr-3">{c.name}</td>
                <td className="py-2 pr-3">{c.units.toLocaleString("en-NG")}</td>
                <td className={`py-2 font-semibold ${c.ok ? "text-gr" : "text-am"}`}>{c.ok ? "✓" : "Does not match"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-mu">Figures: {RIVERS_2023.source}.</p>
    </div>
  );
}
