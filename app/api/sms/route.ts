import { handleWebhook } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Twilio SMS webhook. Same handler, same commands, same replies as WhatsApp. */
export async function POST(req: Request) {
  return handleWebhook(req);
}
