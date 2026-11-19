import { LIVE_REPORT_KINDS, type LiveReport, type LiveReportCounts, type LiveReportKind } from "@/lib/types";

/** Live reports from this many distinct voters are shown as "reported"; fewer is "unverified". */
export const REPORTED_MIN = 2;

export function emptyCounts(): LiveReportCounts {
  return { arrived: 0, accred: 0, queue: 0 };
}

/** Counts distinct voters per kind. The DB already enforces one row per voter; this is defensive. */
export function countLiveReports(rows: Pick<LiveReport, "kind" | "senderHash">[]): LiveReportCounts {
  const seen: Record<LiveReportKind, Set<string>> = { arrived: new Set(), accred: new Set(), queue: new Set() };
  for (const r of rows) seen[r.kind]?.add(r.senderHash);
  const out = emptyCounts();
  for (const k of LIVE_REPORT_KINDS) out[k] = seen[k].size;
  return out;
}

export type Confidence = "none" | "unverified" | "reported";

/** 0 reports: none. 1 voter: unverified. 2+ independent voters: reported (still never "confirmed"). */
export function confidence(count: number): Confidence {
  if (count <= 0) return "none";
  if (count < REPORTED_MIN) return "unverified";
  return "reported";
}
