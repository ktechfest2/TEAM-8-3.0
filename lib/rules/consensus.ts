import { canonicalJson } from "@/lib/chain/canonical";
import type { ResultFigures, ResultRow } from "@/lib/types";

export const CONSENSUS_MIN = 2;

export type Consensus =
  | { status: "none"; submitters: 0 }
  /** Only one voter has sent figures: unverified. */
  | { status: "single"; submitters: 1; figures: ResultFigures }
  /** Two or more voters sent identical figures and no other group is as large. */
  | { status: "consensus"; submitters: number; agreeing: number; figures: ResultFigures }
  /** Several voters, but no set of figures has two or more voters and a clear lead. */
  | { status: "conflicting"; submitters: number; groups: number };

type Sub = Pick<ResultRow, "senderHash" | "figures">;

/**
 * The latest submission per sender counts (a voter may correct a typo); earlier ones stay in the log.
 * Rows must be in log order (ascending seq).
 */
export function latestPerSender(rows: Sub[]): ResultFigures[] {
  const latest = new Map<string, ResultFigures>();
  for (const r of rows) latest.set(r.senderHash, r.figures);
  return [...latest.values()];
}

export function findConsensus(rows: Sub[]): Consensus {
  const figs = latestPerSender(rows);
  if (figs.length === 0) return { status: "none", submitters: 0 };
  if (figs.length === 1) return { status: "single", submitters: 1, figures: figs[0] };

  const groups = new Map<string, { figures: ResultFigures; count: number }>();
  for (const f of figs) {
    const key = canonicalJson(f);
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { figures: f, count: 1 });
  }
  const sorted = [...groups.values()].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const tied = sorted.length > 1 && sorted[1].count === top.count;
  if (top.count >= CONSENSUS_MIN && !tied) {
    return { status: "consensus", submitters: figs.length, agreeing: top.count, figures: top.figures };
  }
  return { status: "conflicting", submitters: figs.length, groups: groups.size };
}
