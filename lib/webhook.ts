import { handleMessage } from "@/lib/commands/handle";
import { getDeps } from "@/lib/context";
import { isValidTwilioSignature } from "@/lib/providers/twilioSignature";

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const twiml = (body: string, status = 200) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Twilio signs the public URL it called. Behind a proxy, set PUBLIC_BASE_URL so we rebuild the same URL. */
function publicUrl(req: Request): string {
  const u = new URL(req.url);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}${u.pathname}${u.search}` : u.toString();
}

/**
 * Shared by /api/whatsapp and /api/sms.
 * - JSON body  = the in-app simulator ({ from: "sim:...", text, hasPhoto }). Reply comes back as JSON.
 * - Form body  = a Twilio webhook (WhatsApp or SMS). Must carry a valid X-Twilio-Signature.
 */
export async function handleWebhook(req: Request): Promise<Response> {
  const type = req.headers.get("content-type") ?? "";

  if (type.includes("application/json")) {
    if (process.env.SIMULATOR_ENABLED === "false") return json({ error: "Simulator is disabled" }, 403);
    let body: { from?: unknown; text?: unknown; hasPhoto?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const from = typeof body.from === "string" ? body.from : "";
    // Simulator senders are namespaced so the open demo endpoint can never pose as a real phone number.
    if (!/^sim:[A-Za-z0-9_-]{4,64}$/.test(from)) return json({ error: "from must look like sim:<id>" }, 400);
    if (typeof body.text !== "string") return json({ error: "text is required" }, 400);
    const deps = await getDeps();
    const out = await handleMessage(deps, { from, text: body.text, hasPhoto: body.hasPhoto === true });
    await deps.messaging.send(from, out.reply).catch(() => undefined); // console in the simulator
    return json({ ...out, store: deps.store.kind, warnings: deps.warnings });
  }

  if (type.includes("application/x-www-form-urlencoded")) {
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!token) return new Response("Twilio webhook is not configured (TWILIO_AUTH_TOKEN missing)", { status: 503 });
    const form = await req.formData();
    const params: Record<string, string> = {};
    form.forEach((v, k) => {
      if (typeof v === "string") params[k] = v;
    });
    if (!isValidTwilioSignature(token, publicUrl(req), params, req.headers.get("x-twilio-signature"))) {
      return new Response("Invalid signature", { status: 403 });
    }
    const from = params.From ?? "";
    if (!from) return new Response("Missing From", { status: 400 });

    const deps = await getDeps();
    // Photos: we only record that one was attached. Media is never downloaded or stored (no face blurring yet).
    const out = await handleMessage(deps, {
      from,
      text: params.Body ?? "",
      hasPhoto: Number.parseInt(params.NumMedia ?? "0", 10) > 0,
    });

    if (deps.messaging.name === "twilio") {
      try {
        await deps.messaging.send(from, out.reply);
        return twiml("");
      } catch (e) {
        console.error("[tally] Twilio send failed, replying inline instead:", (e as Error).message);
      }
    }
    return twiml(`<Message>${xmlEscape(out.reply)}</Message>`);
  }

  return json({ error: "Unsupported content type" }, 415);
}
