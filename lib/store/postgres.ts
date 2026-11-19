import type { Lang, LiveReport, LiveReportKind, PollingUnit, Sender } from "@/lib/types";
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

const UNIT_BATCH = 500;

/**
 * Plain Postgres store (Neon in production). Parameterised SQL only.
 * Live reports live in the `signals` table: the table predates the term "live report".
 */
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
        where ($1::text is null or lga = $1)
          and ($2::text is null or code = $2)
          and ($3::text[] is null or code = any($3::text[]))
        order by code`,
      [filter.lga ?? null, filter.unitCode ?? null, filter.codes ?? null],
    );
    return rows.map(toUnit);
  }

  async listLgas() {
    const rows = await this.sql("select distinct lga from polling_units order by lga");
    return rows.map((r) => r.lga as string);
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

  async addLiveReport(unitCode: string, kind: LiveReportKind, senderHash: string, createdAt?: string) {
    // unique(unit_code, signal, sender_hash): a repeat inserts nothing and returns no row.
    const rows = await this.sql(
      `insert into signals (unit_code, signal, sender_hash, created_at) values ($1, $2, $3, coalesce($4::timestamptz, now()))
       on conflict (unit_code, signal, sender_hash) do nothing
       returning id`,
      [unitCode, kind, senderHash, createdAt ?? null],
    );
    return rows.length > 0;
  }

  async listLiveReports(unitCodes?: string[]): Promise<LiveReport[]> {
    if (unitCodes && unitCodes.length === 0) return [];
    const rows = unitCodes
      ? await this.sql("select unit_code, signal, sender_hash, created_at from signals where unit_code = any($1::text[]) order by id", [
          unitCodes,
        ])
      : await this.sql("select unit_code, signal, sender_hash, created_at from signals order by id");
    return rows.map((r) => ({
      unitCode: r.unit_code as string,
      kind: r.signal as LiveReportKind,
      senderHash: r.sender_hash as string,
      createdAt: iso(r.created_at),
    }));
  }

  /** Used by the seed script. One statement per batch, so thousands of units take a handful of round trips. */
  async upsertUnits(units: PollingUnit[]) {
    for (let i = 0; i < units.length; i += UNIT_BATCH) {
      const batch = units.slice(i, i + UNIT_BATCH);
      await this.sql(
        `insert into polling_units (code, name, ward, lga, state, registered_voters)
         select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[])
         on conflict (code) do update set name = excluded.name, ward = excluded.ward, lga = excluded.lga,
           state = excluded.state, registered_voters = excluded.registered_voters`,
        [
          batch.map((u) => u.code),
          batch.map((u) => u.name),
          batch.map((u) => u.ward),
          batch.map((u) => u.lga),
          batch.map((u) => u.state),
          batch.map((u) => u.registeredVoters),
        ],
      );
    }
  }
}
