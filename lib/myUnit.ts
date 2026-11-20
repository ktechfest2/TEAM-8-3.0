import type { Deps } from "@/lib/context";
import { unitSummary } from "@/lib/queries";
import type { UnitSummary } from "@/lib/rules/summary";
import { hashSender } from "@/lib/senders";
import type { LiveReportKind, PollingUnit, Sender } from "@/lib/types";

/**
 * A voter and their polling unit: the readiness check, the unit Tallie remembers for them, and their live reports.
 * The chat channels (WhatsApp, SMS) and the app both go through here, so the rules live in one place.
 */

export interface Readiness {
  cardReady: boolean;
  /** Null when the card points at a polling unit Tallie does not know. */
  unit: PollingUnit | null;
  assignedCode: string;
  /** True when the voter's polling unit changed since they registered. */
  moved: boolean;
  note: string | null;
}

/** Finds the voter behind a channel address, or a new one. The address is hashed at once and never kept. */
export async function voterFrom(deps: Deps, address: string): Promise<Sender> {
  const senderHash = hashSender(address, deps.salt);
  return (await deps.store.getSender(senderHash)) ?? { senderHash, unitCode: null, lang: "en" };
}

/** The readiness check. Remembers the voter's polling unit, never the card digits. Null means no such card. */
export async function checkReadiness(deps: Deps, voter: Sender, last4: string): Promise<Readiness | null> {
  const card = await deps.voterLookup.lookupCard(last4);
  if (!card) return null;
  const unit = await deps.store.getUnit(card.assignedUnit);
  if (unit) await deps.store.upsertSender({ ...voter, unitCode: unit.code });
  return { cardReady: card.ready, unit, assignedCode: card.assignedUnit, moved: Boolean(card.previousUnit), note: card.note };
}

/** Adds the voter's live report. Each voter counts once per kind of report per polling unit. */
export async function sendLiveReport(
  deps: Deps,
  voter: Sender,
  unit: PollingUnit,
  kind: LiveReportKind,
): Promise<{ counted: boolean; summary: UnitSummary }> {
  const counted = await deps.store.addLiveReport(unit.code, kind, voter.senderHash);
  return { counted, summary: await unitSummary(deps, unit) };
}
