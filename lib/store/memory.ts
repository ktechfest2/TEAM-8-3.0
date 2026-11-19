import type { Lang, LiveReport, LiveReportKind, PollingUnit, Sender } from "@/lib/types";
import type { Store, UnitFilter } from "./types";

/**
 * In-memory store. Used when DATABASE_URL is not set (local demo) and in tests.
 * Data is lost on restart and is not shared between serverless instances.
 */
export class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private units = new Map<string, PollingUnit>();
  private senders = new Map<string, Sender>();
  private liveReports: LiveReport[] = [];

  constructor(units: PollingUnit[] = []) {
    for (const u of units) this.units.set(u.code, { ...u });
  }

  async getUnit(code: string) {
    const u = this.units.get(code);
    return u ? { ...u } : null;
  }

  async listUnits(filter: UnitFilter = {}) {
    const codes = filter.codes ? new Set(filter.codes) : null;
    return [...this.units.values()]
      .filter((u) => (!filter.lga || u.lga === filter.lga) && (!filter.unitCode || u.code === filter.unitCode) && (!codes || codes.has(u.code)))
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((u) => ({ ...u }));
  }

  async listLgas() {
    return [...new Set([...this.units.values()].map((u) => u.lga))].sort();
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

  async addLiveReport(unitCode: string, kind: LiveReportKind, senderHash: string, createdAt = new Date().toISOString()) {
    if (!this.units.has(unitCode)) throw new Error(`Unknown unit ${unitCode}`);
    const dup = this.liveReports.some((r) => r.unitCode === unitCode && r.kind === kind && r.senderHash === senderHash);
    if (dup) return false;
    this.liveReports.push({ unitCode, kind, senderHash, createdAt });
    return true;
  }

  async listLiveReports(unitCodes?: string[]) {
    const set = unitCodes ? new Set(unitCodes) : null;
    return this.liveReports.filter((r) => !set || set.has(r.unitCode)).map((r) => ({ ...r }));
  }
}
