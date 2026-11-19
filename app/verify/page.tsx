import type { Metadata } from "next";
import { GENESIS_HASH, verifyChain } from "@/lib/chain/hash";
import { getDeps } from "@/lib/context";
import { FIGURE_KEYS } from "@/lib/types";

export const metadata: Metadata = { title: "Verify the log · Tally" };
export const dynamic = "force-dynamic";

const short = (h: string) => (h === GENESIS_HASH ? "genesis" : `${h.slice(0, 12)}…`);

export default async function VerifyPage() {
  const deps = await getDeps();
  const rows = await deps.store.listResults();
  const report = verifyChain(rows);
  const brokenAt = new Set(report.breaks.map((b) => b.index));
  const recent = rows.map((r, i) => ({ r, i })).slice(-25).reverse();

  return (
    <div className="py-10">
      <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Verify the log</h1>
      <p className="mt-2 max-w-[36em] text-mu">
        Each result is chained to the one before it. Edit, delete or reorder any entry and the chain breaks.
      </p>

      <div className={`mt-8 flex items-center gap-3 text-lg ${report.ok ? "card-ok" : "card-warn"}`} role="status">
        <span aria-hidden>{report.ok ? "✓" : "!"}</span>
        {report.ok ? (
          <span>
            <b>Chain intact.</b> {report.length} entr{report.length === 1 ? "y" : "ies"} checked.
          </span>
        ) : (
          <span>
            <b>Break found at entry #{rows[report.breaks[0].index].seq}</b>, needs review.
          </span>
        )}
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[15px]">
          <thead className="text-sm text-mu">
            <tr className="border-b border-ln">
              <th className="py-2 pr-3 font-semibold">#</th>
              <th className="py-2 pr-3 font-semibold">Unit</th>
              <th className="py-2 pr-3 font-semibold">A · B · C · D · rej · acc</th>
              <th className="hidden py-2 pr-3 font-semibold sm:table-cell">Hash</th>
              <th className="py-2 font-semibold"><span className="sr-only">Check</span></th>
            </tr>
          </thead>
          <tbody>
            {recent.map(({ r, i }) => (
              <tr key={r.seq} className="border-b border-ln">
                <td className="py-2 pr-3">{r.seq}</td>
                <td className="py-2 pr-3">{r.unitCode}</td>
                <td className="py-2 pr-3 font-mono text-[13px]">{FIGURE_KEYS.map((k) => r.figures[k]).join(" · ")}</td>
                <td className="mono hidden py-2 pr-3 sm:table-cell">{short(r.hash)}</td>
                <td className={`py-2 font-semibold ${brokenAt.has(i) ? "text-am" : "text-gr"}`}>{brokenAt.has(i) ? "Break" : "✓"}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-mu">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
