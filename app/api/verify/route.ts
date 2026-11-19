import { RIVERS_2023_SEAL, verifyRivers2023 } from "@/lib/log/rivers2023";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/verify: recompute the Log from the published results and check it against the seal. */
export async function GET() {
  const report = verifyRivers2023();
  return Response.json(
    { ...report, sealedAt: RIVERS_2023_SEAL.sealedAt, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
