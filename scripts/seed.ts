/**
 * Seeds the database in DATABASE_URL with the Rivers State polling units and the MOCK demo live reports.
 *   npm run seed
 * Run `npm run db:migrate` first. Safe to re-run: units are upserted and repeated live reports are ignored.
 */
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
  console.log(`Demo live reports: ${r.liveReports} added.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
