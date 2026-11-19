/**
 * Seeds the database in DATABASE_URL with the fictional polling units and the MOCK demo reports.
 *   npm run seed
 * Run `npm run db:migrate` first. Safe to re-run: units are upserted, duplicate signals are ignored,
 * and demo results are only added when the log is empty (the log is append-only).
 */
import { verifyChain } from "@/lib/chain/hash";
import { neonSql } from "@/lib/db/neon";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { PostgresStore } from "@/lib/store/postgres";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* file not present */
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  const salt = process.env.PHONE_HASH_SALT;
  if (!url || !salt) {
    console.error("Set DATABASE_URL and PHONE_HASH_SALT (see .env.example).");
    process.exit(1);
  }

  const store = new PostgresStore(neonSql(url));
  try {
    await store.upsertUnits(SEED_UNITS);
  } catch (e) {
    throw new Error(`Upserting polling units failed: ${(e as Error).message}. Did you run npm run db:migrate?`);
  }
  console.log(`Polling units: ${SEED_UNITS.length} upserted.`);

  const r = await seedDemoReports(store, salt);
  console.log(`Demo signals: ${r.signals} added.`);
  console.log(r.skippedResults ? "Demo results: skipped, the log already has entries." : `Demo results: ${r.results} appended.`);

  const report = verifyChain(await store.listResults());
  console.log(`Hash chain: ${report.ok ? "intact" : "BROKEN"}, ${report.length} entries.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
