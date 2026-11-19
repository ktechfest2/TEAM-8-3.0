import { FIGURE_KEYS, type ResultFigures } from "@/lib/types";

export interface FieldDiff {
  field: keyof ResultFigures;
  reported: number;
  published: number;
}

export type Comparison =
  | { status: "matches" }
  | { status: "unmatched"; diffs: FieldDiff[] }
  | { status: "not_published" };

/** Field-by-field comparison. "unmatched" means "needs review", never an accusation. */
export function compareWithPublished(reported: ResultFigures, published: ResultFigures | null): Comparison {
  if (!published) return { status: "not_published" };
  const diffs: FieldDiff[] = [];
  for (const k of FIGURE_KEYS) {
    if (reported[k] !== published[k]) diffs.push({ field: k, reported: reported[k], published: published[k] });
  }
  return diffs.length ? { status: "unmatched", diffs } : { status: "matches" };
}
