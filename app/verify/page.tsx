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
    <div className="py-8">
      <h1 className="text-[clamp(30px,5vw,44px)] font-extrabold">Verify the log</h1>
      <p className="mt-3 max-w-[40em] text-mu">
        Every result submission is chained to the one before it: each entry stores{" "}
        <code className="mono">SHA-256(previous hash + canonical JSON of the entry)</code>. This page recomputes the whole chain
        from the start. If anyone edits, deletes or reorders an entry in the database, the chain breaks at that point.
      </p>

      <div className={`mt-6 text-[17px] ${report.ok ? "card-ok" : "card-warn"}`} role="status">
        {report.ok ? (
          <>
            <b>Chain intact.</b> {report.length} entr{report.length === 1 ? "y" : "ies"} recomputed, no breaks. Head:{" "}
            <span className="mono">{report.head}</span>
          </>
        ) : (
          <>
            <b>Chain break found, needs review.</b> {report.breaks.length} problem{report.breaks.length === 1 ? "" : "s"}, first at
            log entry #{rows[report.breaks[0].index].seq} ({report.breaks[0].kind === "hash_mismatch" ? "contents changed" : "link to previous entry changed"}).
          </>
        )}
      </div>

      <p className="mt-3 text-sm text-mu">
        Machine-readable: <a className="text-gr underline" href="/api/verify">/api/verify</a>. The chain is appended under a database
        lock, and each hash can have only one successor, so concurrent writes cannot fork it.
      </p>

      <h2 className="mt-8 text-2xl font-semibold">Latest entries</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
          <thead className="text-sm text-mu">
            <tr className="border-b border-ln">
              <th className="py-2 pr-3 font-semibold">#</th>
              <th className="py-2 pr-3 font-semibold">Unit</th>
              <th className="py-2 pr-3 font-semibold">Figures (A, B, C, D, rej, acc)</th>
              <th className="py-2 pr-3 font-semibold">Previous</th>
              <th className="py-2 pr-3 font-semibold">Hash</th>
              <th className="py-2 font-semibold">Check</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(({ r, i }) => (
              <tr key={r.seq} className="border-b border-ln">
                <td className="py-2 pr-3">{r.seq}</td>
                <td className="py-2 pr-3">{r.unitCode}</td>
                <td className="py-2 pr-3 font-mono text-[13px]">{FIGURE_KEYS.map((k) => r.figures[k]).join(", ")}</td>
                <td className="mono py-2 pr-3">{short(r.prevHash)}</td>
                <td className="mono py-2 pr-3">{short(r.hash)}</td>
                <td className={`py-2 font-semibold ${brokenAt.has(i) ? "text-am" : "text-gr"}`}>{brokenAt.has(i) ? "Break" : "OK"}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-mu">
                  No entries yet. Send a RESULT from the <a className="text-gr underline" href="/simulator">simulator</a>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-mu">Sender ids are salted hashes and are not shown. Figures are demo data.</p>
    </div>
  );
}
