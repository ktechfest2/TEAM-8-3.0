/**
 * Runs the real migration and the Postgres store against PGlite (Postgres compiled to WebAssembly),
 * so the SQL, the append function, the constraints and the append-only trigger are all exercised.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { appendSubmission } from "@/lib/chain/append";
import { GENESIS_HASH, buildEntry, verifyChain } from "@/lib/chain/hash";
import { handleMessage } from "@/lib/commands/handle";
import type { Deps } from "@/lib/context";
import { ConsoleMessaging } from "@/lib/providers/messaging";
import { MockIRev, MockVoterLookup } from "@/lib/providers/mock";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { hashSender } from "@/lib/senders";
import { PostgresStore, type Sql } from "@/lib/store/postgres";

const SALT = "test-salt";
const migration = readFileSync(path.join(__dirname, "..", "db", "migrations", "0001_init.sql"), "utf8");
const figures = { A: 112, B: 98, C: 41, D: 7, rejected: 6, accredited: 264 };

let pg: PGlite;
let sql: Sql;
let store: PostgresStore;
let deps: Deps;

beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(migration);
  sql = async (text, params = []) => (await pg.query<Record<string, unknown>>(text, params)).rows;
  store = new PostgresStore(sql);
  await store.upsertUnits(SEED_UNITS);
  deps = { store, voterLookup: new MockVoterLookup(), irev: new MockIRev(), messaging: new ConsoleMessaging(), salt: SALT, warnings: [] };
}, 30_000);

const payload = (n: number) => ({
  unitCode: "LA03-007",
  senderHash: hashSender(`sim:voter-${n}`, SALT),
  figures,
  hasPhoto: n % 2 === 0,
  createdAt: new Date(Date.UTC(2027, 1, 20, 18, n, 0, 123)).toISOString(),
});

describe("Postgres store (PGlite)", () => {
  it("applies the migration and is idempotent on units", async () => {
    await store.upsertUnits(SEED_UNITS);
    expect(await store.listUnits()).toHaveLength(SEED_UNITS.length);
    expect(await store.listStates()).toEqual(["Enugu", "Kano", "Lagos"]);
    expect(await store.listUnits({ state: "Lagos", unitCode: "LA05-012" })).toMatchObject([{ code: "LA05-012", registeredVoters: 620 }]);
  });

  it("keeps one signal per sender per signal per unit", async () => {
    const h = hashSender("sim:a", SALT);
    expect(await store.addSignal("LA03-007", "arrived", h)).toBe(true);
    expect(await store.addSignal("LA03-007", "arrived", h)).toBe(false);
    expect(await store.addSignal("LA03-007", "queue", h)).toBe(true);
    expect(await store.listSignals(["LA03-007"])).toHaveLength(2);
  });

  it("round-trips the chain so verification passes (timestamps, bigints, booleans)", async () => {
    for (let i = 0; i < 4; i++) await appendSubmission(store, payload(i));
    const rows = await store.listResults();
    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3, 4]);
    expect(rows[0].prevHash).toBe(GENESIS_HASH);
    expect(rows[0].createdAt).toBe(payload(0).createdAt);
    expect(verifyChain(rows).ok).toBe(true);
  });

  it("refuses an entry built on a stale head, so the chain cannot fork", async () => {
    await appendSubmission(store, payload(1));
    const stale = buildEntry(payload(2), GENESIS_HASH);
    expect(await store.appendResult(stale)).toEqual({ ok: false, reason: "head_moved" });
  });

  it("stays linear under concurrent appends", async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => appendSubmission(store, payload(i))));
    const rows = await store.listResults();
    expect(rows).toHaveLength(12);
    expect(verifyChain(rows).ok).toBe(true);
  });

  it("blocks updates and deletes on the log", async () => {
    await appendSubmission(store, payload(1));
    await expect(sql("update result_submissions set party_a = 1")).rejects.toThrow(/append-only/);
    await expect(sql("delete from result_submissions")).rejects.toThrow(/append-only/);
  });

  it("enforces constraints the app relies on", async () => {
    await expect(sql("insert into signals (unit_code, signal, sender_hash) values ('LA03-007', 'fight', $1)", ["a".repeat(64)])).rejects.toThrow();
    await expect(sql("insert into signals (unit_code, signal, sender_hash) values ('XX00-000', 'queue', $1)", ["a".repeat(64)])).rejects.toThrow();
  });

  it("runs the full voter flow through the handler", async () => {
    await seedDemoReports(store, SALT);
    const send = (from: string, text: string) => handleMessage(deps, { from, text });

    expect((await send("sim:amaka", "READY 4821")).reply).toContain("moved to Unit 007, Ward 3 (LA03-007)");
    expect((await send("sim:amaka", "REPORT ARRIVED")).reply).toContain("3 voters report officials arrived.");
    expect((await send("sim:amaka", "REPORT ARRIVED")).reply).toContain("You already reported this");
    const r = await send("sim:amaka", "RESULT A112 B98 C41 D7 REJ6 ACC264");
    expect(r.reply).toContain("Matches the published result");
    expect(r.reply).toContain("3 voters have sent these same figures.");
    expect((await send("sim:amaka", "LANG PIDGIN")).reply).toBe("Language don change to Pidgin.");
    expect((await store.getSender(hashSender("sim:amaka", SALT)))?.lang).toBe("pcm");
    expect(verifyChain(await store.listResults()).ok).toBe(true);
  });
});
