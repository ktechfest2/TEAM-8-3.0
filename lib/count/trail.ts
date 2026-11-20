/**
 * The count trail: published polling-unit results added up through ward, local government and state,
 * with the portal sum set beside the announced result wherever one exists. Pure; no I/O.
 *
 * Vocabulary is from GLOSSARY.md. A portal sum is working shown as evidence, never a result (docs/adr/0001).
 */

export const PARTIES = ["APC", "LP", "PDP", "NNPP"] as const;
export type Party = (typeof PARTIES)[number];
export type PartyFigures = Record<Party, number>;

export type SheetState = "read" | "not_uploaded" | "unreadable";

/** One polling unit as the results portal shows it. `figures` is null when the sheet is missing or unreadable. */
export interface PublishedUnit {
  /** state/local government/ward/unit, e.g. "32/15/04/012" */
  code: string;
  name: string;
  ward: string;
  lga: string;
  registered: number;
  accredited: number | null;
  sheet: SheetState;
  figures: PartyFigures | null;
  sheetUrl: string | null;
}

export interface AnnouncedArea {
  code: string;
  name: string;
  figures: PartyFigures;
}

export interface Coverage {
  /** Polling units with a published result that could be read. */
  read: number;
  /** Polling units that exist in the area. */
  total: number;
  /** Registered voters in the units not read: the most votes those units could possibly add. */
  registeredMissing: number;
}

/**
 * - consistent: the portal sum and the announced result agree, within reading noise.
 * - open: they differ, but the units not read could account for it.
 * - unexplained: they differ by more than the units not read could account for.
 */
export type Finding = "consistent" | "open" | "unexplained";

export interface PartyComparison {
  party: Party;
  portalSum: number;
  announced: number;
  /** announced minus portal sum. Negative means the portal sum is already above the announced result. */
  gap: number;
  finding: Finding;
  /** Set only for an unexplained mismatch. */
  reason?: "sum_above_announced" | "gap_beyond_missing";
}

export type AreaKind = "state" | "lga" | "ward";

export interface AreaTrail {
  kind: AreaKind;
  code: string;
  name: string;
  coverage: Coverage;
  portalSum: PartyFigures;
  /** Null where nothing was announced publicly, which is always the case for a ward. */
  announced: PartyFigures | null;
  comparisons: PartyComparison[];
  /** The most serious finding among the comparisons, or null when there is nothing to compare. */
  finding: Finding | null;
  /** The areas one step down: local governments of a state, wards of a local government. */
  areas: AreaTrail[];
}

export interface CountTrailInput {
  state: { code: string; name: string };
  units: PublishedUnit[];
  /** Announced results by area code. A state's is derived from its local governments when all of them have one. */
  announced: AnnouncedArea[];
}

const zero = (): PartyFigures => ({ APC: 0, LP: 0, PDP: 0, NNPP: 0 });

function add(into: PartyFigures, f: PartyFigures) {
  for (const p of PARTIES) into[p] += f[p];
}

/**
 * How far two figures may differ before it counts as a mismatch. Published figures are read off photographed
 * sheets, so some difference is reading noise, and it grows with the number of sheets added up. The allowance is
 * deliberately generous: Tallie would sooner miss a small mismatch than flag noise as one.
 */
export function readingNoise(announced: number, sheetsRead: number): number {
  return Math.max(100, Math.round(announced * 0.1), Math.round(sheetsRead / 4));
}

function compare(party: Party, portalSum: number, announced: number, coverage: Coverage): PartyComparison {
  const gap = announced - portalSum;
  const noise = readingNoise(announced, coverage.read);
  const base = { party, portalSum, announced, gap };
  // Units not read can only add votes, so a partial sum above the announced result cannot be explained by them.
  if (-gap > noise) return { ...base, finding: "unexplained", reason: "sum_above_announced" };
  if (gap > coverage.registeredMissing + noise) return { ...base, finding: "unexplained", reason: "gap_beyond_missing" };
  if (Math.abs(gap) <= noise) return { ...base, finding: "consistent" };
  return { ...base, finding: "open" };
}

const RANK: Record<Finding, number> = { consistent: 0, open: 1, unexplained: 2 };

function finish(
  kind: AreaKind,
  code: string,
  name: string,
  units: PublishedUnit[],
  announced: PartyFigures | null,
  areas: AreaTrail[],
): AreaTrail {
  const portalSum = zero();
  const coverage: Coverage = { read: 0, total: units.length, registeredMissing: 0 };
  for (const u of units) {
    if (u.figures) {
      add(portalSum, u.figures);
      coverage.read++;
    } else coverage.registeredMissing += u.registered;
  }
  const comparisons = announced ? PARTIES.map((p) => compare(p, portalSum[p], announced[p], coverage)) : [];
  const finding = comparisons.reduce<Finding | null>((worst, c) => (worst === null || RANK[c.finding] > RANK[worst] ? c.finding : worst), null);
  return { kind, code, name, coverage, portalSum, announced, comparisons, finding, areas };
}

function groupBy<T>(items: T[], key: (t: T) => string): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const g = m.get(k);
    if (g) g.push(it);
    else m.set(k, [it]);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function buildCountTrail(input: CountTrailInput): AreaTrail {
  const announcedBy = new Map(input.announced.map((a) => [a.code, a.figures]));

  const lgas = groupBy(input.units, (u) => u.code.slice(0, 5)).map(([lgaCode, lgaUnits]) => {
    const wards = groupBy(lgaUnits, (u) => u.code.slice(0, 8)).map(([wardCode, wardUnits]) =>
      finish("ward", wardCode, wardUnits[0].ward, wardUnits, null, []),
    );
    return finish("lga", lgaCode, lgaUnits[0].lga, lgaUnits, announcedBy.get(lgaCode) ?? null, wards);
  });

  let stateAnnounced = announcedBy.get(input.state.code) ?? null;
  if (!stateAnnounced && lgas.length > 0 && lgas.every((l) => l.announced)) {
    stateAnnounced = zero();
    for (const l of lgas) add(stateAnnounced, l.announced!);
  }
  return finish("state", input.state.code, input.state.name, input.units, stateAnnounced, lgas);
}

/** Looks an area up by code anywhere in the trail. */
export function findArea(trail: AreaTrail, code: string): AreaTrail | null {
  if (trail.code === code) return trail;
  for (const a of trail.areas) {
    if (code === a.code || code.startsWith(`${a.code}/`)) {
      const hit = findArea(a, code);
      if (hit) return hit;
    }
  }
  return null;
}

/** The polling units of one area, in code order. */
export function unitsIn(units: PublishedUnit[], areaCode: string): PublishedUnit[] {
  return units.filter((u) => u.code === areaCode || u.code.startsWith(`${areaCode}/`));
}
