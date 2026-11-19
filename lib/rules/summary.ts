import type { PollingUnit, ResultFigures, ResultRow, SignalCounts, SignalRow } from "@/lib/types";
import { compareWithPublished, type Comparison } from "./compare";
import { findConsensus, type Consensus } from "./consensus";
import { countSignals } from "./signals";

export type ResultStatus =
  | "no_submissions"
  | "single_unverified"
  | "submissions_differ"
  | "consensus_matches"
  | "consensus_unmatched"
  | "consensus_not_published";

export interface UnitSummary {
  unit: PollingUnit;
  counts: SignalCounts;
  submissions: number;
  photos: number;
  consensus: Consensus;
  comparison: Comparison | null;
  resultStatus: ResultStatus;
  firstReportAt: string | null;
  lastReportAt: string | null;
}

export function resultStatusOf(consensus: Consensus, comparison: Comparison | null): ResultStatus {
  switch (consensus.status) {
    case "none":
      return "no_submissions";
    case "single":
      return "single_unverified";
    case "conflicting":
      return "submissions_differ";
    case "consensus":
      if (!comparison || comparison.status === "not_published") return "consensus_not_published";
      return comparison.status === "matches" ? "consensus_matches" : "consensus_unmatched";
  }
}

/** Everything a journalist needs about one unit, built only from counts. Pure. */
export function summarizeUnit(
  unit: PollingUnit,
  signals: SignalRow[],
  results: ResultRow[],
  published: ResultFigures | null,
): UnitSummary {
  const consensus = findConsensus(results);
  const comparison = consensus.status === "consensus" ? compareWithPublished(consensus.figures, published) : null;
  const times = [...signals.map((s) => s.createdAt), ...results.map((r) => r.createdAt)].sort();
  return {
    unit,
    counts: countSignals(signals),
    submissions: results.length,
    photos: results.filter((r) => r.hasPhoto).length,
    consensus,
    comparison,
    resultStatus: resultStatusOf(consensus, comparison),
    firstReportAt: times[0] ?? null,
    lastReportAt: times[times.length - 1] ?? null,
  };
}
