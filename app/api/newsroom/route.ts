import { getDeps } from "@/lib/context";
import { parseFilter, resultLabel } from "@/lib/newsroom";
import { newsroomSummaries } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/newsroom?state=Lagos&unit=LA03-007 */
export async function GET(req: Request) {
  const deps = await getDeps();
  const filter = parseFilter(new URL(req.url).searchParams);
  const rows = await newsroomSummaries(deps, filter);
  return Response.json(
    {
      filter,
      mocked: { publishedResults: deps.irev.mocked, demoReports: deps.store.kind === "memory" },
      note: "Counts of voter reports, not confirmed facts. One report is unverified.",
      units: rows.map((s) => ({ ...s, resultLabel: resultLabel(s) })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
