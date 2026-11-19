/**
 * Applies db/migrations/*.sql to the database in DATABASE_URL, in order, once each.
 *   npm run db:migrate
 * Uses Neon's WebSocket Pool (not the HTTP driver) because migrations hold multi-statement SQL
 * and run inside a transaction.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* file not present */
  }
}

neonConfig.webSocketConstructor = ws;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (see .env.example).");
    process.exit(1);
  }
  const dir = path.join(process.cwd(), "db", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query(
      "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const done = new Set((await client.query("select name from schema_migrations")).rows.map((r) => r.name as string));
    for (const f of files) {
      if (done.has(f)) {
        console.log(`skip   ${f}`);
        continue;
      }
      await client.query("begin");
      try {
        await client.query(readFileSync(path.join(dir, f), "utf8"));
        await client.query("insert into schema_migrations (name) values ($1)", [f]);
        await client.query("commit");
        console.log(`apply  ${f}`);
      } catch (e) {
        await client.query("rollback");
        throw new Error(`${f}: ${(e as Error).message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
