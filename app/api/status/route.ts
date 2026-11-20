import { systemStatus } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/status: whether the data, the research agent and its reading tools are connected on this machine. */
export async function GET() {
  return Response.json(await systemStatus(), { headers: { "Cache-Control": "no-store" } });
}
