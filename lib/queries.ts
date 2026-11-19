import type { Deps } from "@/lib/context";
import { summarizeUnit, type UnitSummary } from "@/lib/rules/summary";
import type { UnitFilter } from "@/lib/store/types";
import type { PollingUnit } from "@/lib/types";

export async function unitSummary(deps: Deps, unit: PollingUnit): Promise<UnitSummary> {
  const [signals, results, published] = await Promise.all([
    deps.store.listSignals([unit.code]),
    deps.store.listResults([unit.code]),
    deps.irev.publishedResult(unit.code),
  ]);
  return summarizeUnit(unit, signals, results, published);
}

/** All units matching the filter, summarised with three queries rather than three per unit. */
export async function newsroomSummaries(deps: Deps, filter: UnitFilter): Promise<UnitSummary[]> {
  const units = await deps.store.listUnits(filter);
  const codes = units.map((u) => u.code);
  const [signals, results, published] = await Promise.all([
    deps.store.listSignals(codes),
    deps.store.listResults(codes),
    Promise.all(codes.map((c) => deps.irev.publishedResult(c))),
  ]);
  return units.map((u, i) =>
    summarizeUnit(
      u,
      signals.filter((s) => s.unitCode === u.code),
      results.filter((r) => r.unitCode === u.code),
      published[i],
    ),
  );
}
