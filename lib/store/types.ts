import type { ChainEntry, Lang, PollingUnit, ResultRow, Sender, Signal, SignalRow } from "@/lib/types";

export interface UnitFilter {
  state?: string;
  unitCode?: string;
}

/** Persistence. Postgres (Neon) in production; an in-memory store for local demos and tests. */
export interface Store {
  readonly kind: "postgres" | "memory";

  getUnit(code: string): Promise<PollingUnit | null>;
  listUnits(filter?: UnitFilter): Promise<PollingUnit[]>;
  listStates(): Promise<string[]>;

  getSender(senderHash: string): Promise<Sender | null>;
  upsertSender(sender: Sender): Promise<void>;
  setSenderLang(senderHash: string, lang: Lang): Promise<void>;

  /** Returns false if this sender already sent this signal for this unit. */
  addSignal(unitCode: string, signal: Signal, senderHash: string, createdAt?: string): Promise<boolean>;
  listSignals(unitCodes: string[]): Promise<SignalRow[]>;

  /** Hash of the newest entry, or GENESIS_HASH if empty. */
  chainHead(): Promise<string>;
  /** Atomic append. "head_moved" means another write got in first: re-read the head and retry. */
  appendResult(entry: ChainEntry): Promise<{ ok: true; row: ResultRow } | { ok: false; reason: "head_moved" }>;
  /** In log order (ascending seq). No filter = whole chain. */
  listResults(unitCodes?: string[]): Promise<ResultRow[]>;
}
