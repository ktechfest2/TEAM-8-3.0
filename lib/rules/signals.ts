import { SIGNALS, type Signal, type SignalCounts, type SignalRow } from "@/lib/types";

/** Reports from this many distinct voters are shown as "reported"; fewer is "unverified". */
export const VERIFIED_MIN = 2;

export function emptyCounts(): SignalCounts {
  return { arrived: 0, accred: 0, queue: 0 };
}

/** Counts distinct senders per signal. The DB already enforces one row per sender; this is defensive. */
export function countSignals(rows: Pick<SignalRow, "signal" | "senderHash">[]): SignalCounts {
  const seen: Record<Signal, Set<string>> = { arrived: new Set(), accred: new Set(), queue: new Set() };
  for (const r of rows) seen[r.signal]?.add(r.senderHash);
  const out = emptyCounts();
  for (const s of SIGNALS) out[s] = seen[s].size;
  return out;
}

export type Confidence = "none" | "unverified" | "reported";

/** 0 reports: none. 1 reporter: unverified. 2+ independent reporters: reported (still never "confirmed"). */
export function confidence(count: number): Confidence {
  if (count <= 0) return "none";
  if (count < VERIFIED_MIN) return "unverified";
  return "reported";
}
