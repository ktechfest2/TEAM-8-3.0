import { neon } from "@neondatabase/serverless";
import type { Sql } from "@/lib/store/postgres";

/**
 * Neon's HTTP driver: one statement per request, no connection pool to manage, suited to
 * serverless functions on Vercel. Each statement runs in its own transaction.
 */
export function neonSql(databaseUrl: string): Sql {
  const sql = neon(databaseUrl);
  return (text, params = []) => sql.query(text, params) as Promise<Record<string, unknown>[]>;
}
