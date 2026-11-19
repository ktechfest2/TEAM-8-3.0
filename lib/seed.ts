import demo from "@/data/seed/demo_reports.json";
import published from "@/data/rivers-2023/published.json";
import type { PublishedUnit } from "@/lib/count/trail";
import { hashSender } from "@/lib/senders";
import type { Store } from "@/lib/store/types";
import type { LiveReportKind, PollingUnit } from "@/lib/types";

/** REAL polling units: every unit in Rivers State (see data/rivers-2023/SOURCE.md). */
export const SEED_UNITS: PollingUnit[] = (published as PublishedUnit[]).map((u) => ({
  code: u.code,
  name: u.name,
  ward: u.ward,
  lga: u.lga,
  state: "Rivers",
  registeredVoters: u.registered,
}));

/** 08:00 West Africa Time (07:00 UTC) on the given day: polls open. */
export function pollsOpen(day = new Date()): Date {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 7, 0, 0));
}

/**
 * MOCK live reports from "other voters" so the demo has something to show. They go through the same
 * store as live messages. Expects the units to exist already. Safe to re-run: repeats are ignored.
 */
export async function seedDemoReports(store: Store, salt: string, day = new Date()) {
  const base = pollsOpen(day).getTime();
  const at = (m: number) => new Date(base + m * 60_000).toISOString();
  let liveReports = 0;
  for (const r of demo.liveReports) {
    if (await store.addLiveReport(r.unit, r.kind as LiveReportKind, hashSender(r.sender, salt), at(r.minutesAfter8))) liveReports++;
  }
  return { liveReports };
}
