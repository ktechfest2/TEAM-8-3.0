/**
 * Seeds Supabase with the fictional polling units and the MOCK demo reports.
 *   npm run seed
 * Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PHONE_HASH_SALT from the environment or .env.local.
 * Safe to re-run: units are upserted, duplicate signals are ignored, and demo results are only
 * added when the log is empty (the log is append-only).
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { SupabaseStore } from "@/lib/store/supabase";
import { verifyChain } from "@/lib/chain/hash";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* file not present */
  }
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const salt = process.env.PHONE_HASH_SALT;
  if (!url || !key || !salt) {
    console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PHONE_HASH_SALT (see .env.example).");
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("polling_units").upsert(
    SEED_UNITS.map((u) => ({
      code: u.code,
      name: u.name,
      ward: u.ward,
      lga: u.lga,
      state: u.state,
      registered_voters: u.registeredVoters,
    })),
  );
  if (error) throw new Error(`Upserting polling units failed: ${error.message}. Did you run the migration?`);
  console.log(`Polling units: ${SEED_UNITS.length} upserted.`);

  const store = new SupabaseStore(url, key);
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
