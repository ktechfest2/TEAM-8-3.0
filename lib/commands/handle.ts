import { appendSubmission } from "@/lib/chain/append";
import { canonicalJson } from "@/lib/chain/canonical";
import type { Deps } from "@/lib/context";
import { t, type Messages } from "@/lib/i18n/messages";
import { unitSummary } from "@/lib/queries";
import { compareWithPublished } from "@/lib/rules/compare";
import { findConsensus } from "@/lib/rules/consensus";
import { validateResult } from "@/lib/rules/validate";
import { hashSender, shortHash } from "@/lib/senders";
import { SIGNALS, type Lang, type PollingUnit, type Sender } from "@/lib/types";
import { parseCommand, type Command } from "./parse";

export interface Inbound {
  /** Raw channel address ("whatsapp:+234...", "+234...", or "sim:<id>"). Hashed immediately. */
  from: string;
  text: string;
  hasPhoto?: boolean;
}

export interface Outbound {
  reply: string;
  lang: Lang;
  command: Command["kind"];
}

const MAX_TEXT = 500;

/** The single entry point for every channel: WhatsApp, SMS and the simulator. */
export async function handleMessage(deps: Deps, msg: Inbound): Promise<Outbound> {
  const senderHash = hashSender(msg.from, deps.salt);
  const sender: Sender = (await deps.store.getSender(senderHash)) ?? { senderHash, unitCode: null, lang: "en" };
  const cmd = parseCommand(String(msg.text ?? "").slice(0, MAX_TEXT));
  const lines = await run(deps, sender, cmd, Boolean(msg.hasPhoto));
  const lang = cmd.kind === "lang" ? cmd.lang : sender.lang;
  return { reply: lines.join("\n"), lang, command: cmd.kind };
}

/** Works out which unit a command is about: an explicit code wins, else the sender's remembered unit. */
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
  const agreeing = s.consensus.status === "consensus" ? s.consensus.agreeing : 0;
  const diffs = s.comparison?.status === "unmatched" ? s.comparison.diffs : [];
  return [
    m.unitHeader(unit),
    ...SIGNALS.map((sig) => m.signal(sig, s.counts[sig])),
    m.resultStatus(s.resultStatus, agreeing, diffs),
    m.countsNote(),
  ];
}

async function run(deps: Deps, sender: Sender, cmd: Command, hasPhoto: boolean): Promise<string[]> {
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
      const card = await deps.voterLookup.lookupCard(cmd.last4);
      if (!card) return [m.cardNotFound()];
      const unit = await deps.store.getUnit(card.assignedUnit);
      if (!unit) return [m.cardReady(card.ready), m.unitCodeNotFound(card.assignedUnit)];
      // Remember the unit, not the card digits.
      await deps.store.upsertSender({ ...sender, unitCode: unit.code });
      return [
        m.cardReady(card.ready),
        card.previousUnit ? m.unitMoved(unit, card.note) : m.unitSame(unit),
        m.readyNext(),
      ];
    }

    case "unit": {
      const r = await resolveUnit(deps, sender, cmd.unitCode, m);
      if ("error" in r) return [r.error];
      return liveLines(deps, r.unit, m);
    }

    case "report": {
      const r = await resolveUnit(deps, sender, cmd.unitCode, m);
      if ("error" in r) return [r.error];
      const added = await deps.store.addSignal(r.unit.code, cmd.signal, sender.senderHash);
      return [added ? m.reportCounted() : m.reportDuplicate(), ...(await liveLines(deps, r.unit, m))];
    }

    case "result": {
      const r = await resolveUnit(deps, sender, cmd.unitCode, m);
      if ("error" in r) return [r.error];
      const { unit } = r;
      const issues = validateResult(cmd.figures, unit.registeredVoters);
      if (issues.length) return [m.resultInvalid(issues)];

      const row = await appendSubmission(deps.store, {
        unitCode: unit.code,
        senderHash: sender.senderHash,
        figures: cmd.figures,
        hasPhoto,
        createdAt: new Date().toISOString(),
      });
      const [published, all] = await Promise.all([
        deps.irev.publishedResult(unit.code),
        deps.store.listResults([unit.code]),
      ]);

      const cmp = compareWithPublished(cmd.figures, published);
      const own =
        cmp.status === "matches" ? m.resultMatches() : cmp.status === "unmatched" ? m.resultUnmatched(cmp.diffs) : m.resultNotPublished();

      const c = findConsensus(all);
      let crowd: string;
      if (c.status === "consensus") {
        crowd = canonicalJson(c.figures) === canonicalJson(cmd.figures) ? m.resultAgree(c.agreeing) : m.resultOthersDiffer(c.agreeing);
      } else if (c.status === "conflicting") {
        crowd = m.resultConflicting();
      } else {
        crowd = m.resultFirst();
      }
      return [m.resultLogged(shortHash(row.hash)), own, crowd];
    }
  }
}
