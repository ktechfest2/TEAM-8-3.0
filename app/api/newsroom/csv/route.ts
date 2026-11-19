import { getDeps } from "@/lib/context";
import { parseFilter, toCsv } from "@/lib/newsroom";
import { newsroomSummaries } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/newsroom/csv?state=Lagos&unit=LA03-007 */
export async function GET(req: Request) {
  const deps = await getDeps();
  const filter = parseFilter(new URL(req.url).searchParams);
  const csv = toCsv(await newsroomSummaries(deps, filter));
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tally-newsroom-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
