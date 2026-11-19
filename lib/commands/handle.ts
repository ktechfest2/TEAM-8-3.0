import type { Deps } from "@/lib/context";
import { t, type Messages } from "@/lib/i18n/messages";
import { unitSummary } from "@/lib/queries";
import { checkReadiness, sendLiveReport, voterFrom } from "@/lib/myUnit";
import { LIVE_REPORT_KINDS, type Lang, type PollingUnit, type Sender } from "@/lib/types";
import { parseCommand, type Command } from "./parse";

export interface Inbound {
  /** Raw channel address ("whatsapp:+234...", "+234...", or "sim:<id>"). Hashed immediately. */
  from: string;
  text: string;
}

export interface Outbound {
  reply: string;
  lang: Lang;
  command: Command["kind"];
}

const MAX_TEXT = 500;

/** The single entry point for every channel: WhatsApp, SMS and the simulator. */
export async function handleMessage(deps: Deps, msg: Inbound): Promise<Outbound> {
  const sender = await voterFrom(deps, msg.from);
  const cmd = parseCommand(String(msg.text ?? "").slice(0, MAX_TEXT));
  const lines = await run(deps, sender, cmd);
  const lang = cmd.kind === "lang" ? cmd.lang : sender.lang;
  return { reply: lines.join("\n"), lang, command: cmd.kind };
}

/** Works out which unit a command is about: an explicit code wins, else the voter's remembered unit. */
async function resolveUnit(
  deps: Deps,
  sender: Sender,
  explicit: string | undefined,
  m: Messages,
): Promise<{ unit: PollingUnit } | { error: string }> {
  const code = explicit ?? sender.unitCode;
  if (!code) return { error: m.unitUnknown() };
  const unit = await deps.store.getUnit(code);
  if (!unit) return { error: m.unitCodeNotFound(code) };
  if (explicit && explicit !== sender.unitCode) {
    await deps.store.upsertSender({ ...sender, unitCode: explicit });
  }
  return { unit };
}

async function liveLines(deps: Deps, unit: PollingUnit, m: Messages): Promise<string[]> {
  const s = await unitSummary(deps, unit);
  return [m.unitHeader(unit), ...LIVE_REPORT_KINDS.map((k) => m.liveReport(k, s.counts[k])), m.countsNote()];
}

async function run(deps: Deps, sender: Sender, cmd: Command): Promise<string[]> {
  const m = t(sender.lang);

  switch (cmd.kind) {
    case "help":
      return [m.help()];

    case "error":
      return [m.parseError(cmd.error)];

    case "lang":
      await deps.store.setSenderLang(sender.senderHash, cmd.lang);
      return [t(cmd.lang).langSet()];

    case "ready": {
      const r = await checkReadiness(deps, sender, cmd.last4);
      if (!r) return [m.cardNotFound()];
      if (!r.unit) return [m.cardReady(r.cardReady), m.unitCodeNotFound(r.assignedCode)];
      return [m.cardReady(r.cardReady), r.moved ? m.unitMoved(r.unit, r.note) : m.unitSame(r.unit), m.readyNext()];
    }

    case "unit": {
      const r = await resolveUnit(deps, sender, cmd.unitCode, m);
      if ("error" in r) return [r.error];
      return liveLines(deps, r.unit, m);
    }

    case "report": {
      const r = await resolveUnit(deps, sender, cmd.unitCode, m);
      if ("error" in r) return [r.error];
      const { counted } = await sendLiveReport(deps, sender, r.unit, cmd.report);
      return [counted ? m.reportCounted() : m.reportDuplicate(), ...(await liveLines(deps, r.unit, m))];
    }
  }
}
