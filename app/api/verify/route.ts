import { verifyChain } from "@/lib/chain/hash";
import { getDeps } from "@/lib/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/verify: recompute the whole hash chain from genesis. */
export async function GET() {
  const deps = await getDeps();
  const rows = await deps.store.listResults();
  const report = verifyChain(rows);
  return Response.json(
    { ...report, checkedAt: new Date().toISOString(), firstBreakSeq: report.breaks[0] ? rows[report.breaks[0].index].seq : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
