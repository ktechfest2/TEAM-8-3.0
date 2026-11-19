import { ask } from "@/lib/notes";
import { LANGS, type Lang } from "@/lib/types";

export const dynamic = "force-dynamic";
// Live research runs for a few minutes on a local machine.
export const maxDuration = 300;

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  let body: { question?: unknown; lang?: unknown; about?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";
  const about = typeof body.about === "string" && /^\d{2}(\/\d{2}){1,2}$/.test(body.about) ? body.about : undefined;
  const lang: Lang = (LANGS as string[]).includes(body.lang as string) ? (body.lang as Lang) : "en";
  if (!question && !about) return json({ error: "Ask a question" }, 400);
  return json(await ask({ question, lang, about }));
}
