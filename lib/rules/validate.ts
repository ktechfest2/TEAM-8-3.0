import { FIGURE_KEYS, type ResultFigures } from "@/lib/types";

export type ValidationIssue =
  | { code: "not_whole_number"; field: keyof ResultFigures }
  | { code: "total_exceeds_accredited"; total: number; accredited: number }
  | { code: "accredited_exceeds_registered"; accredited: number; registered: number };

export function sumVotes(f: ResultFigures): number {
  return f.A + f.B + f.C + f.D + f.rejected;
}

/**
 * Arithmetic check on a result sheet: party votes + rejected <= accredited <= registered.
 * Pure and deterministic. An empty array means the figures are internally consistent.
 */
export function validateResult(f: ResultFigures, registered: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const k of FIGURE_KEYS) {
    if (!Number.isInteger(f[k]) || f[k] < 0) issues.push({ code: "not_whole_number", field: k });
  }
  if (issues.length) return issues;
  const total = sumVotes(f);
  if (total > f.accredited) issues.push({ code: "total_exceeds_accredited", total, accredited: f.accredited });
  if (f.accredited > registered) {
    issues.push({ code: "accredited_exceeds_registered", accredited: f.accredited, registered });
  }
  return issues;
}
