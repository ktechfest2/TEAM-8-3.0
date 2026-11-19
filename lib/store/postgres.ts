import { GENESIS_HASH } from "@/lib/chain/hash";
import type { ChainEntry, Lang, PollingUnit, ResultRow, Sender, Signal, SignalRow } from "@/lib/types";
import type { Store, UnitFilter } from "./types";

/**
 * Anything that runs one parameterised SQL statement and returns rows.
 * In the app this is Neon's HTTP driver (lib/db/neon.ts); in tests it is PGlite (embedded Postgres).
 */
export type Sql = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

type Row = Record<string, unknown>;

const iso = (v: unknown) => new Date(v as string | Date).toISOString();

const toUnit = (r: Row): PollingUnit => ({
  code: r.code as string,
  name: r.name as string,
  ward: r.ward as string,
  lga: r.lga as string,
  state: r.state as string,
  registeredVoters: Number(r.registered_voters),
});

const toResult = (r: Row): ResultRow => ({
  seq: Number(r.seq),
  unitCode: r.unit_code as string,
  senderHash: r.sender_hash as string,
  figures: {
    A: Number(r.party_a),
    B: Number(r.party_b),
    C: Number(r.party_c),
    D: Number(r.party_d),
    rejected: Number(r.rejected),
    accredited: Number(r.accredited),
  },
  hasPhoto: Boolean(r.has_photo),
  createdAt: iso(r.created_at),
  prevHash: r.prev_hash as string,
  hash: r.hash as string,
});

const pgCode = (e: unknown) => (e as { code?: string })?.code;
const pgMessage = (e: unknown) => String((e as { message?: string })?.message ?? "");

/** Plain Postgres store (Neon in production). Parameterised SQL only. */
export class PostgresStore implements Store {
  readonly kind = "postgres" as const;

  constructor(private readonly sql: Sql) {}

  async getUnit(code: string) {
    const rows = await this.sql("select * from polling_units where code = $1", [code]);
    return rows[0] ? toUnit(rows[0]) : null;
  }

  async listUnits(filter: UnitFilter = {}) {
    const rows = await this.sql(
      `select * from polling_units
        where ($1::text is null or state = $1) and ($2::text is null or code = $2)
        order by state, code`,
      [filter.state ?? null, filter.unitCode ?? null],
    );
    return rows.map(toUnit);
  }

  async listStates() {
    const rows = await this.sql("select distinct state from polling_units order by state");
    return rows.map((r) => r.state as string);
  }

  async getSender(senderHash: string) {
    const rows = await this.sql("select sender_hash, unit_code, lang from senders where sender_hash = $1", [senderHash]);
    const r = rows[0];
    return r ? { senderHash: r.sender_hash as string, unitCode: (r.unit_code as string) ?? null, lang: r.lang as Lang } : null;
  }

  async upsertSender(s: Sender) {
    await this.sql(
      `insert into senders (sender_hash, unit_code, lang, updated_at) values ($1, $2, $3, now())
       on conflict (sender_hash) do update set unit_code = excluded.unit_code, lang = excluded.lang, updated_at = now()`,
      [s.senderHash, s.unitCode, s.lang],
    );
  }

  async setSenderLang(senderHash: string, lang: Lang) {
    await this.sql(
      `insert into senders (sender_hash, lang, updated_at) values ($1, $2, now())
       on conflict (sender_hash) do update set lang = excluded.lang, updated_at = now()`,
      [senderHash, lang],
    );
  }

  async addSignal(unitCode: string, signal: Signal, senderHash: string, createdAt?: string) {
    // unique(unit_code, signal, sender_hash): a repeat inserts nothing and returns no row.
    const rows = await this.sql(
      `insert into signals (unit_code, signal, sender_hash, created_at) values ($1, $2, $3, coalesce($4::timestamptz, now()))
       on conflict (unit_code, signal, sender_hash) do nothing
       returning id`,
      [unitCode, signal, senderHash, createdAt ?? null],
    );
    return rows.length > 0;
  }

  async listSignals(unitCodes: string[]): Promise<SignalRow[]> {
    if (unitCodes.length === 0) return [];
    const rows = await this.sql(
      "select unit_code, signal, sender_hash, created_at from signals where unit_code = any($1::text[]) order by id",
      [unitCodes],
    );
    return rows.map((r) => ({
      unitCode: r.unit_code as string,
      signal: r.signal as Signal,
      senderHash: r.sender_hash as string,
      createdAt: iso(r.created_at),
    }));
  }

  async chainHead() {
    const rows = await this.sql("select hash from result_submissions order by seq desc limit 1");
    return (rows[0]?.hash as string) ?? GENESIS_HASH;
  }

  async appendResult(e: ChainEntry) {
    try {
      // One statement = one transaction. The function takes an advisory lock and refuses if the head moved.
      const rows = await this.sql(
        "select * from append_result_submission($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11, $12)",
        [
          e.unitCode,
          e.senderHash,
          e.figures.A,
          e.figures.B,
          e.figures.C,
          e.figures.D,
          e.figures.rejected,
          e.figures.accredited,
          e.hasPhoto,
          e.createdAt,
          e.prevHash,
          e.hash,
        ],
      );
      return { ok: true as const, row: toResult(rows[0]) };
    } catch (err) {
      if (pgMessage(err).includes("chain_head_moved") || pgCode(err) === "23505") {
        return { ok: false as const, reason: "head_moved" as const };
      }
      throw err;
    }
  }

  async listResults(unitCodes?: string[]) {
    if (unitCodes && unitCodes.length === 0) return [];
    const rows = unitCodes
      ? await this.sql("select * from result_submissions where unit_code = any($1::text[]) order by seq", [unitCodes])
      : await this.sql("select * from result_submissions order by seq");
    return rows.map(toResult);
  }

  /** Used by the seed script. */
  async upsertUnits(units: PollingUnit[]) {
    for (const u of units) {
      await this.sql(
        `insert into polling_units (code, name, ward, lga, state, registered_voters) values ($1, $2, $3, $4, $5, $6)
         on conflict (code) do update set name = excluded.name, ward = excluded.ward, lga = excluded.lga,
           state = excluded.state, registered_voters = excluded.registered_voters`,
        [u.code, u.name, u.ward, u.lga, u.state, u.registeredVoters],
      );
    }
  }
}
