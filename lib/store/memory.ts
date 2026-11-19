import { GENESIS_HASH } from "@/lib/chain/hash";
import type { ChainEntry, Lang, PollingUnit, ResultRow, Sender, Signal, SignalRow } from "@/lib/types";
import type { Store, UnitFilter } from "./types";

/**
 * In-memory store. Used when Supabase is not configured (local demo) and in tests.
 * Data is lost on restart and is not shared between serverless instances.
 */
export class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private units = new Map<string, PollingUnit>();
  private senders = new Map<string, Sender>();
  private signals: SignalRow[] = [];
  private results: ResultRow[] = [];

  constructor(units: PollingUnit[] = []) {
    for (const u of units) this.units.set(u.code, { ...u });
  }

  async getUnit(code: string) {
    const u = this.units.get(code);
    return u ? { ...u } : null;
  }

  async listUnits(filter: UnitFilter = {}) {
    return [...this.units.values()]
      .filter((u) => (!filter.state || u.state === filter.state) && (!filter.unitCode || u.code === filter.unitCode))
      .sort((a, b) => a.state.localeCompare(b.state) || a.code.localeCompare(b.code))
      .map((u) => ({ ...u }));
  }

  async listStates() {
    return [...new Set([...this.units.values()].map((u) => u.state))].sort();
  }

  async getSender(senderHash: string) {
    const s = this.senders.get(senderHash);
    return s ? { ...s } : null;
  }

  async upsertSender(sender: Sender) {
    this.senders.set(sender.senderHash, { ...sender });
  }

  async setSenderLang(senderHash: string, lang: Lang) {
    const s = this.senders.get(senderHash) ?? { senderHash, unitCode: null, lang };
    this.senders.set(senderHash, { ...s, lang });
  }

  async addSignal(unitCode: string, signal: Signal, senderHash: string, createdAt = new Date().toISOString()) {
    if (!this.units.has(unitCode)) throw new Error(`Unknown unit ${unitCode}`);
    const dup = this.signals.some((s) => s.unitCode === unitCode && s.signal === signal && s.senderHash === senderHash);
    if (dup) return false;
    this.signals.push({ unitCode, signal, senderHash, createdAt });
    return true;
  }

  async listSignals(unitCodes: string[]) {
    const set = new Set(unitCodes);
    return this.signals.filter((s) => set.has(s.unitCode)).map((s) => ({ ...s }));
  }

  async chainHead() {
    return this.results.length ? this.results[this.results.length - 1].hash : GENESIS_HASH;
  }

  async appendResult(entry: ChainEntry) {
    // Synchronous check-and-push: JS runs this block without interleaving, like the SQL advisory lock.
    const head = this.results.length ? this.results[this.results.length - 1].hash : GENESIS_HASH;
    if (entry.prevHash !== head) return { ok: false as const, reason: "head_moved" as const };
    if (!this.units.has(entry.unitCode)) throw new Error(`Unknown unit ${entry.unitCode}`);
    const row: ResultRow = { ...entry, figures: { ...entry.figures }, seq: this.results.length + 1 };
    this.results.push(row);
    return { ok: true as const, row: { ...row } };
  }

  async listResults(unitCodes?: string[]) {
    const set = unitCodes ? new Set(unitCodes) : null;
    return this.results.filter((r) => !set || set.has(r.unitCode)).map((r) => ({ ...r, figures: { ...r.figures } }));
  }

  /** Test helper: simulate someone editing the database directly. */
  _tamper(seq: number, patch: Partial<ResultRow>) {
    const i = this.results.findIndex((r) => r.seq === seq);
    if (i >= 0) this.results[i] = { ...this.results[i], ...patch };
  }
}
