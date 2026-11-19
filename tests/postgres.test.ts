/**
 * Runs the real migrations and the Postgres store against PGlite (Postgres compiled to WebAssembly),
 * so the SQL and the constraints the app relies on are all exercised.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { handleMessage } from "@/lib/commands/handle";
import type { Deps } from "@/lib/context";
import { ConsoleMessaging } from "@/lib/providers/messaging";
import { MockVoterLookup } from "@/lib/providers/mock";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { hashSender } from "@/lib/senders";
import { PostgresStore, type Sql } from "@/lib/store/postgres";

const SALT = "test-salt";
const UNIT = "32/15/04/012";
const dir = path.join(__dirname, "..", "db", "migrations");
const migrations = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(dir, f), "utf8"));

/** The three local governments the demo cards and reports use: enough to exercise more than one batch. */
const DEMO_LGAS = ["32/15", "32/21", "32/22"];
const DEMO_UNITS = SEED_UNITS.filter((u) => DEMO_LGAS.includes(u.code.slice(0, 5)));

let pg: PGlite;
let sql: Sql;
let store: PostgresStore;
let deps: Deps;

beforeEach(async () => {
  pg = new PGlite();
  for (const m of migrations) await pg.exec(m);
  sql = async (text, params = []) => (await pg.query<Record<string, unknown>>(text, params)).rows;
  store = new PostgresStore(sql);
  await store.upsertUnits(DEMO_UNITS);
  deps = { store, voterLookup: new MockVoterLookup(), messaging: new ConsoleMessaging(), salt: SALT, warnings: [] };
}, 60_000);

describe("Postgres store (PGlite)", () => {
  it("applies both migrations: the voter-submitted result log is gone", async () => {
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    const tables = (await sql("select table_name from information_schema.tables where table_schema = 'public' order by 1")).map(
      (r) => r.table_name,
    );
    expect(tables).toEqual(["polling_units", "senders", "signals"]);
    const fns = await sql("select proname from pg_proc where proname in ('append_result_submission', 'forbid_result_mutation')");
    expect(fns).toEqual([]);
  });

  it("upserts units in batches and is idempotent", async () => {
    expect(DEMO_UNITS.length).toBeGreaterThan(1000);
    await store.upsertUnits(DEMO_UNITS);
    expect(await store.listUnits()).toHaveLength(DEMO_UNITS.length);
    expect(await store.listLgas()).toEqual(["Obio/Akpor", "Oyigbo", "Port Harcourt"]);
    expect(await store.getUnit(UNIT)).toMatchObject({ code: UNIT, lga: "Obio/Akpor", state: "Rivers", registeredVoters: 1184 });
  });

  it("holds every Rivers State polling unit", async () => {
    await store.upsertUnits(SEED_UNITS);
    expect(await store.listUnits()).toHaveLength(6866);
    expect(await store.listLgas()).toHaveLength(23);
  });

  it("filters units by local government, by unit code and by a list of codes", async () => {
    expect((await store.listUnits({ lga: "Oyigbo" })).every((u) => u.code.startsWith("32/21/"))).toBe(true);
    expect(await store.listUnits({ lga: "Oyigbo", unitCode: UNIT })).toEqual([]);
    expect((await store.listUnits({ codes: ["32/22/05/001", UNIT, "99/99/99/999"] })).map((u) => u.code)).toEqual([UNIT, "32/22/05/001"]);
    expect(await store.listUnits({ codes: [] })).toEqual([]);
  });

  it("keeps one live report per voter per kind per unit", async () => {
    const h = hashSender("sim:a", SALT);
    expect(await store.addLiveReport(UNIT, "arrived", h)).toBe(true);
    expect(await store.addLiveReport(UNIT, "arrived", h)).toBe(false);
    expect(await store.addLiveReport(UNIT, "queue", h)).toBe(true);
    expect(await store.listLiveReports([UNIT])).toHaveLength(2);
    expect(await store.listLiveReports([])).toEqual([]);
    expect((await store.listLiveReports()).map((r) => r.kind)).toEqual(["arrived", "queue"]);
  });

  it("round-trips a live report's time", async () => {
    const at = new Date(Date.UTC(2027, 0, 16, 7, 5, 0, 123)).toISOString();
    await store.addLiveReport(UNIT, "arrived", hashSender("sim:a", SALT), at);
    expect((await store.listLiveReports([UNIT]))[0]).toMatchObject({ unitCode: UNIT, kind: "arrived", createdAt: at });
  });

  it("enforces constraints the app relies on", async () => {
    const h = "a".repeat(64);
    await expect(sql("insert into signals (unit_code, signal, sender_hash) values ($1, 'fight', $2)", [UNIT, h])).rejects.toThrow();
    await expect(sql("insert into signals (unit_code, signal, sender_hash) values ('99/99/99/999', 'queue', $1)", [h])).rejects.toThrow();
    await expect(
      sql("insert into polling_units (code, name, ward, lga, state, registered_voters) values ('LA03-007', 'x', 'x', 'x', 'x', 1)"),
    ).rejects.toThrow();
  });

  it("runs the full voter flow through the handler", async () => {
    await seedDemoReports(store, SALT);
    const send = (from: string, text: string) => handleMessage(deps, { from, text });

    expect((await send("sim:amaka", "READY 4821")).reply).toContain(`moved to State Primary School Rumuobiakani I (${UNIT})`);
    expect((await send("sim:amaka", "REPORT ARRIVED")).reply).toContain("3 voters report officials arrived.");
    expect((await send("sim:amaka", "REPORT ARRIVED")).reply).toContain("You already reported this");
    expect((await send("sim:amaka", "UNIT")).reply).toContain("3 voters report a long queue.");
    expect((await send("sim:amaka", "LANG PIDGIN")).reply).toBe("Language don change to Pidgin.");
    expect((await store.getSender(hashSender("sim:amaka", SALT)))?.lang).toBe("pcm");
    expect((await store.getSender(hashSender("sim:amaka", SALT)))?.unitCode).toBe(UNIT);
  });
});
