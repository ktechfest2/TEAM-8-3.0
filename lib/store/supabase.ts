import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GENESIS_HASH } from "@/lib/chain/hash";
import type { ChainEntry, Lang, PollingUnit, ResultRow, Sender, Signal, SignalRow } from "@/lib/types";
import type { Store, UnitFilter } from "./types";

interface UnitRow {
  code: string;
  name: string;
  ward: string;
  lga: string;
  state: string;
  registered_voters: number;
}
interface SubmissionRow {
  seq: number;
  unit_code: string;
  sender_hash: string;
  party_a: number;
  party_b: number;
  party_c: number;
  party_d: number;
  rejected: number;
  accredited: number;
  has_photo: boolean;
  created_at: string;
  prev_hash: string;
  hash: string;
}

const toUnit = (r: UnitRow): PollingUnit => ({
  code: r.code,
  name: r.name,
  ward: r.ward,
  lga: r.lga,
  state: r.state,
  registeredVoters: r.registered_voters,
});

const toResult = (r: SubmissionRow): ResultRow => ({
  seq: Number(r.seq),
  unitCode: r.unit_code,
  senderHash: r.sender_hash,
  figures: { A: r.party_a, B: r.party_b, C: r.party_c, D: r.party_d, rejected: r.rejected, accredited: r.accredited },
  hasPhoto: r.has_photo,
  createdAt: new Date(r.created_at).toISOString(),
  prevHash: r.prev_hash,
  hash: r.hash,
});

function fail(op: string, error: { message: string } | null): never {
  throw new Error(`Supabase ${op} failed: ${error?.message ?? "unknown error"}`);
}

const PAGE = 1000;

/** Supabase Postgres via the service role key (server-side only; RLS blocks everyone else). */
export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async getUnit(code: string) {
    const { data, error } = await this.db.from("polling_units").select("*").eq("code", code).maybeSingle();
    if (error) fail("getUnit", error);
    return data ? toUnit(data as UnitRow) : null;
  }

  async listUnits(filter: UnitFilter = {}) {
    let q = this.db.from("polling_units").select("*").order("state").order("code");
    if (filter.state) q = q.eq("state", filter.state);
    if (filter.unitCode) q = q.eq("code", filter.unitCode);
    const { data, error } = await q;
    if (error) fail("listUnits", error);
    return (data as UnitRow[]).map(toUnit);
  }

  async listStates() {
    const { data, error } = await this.db.from("polling_units").select("state");
    if (error) fail("listStates", error);
    return [...new Set((data as { state: string }[]).map((r) => r.state))].sort();
  }

  async getSender(senderHash: string) {
    const { data, error } = await this.db.from("senders").select("*").eq("sender_hash", senderHash).maybeSingle();
    if (error) fail("getSender", error);
    if (!data) return null;
    return { senderHash: data.sender_hash, unitCode: data.unit_code, lang: data.lang as Lang };
  }

  async upsertSender(s: Sender) {
    const { error } = await this.db
      .from("senders")
      .upsert({ sender_hash: s.senderHash, unit_code: s.unitCode, lang: s.lang, updated_at: new Date().toISOString() });
    if (error) fail("upsertSender", error);
  }

  async setSenderLang(senderHash: string, lang: Lang) {
    const existing = await this.getSender(senderHash);
    await this.upsertSender({ senderHash, unitCode: existing?.unitCode ?? null, lang });
  }

  async addSignal(unitCode: string, signal: Signal, senderHash: string, createdAt?: string) {
    const { error } = await this.db
      .from("signals")
      .insert({ unit_code: unitCode, signal, sender_hash: senderHash, ...(createdAt ? { created_at: createdAt } : {}) });
    if (!error) return true;
    if (error.code === "23505") return false; // unique(unit_code, signal, sender_hash)
    fail("addSignal", error);
  }

  async listSignals(unitCodes: string[]) {
    if (unitCodes.length === 0) return [];
    const out: SignalRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.db
        .from("signals")
        .select("unit_code, signal, sender_hash, created_at")
        .in("unit_code", unitCodes)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) fail("listSignals", error);
      for (const r of data) {
        out.push({ unitCode: r.unit_code, signal: r.signal, senderHash: r.sender_hash, createdAt: new Date(r.created_at).toISOString() });
      }
      if (data.length < PAGE) return out;
    }
  }

  async chainHead() {
    const { data, error } = await this.db
      .from("result_submissions")
      .select("hash")
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) fail("chainHead", error);
    return data?.hash ?? GENESIS_HASH;
  }

  async appendResult(e: ChainEntry) {
    const { data, error } = await this.db
      .rpc("append_result_submission", {
        p_unit_code: e.unitCode,
        p_sender_hash: e.senderHash,
        p_party_a: e.figures.A,
        p_party_b: e.figures.B,
        p_party_c: e.figures.C,
        p_party_d: e.figures.D,
        p_rejected: e.figures.rejected,
        p_accredited: e.figures.accredited,
        p_has_photo: e.hasPhoto,
        p_created_at: e.createdAt,
        p_prev_hash: e.prevHash,
        p_hash: e.hash,
      })
      .single();
    if (error) {
      if (error.message?.includes("chain_head_moved") || error.code === "23505") {
        return { ok: false as const, reason: "head_moved" as const };
      }
      fail("appendResult", error);
    }
    return { ok: true as const, row: toResult(data as SubmissionRow) };
  }

  async listResults(unitCodes?: string[]) {
    if (unitCodes && unitCodes.length === 0) return [];
    const out: ResultRow[] = [];
    for (let from = 0; ; from += PAGE) {
      let q = this.db.from("result_submissions").select("*").order("seq").range(from, from + PAGE - 1);
      if (unitCodes) q = q.in("unit_code", unitCodes);
      const { data, error } = await q;
      if (error) fail("listResults", error);
      out.push(...(data as SubmissionRow[]).map(toResult));
      if (data.length < PAGE) return out;
    }
  }
}
