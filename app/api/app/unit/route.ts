import { getDeps } from "@/lib/context";
import { checkReadiness, sendLiveReport, voterFrom } from "@/lib/myUnit";
import { unitSummary } from "@/lib/queries";
import { LIVE_REPORT_KINDS, type LiveReportKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/**
 * The app's view of "my unit". The voter is an anonymous id the app made up and keeps on the phone;
 * it is namespaced so it can never collide with a real phone number.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const id = typeof body.voter === "string" ? body.voter : "";
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return json({ error: "voter id is required" }, 400);
  const deps = await getDeps();
  const voter = await voterFrom(deps, `app:${id}`);

  if (body.action === "ready") {
    const last4 = typeof body.last4 === "string" ? body.last4 : "";
    if (!/^\d{4}$/.test(last4)) return json({ error: "Enter the last 4 digits of your card" }, 400);
    const r = await checkReadiness(deps, voter, last4);
    if (!r) return json({ found: false });
    return json({ found: true, readiness: r, summary: r.unit ? await unitSummary(deps, r.unit) : null });
  }

  const code = typeof body.code === "string" ? body.code : (voter.unitCode ?? "");
  const unit = code ? await deps.store.getUnit(code) : null;
  if (!unit) return json({ error: "Polling unit not found" }, 404);

  if (body.action === "report") {
    if (!(LIVE_REPORT_KINDS as string[]).includes(body.kind as string)) return json({ error: "Unknown report" }, 400);
    return json(await sendLiveReport(deps, voter, unit, body.kind as LiveReportKind));
  }
  return json({ summary: await unitSummary(deps, unit) });
}
