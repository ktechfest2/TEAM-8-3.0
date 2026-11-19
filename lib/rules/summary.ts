import type { LiveReport, LiveReportCounts, PollingUnit } from "@/lib/types";
import { countLiveReports } from "./liveReports";

export interface UnitSummary {
  unit: PollingUnit;
  counts: LiveReportCounts;
  firstReportAt: string | null;
  lastReportAt: string | null;
}

/** What voters have reported at one polling unit, built only from counts. Pure. */
export function summarizeUnit(unit: PollingUnit, liveReports: LiveReport[]): UnitSummary {
  const times = liveReports.map((r) => r.createdAt).sort();
  return {
    unit,
    counts: countLiveReports(liveReports),
    firstReportAt: times[0] ?? null,
    lastReportAt: times[times.length - 1] ?? null,
  };
}
