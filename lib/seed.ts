import demo from "@/data/seed/demo_reports.json";
import units from "@/data/seed/polling_units.json";
import { appendSubmission } from "@/lib/chain/append";
import { hashSender } from "@/lib/senders";
import type { Store } from "@/lib/store/types";
import type { PollingUnit, ResultFigures, Signal } from "@/lib/types";

export const SEED_UNITS: PollingUnit[] = units;

/** 08:00 West Africa Time (07:00 UTC) on the given day: polls open. */
export function pollsOpen(day = new Date()): Date {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 7, 0, 0));
}

/**
 * MOCK reports from "other voters" so the demo has something to show. They go through the same
 * store and hash-chain code as live messages. Expects the units to exist already.
 */
export async function seedDemoReports(store: Store, salt: string, day = new Date()) {
  const base = pollsOpen(day).getTime();
  const at = (m: number) => new Date(base + m * 60_000).toISOString();
  let signals = 0;
  for (const s of demo.signals) {
    if (await store.addSignal(s.unit, s.signal as Signal, hashSender(s.sender, salt), at(s.minutesAfter8))) signals++;
  }
  const existing = await store.listResults();
  let results = 0;
  if (existing.length === 0) {
    for (const r of demo.results) {
      await appendSubmission(store, {
        unitCode: r.unit,
        senderHash: hashSender(r.sender, salt),
        figures: r.figures as ResultFigures,
        hasPhoto: r.hasPhoto,
        createdAt: at(r.minutesAfter8),
      });
      results++;
    }
  }
  return { signals, results, skippedResults: existing.length > 0 };
}
