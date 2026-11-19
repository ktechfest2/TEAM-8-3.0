export type Lang = "en" | "pcm" | "ha" | "yo" | "ig";
export const LANGS: Lang[] = ["en", "pcm", "ha", "yo", "ig"];

export type Signal = "arrived" | "accred" | "queue";
export const SIGNALS: Signal[] = ["arrived", "accred", "queue"];

/** Figures as written on Form EC8A on the wall. Parties are placeholders A to D. */
export interface ResultFigures {
  A: number;
  B: number;
  C: number;
  D: number;
  rejected: number;
  accredited: number;
}
export const FIGURE_KEYS: (keyof ResultFigures)[] = ["A", "B", "C", "D", "rejected", "accredited"];
export const FIGURE_LABELS: Record<keyof ResultFigures, string> = {
  A: "Party A",
  B: "Party B",
  C: "Party C",
  D: "Party D",
  rejected: "Rejected",
  accredited: "Accredited",
};

export interface PollingUnit {
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

export interface SignalRow {
  unitCode: string;
  signal: Signal;
  senderHash: string;
  createdAt: string;
}

export type SignalCounts = Record<Signal, number>;

/** Fields covered by the hash: everything a reader would care about someone editing. */
export interface SubmissionPayload {
  unitCode: string;
  senderHash: string;
  figures: ResultFigures;
  hasPhoto: boolean;
  createdAt: string; // ISO 8601, millisecond precision (Date#toISOString)
}

export interface ChainEntry extends SubmissionPayload {
  prevHash: string;
  hash: string;
}

export interface ResultRow extends ChainEntry {
  seq: number;
}
