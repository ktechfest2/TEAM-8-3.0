import type { Store } from "@/lib/store/types";
import type { ResultRow, SubmissionPayload } from "@/lib/types";
import { buildEntry } from "./hash";

const MAX_ATTEMPTS = 8;

/**
 * Read the head, hash against it, append atomically. If another write moved the head in between,
 * the store refuses (advisory lock + unique prev_hash in Postgres) and we retry on the new head.
 */
export async function appendSubmission(store: Store, payload: SubmissionPayload): Promise<ResultRow> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const head = await store.chainHead();
    const res = await store.appendResult(buildEntry(payload, head));
    if (res.ok) return res.row;
    await new Promise((r) => setTimeout(r, Math.random() * 15 * attempt));
  }
  throw new Error("Could not append to the log: too much contention. Try again.");
}
