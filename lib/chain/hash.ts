import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical";
import type { ChainEntry, SubmissionPayload } from "@/lib/types";

export const GENESIS_HASH = "0".repeat(64);

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Only these fields are hashed, so extra columns can never change a hash. */
export function payloadOf(e: SubmissionPayload): SubmissionPayload {
  return {
    unitCode: e.unitCode,
    senderHash: e.senderHash,
    figures: {
      A: e.figures.A,
      B: e.figures.B,
      C: e.figures.C,
      D: e.figures.D,
      rejected: e.figures.rejected,
      accredited: e.figures.accredited,
    },
    hasPhoto: e.hasPhoto,
    // Normalise so a timestamptz round trip through Postgres hashes the same.
    createdAt: new Date(e.createdAt).toISOString(),
  };
}

/** hash = SHA-256(prevHash + canonicalJson(payload)) */
export function computeHash(prevHash: string, payload: SubmissionPayload): string {
  return sha256Hex(prevHash + canonicalJson(payloadOf(payload)));
}

export function buildEntry(payload: SubmissionPayload, prevHash: string): ChainEntry {
  const p = payloadOf(payload);
  return { ...p, prevHash, hash: computeHash(prevHash, p) };
}

export type ChainBreak =
  | { index: number; kind: "prev_mismatch"; expected: string; found: string }
  | { index: number; kind: "hash_mismatch"; expected: string; found: string };

export interface ChainReport {
  ok: boolean;
  length: number;
  head: string;
  breaks: ChainBreak[];
}

/** Recompute every link from genesis. Entries must be in log order. */
export function verifyChain(entries: ChainEntry[]): ChainReport {
  const breaks: ChainBreak[] = [];
  let expectedPrev = GENESIS_HASH;
  entries.forEach((e, index) => {
    if (e.prevHash !== expectedPrev) {
      breaks.push({ index, kind: "prev_mismatch", expected: expectedPrev, found: e.prevHash });
    }
    const recomputed = computeHash(e.prevHash, e);
    if (recomputed !== e.hash) breaks.push({ index, kind: "hash_mismatch", expected: recomputed, found: e.hash });
    expectedPrev = e.hash;
  });
  return { ok: breaks.length === 0, length: entries.length, head: expectedPrev, breaks };
}
