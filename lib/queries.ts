import type { Deps } from "@/lib/context";
import { summarizeUnit, type UnitSummary } from "@/lib/rules/summary";
import type { UnitFilter } from "@/lib/store/types";
import type { LiveReport, PollingUnit } from "@/lib/types";

export async function unitSummary(deps: Deps, unit: PollingUnit): Promise<UnitSummary> {
  return summarizeUnit(unit, await deps.store.listLiveReports([unit.code]));
}

/** Polling units with at least one live report, narrowed by the filter, in unit-code order. */
export async function newsroomSummaries(deps: Deps, filter: Pick<UnitFilter, "lga" | "unitCode">): Promise<UnitSummary[]> {
  const reports = await deps.store.listLiveReports(filter.unitCode ? [filter.unitCode] : undefined);
  const byUnit = new Map<string, LiveReport[]>();
  for (const r of reports) {
    const g = byUnit.get(r.unitCode);
    if (g) g.push(r);
    else byUnit.set(r.unitCode, [r]);
  }
  const units = await deps.store.listUnits({ ...filter, codes: [...byUnit.keys()] });
  return units.map((u) => summarizeUnit(u, byUnit.get(u.code) ?? []));
}
