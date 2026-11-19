import { t } from "@/lib/i18n/messages";
import { confidence } from "@/lib/rules/signals";
import type { UnitSummary } from "@/lib/rules/summary";
import type { UnitFilter } from "@/lib/store/types";
import { UNIT_CODE_RE } from "@/lib/commands/parse";

export function parseFilter(params: URLSearchParams | Record<string, string | string[] | undefined>): UnitFilter {
  const get = (k: string) => {
    const v = params instanceof URLSearchParams ? params.get(k) : params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const state = get("state");
  const unit = get("unit")?.toUpperCase();
  return {
    state: state && /^[A-Za-z .'-]{1,40}$/.test(state) ? state : undefined,
    unitCode: unit && UNIT_CODE_RE.test(unit) ? unit : undefined,
  };
}

export function resultLabel(s: UnitSummary): string {
  const agreeing = s.consensus.status === "consensus" ? s.consensus.agreeing : 0;
  const diffs = s.comparison?.status === "unmatched" ? s.comparison.diffs : [];
  return t("en").resultStatus(s.resultStatus, agreeing, diffs);
}

export function signalLabel(count: number): string {
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
    "state",
    "polling_unit",
    "unit_name",
    "officials_arrived_reports",
    "accreditation_started_reports",
    "long_queue_reports",
    "result_submissions",
    "result_submitters",
    "photos_attached",
    "result_status",
    "result_summary",
    "first_report_utc",
    "last_report_utc",
    "data_note",
  ];
  const lines = rows.map((s) =>
    [
      s.unit.state,
      s.unit.code,
      s.unit.name,
      s.counts.arrived,
      s.counts.accred,
      s.counts.queue,
      s.submissions,
      s.consensus.submitters,
      s.photos,
      s.resultStatus,
      resultLabel(s),
      s.firstReportAt,
      s.lastReportAt,
      "Counts of voter reports, not confirmed facts. 1 report = unverified. Published figures are MOCK data.",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
