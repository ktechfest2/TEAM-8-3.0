import { handleWebhook } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Twilio WhatsApp webhook and the in-app simulator share this handler. */
export async function POST(req: Request) {
  return handleWebhook(req);
}
