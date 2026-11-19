export type Lang = "en" | "pcm" | "ha" | "yo" | "ig";
export const LANGS: Lang[] = ["en", "pcm", "ha", "yo", "ig"];

/** What a voter can say is happening at their polling unit right now. */
export type LiveReportKind = "arrived" | "accred" | "queue";
export const LIVE_REPORT_KINDS: LiveReportKind[] = ["arrived", "accred", "queue"];

export interface PollingUnit {
  /** state/local government/ward/unit, e.g. "32/15/04/012" */
  code: string;
  name: string;
  ward: string;
  lga: string;
  state: string;
  registeredVoters: number;
}

export interface Sender {
  senderHash: string;
  unitCode: string | null;
  lang: Lang;
}

export interface LiveReport {
  unitCode: string;
  kind: LiveReportKind;
  senderHash: string;
  createdAt: string;
}

export type LiveReportCounts = Record<LiveReportKind, number>;
