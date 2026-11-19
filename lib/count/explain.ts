import type { AreaTrail, Finding, Party, PartyComparison } from "./trail";

/** Plain-language wording for the count trail. A mismatch is described, never judged (GLOSSARY.md: Mismatch). */

export const n = (v: number) => new Intl.NumberFormat("en-NG").format(v);

export const FINDING_LABEL: Record<Finding, string> = {
  consistent: "Adds up",
  open: "Too few sheets to tell",
  unexplained: "Unexplained mismatch",
};

export const PARTY_NAME: Record<Party, string> = { APC: "APC", LP: "LP", PDP: "PDP", NNPP: "NNPP" };

export function coverageLine(area: AreaTrail): string {
  const { read, total } = area.coverage;
  return `${n(read)} of ${n(total)} result sheets read`;
}

/** One or two sentences a voter can read aloud about one party in one area. */
export function explainComparison(c: PartyComparison, area: AreaTrail): string {
  const missing = area.coverage.total - area.coverage.read;
  const sheets = `The result sheets on the portal add up to ${n(c.portalSum)} for ${PARTY_NAME[c.party]}`;
  switch (c.finding) {
    case "consistent":
      return `${sheets}, and ${n(c.announced)} was announced.`;
    case "open":
      return `${sheets}, and ${n(c.announced)} was announced. ${n(missing)} polling units have no readable sheet, which could account for the difference.`;
    case "unexplained":
      if (c.reason === "sum_above_announced") {
        return `${sheets}, but only ${n(c.announced)} was announced. Sheets that are still missing could only add votes, so they cannot explain this.`;
      }
      return `${sheets}, but ${n(c.announced)} was announced. The ${n(missing)} polling units with no readable sheet have ${n(area.coverage.registeredMissing)} registered voters between them, fewer than the difference of ${n(c.gap)}.`;
  }
}

/** The single most telling comparison in an area: the largest unexplained one, else the largest gap. */
export function headlineComparison(area: AreaTrail): PartyComparison | null {
  if (area.comparisons.length === 0) return null;
  const rank = (c: PartyComparison) => (c.finding === "unexplained" ? 2 : c.finding === "open" ? 1 : 0);
  return [...area.comparisons].sort((a, b) => rank(b) - rank(a) || Math.abs(b.gap) - Math.abs(a.gap))[0];
}

/** Areas with an unexplained mismatch, worst first. */
export function unexplainedAreas(trail: AreaTrail): AreaTrail[] {
  const size = (a: AreaTrail) => Math.max(0, ...a.comparisons.filter((c) => c.finding === "unexplained").map((c) => Math.abs(c.gap)));
  return trail.areas.filter((a) => a.finding === "unexplained").sort((a, b) => size(b) - size(a));
}
