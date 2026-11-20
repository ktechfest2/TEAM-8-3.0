import type { Deps } from "@/lib/context";
import { summarizeUnit, type UnitSummary } from "@/lib/rules/summary";
import type { PollingUnit } from "@/lib/types";

export async function unitSummary(deps: Deps, unit: PollingUnit): Promise<UnitSummary> {
  return summarizeUnit(unit, await deps.store.listLiveReports([unit.code]));
}
