import { UNIT_CODE_RE } from "@/lib/commands/parse";
import { confidence } from "@/lib/rules/liveReports";
import type { UnitSummary } from "@/lib/rules/summary";

export interface NewsroomFilter {
  /** Local government name, e.g. "Obio/Akpor". */
  lga?: string;
  unitCode?: string;
}

export function parseFilter(params: URLSearchParams | Record<string, string | string[] | undefined>): NewsroomFilter {
  const get = (k: string) => {
    const v = params instanceof URLSearchParams ? params.get(k) : params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const lga = get("lga");
  const unit = get("unit");
  return {
    lga: lga && /^[A-Za-z .'/()-]{1,40}$/.test(lga) ? lga : undefined,
    unitCode: unit && UNIT_CODE_RE.test(unit) ? unit : undefined,
  };
}

export function liveReportLabel(count: number): string {
  const c = confidence(count);
  return c === "none" ? "0" : c === "unverified" ? "1 (unverified)" : String(count);
}

/** Neutralise spreadsheet formula injection and quote every cell. */
export function csvCell(v: string | number | boolean | null): string {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: UnitSummary[]): string {
  const header = [
    "local_government",
    "ward",
    "polling_unit",
    "unit_name",
    "officials_arrived_reports",
    "accreditation_started_reports",
    "long_queue_reports",
    "first_report_utc",
    "last_report_utc",
    "data_note",
  ];
  const lines = rows.map((s) =>
    [
      s.unit.lga,
      s.unit.ward,
      s.unit.code,
      s.unit.name,
      s.counts.arrived,
      s.counts.accred,
      s.counts.queue,
      s.firstReportAt,
      s.lastReportAt,
      "Counts of voters' live reports, not confirmed facts. 1 report = unverified.",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
