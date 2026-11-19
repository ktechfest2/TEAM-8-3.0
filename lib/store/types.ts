import type { Lang, LiveReport, LiveReportKind, PollingUnit, Sender } from "@/lib/types";

export interface UnitFilter {
  /** Local government name, e.g. "Obio/Akpor". */
  lga?: string;
  unitCode?: string;
  /** Only these unit codes. An empty list matches nothing. */
  codes?: string[];
}

/** Persistence. Postgres (Neon) in production; an in-memory store for local demos and tests. */
export interface Store {
  readonly kind: "postgres" | "memory";

  getUnit(code: string): Promise<PollingUnit | null>;
  /** In unit-code order. */
  listUnits(filter?: UnitFilter): Promise<PollingUnit[]>;
  listLgas(): Promise<string[]>;

  getSender(senderHash: string): Promise<Sender | null>;
  upsertSender(sender: Sender): Promise<void>;
  setSenderLang(senderHash: string, lang: Lang): Promise<void>;

  /** Returns false if this voter already sent this kind of live report for this unit. */
  addLiveReport(unitCode: string, kind: LiveReportKind, senderHash: string, createdAt?: string): Promise<boolean>;
  /** Oldest first. No unit codes = every live report. */
  listLiveReports(unitCodes?: string[]): Promise<LiveReport[]>;
}
