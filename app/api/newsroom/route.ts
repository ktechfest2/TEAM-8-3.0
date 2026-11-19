import { getDeps } from "@/lib/context";
import { parseFilter } from "@/lib/newsroom";
import { newsroomSummaries } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/newsroom?lga=Obio/Akpor&unit=32/15/04/012: polling units with at least one live report. */
export async function GET(req: Request) {
  const deps = await getDeps();
  const filter = parseFilter(new URL(req.url).searchParams);
  const rows = await newsroomSummaries(deps, filter);
  return Response.json(
    {
      filter,
      mocked: { demoReports: deps.store.kind === "memory" },
      note: "Counts of voters' live reports, not confirmed facts. One report is unverified.",
      units: rows,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
