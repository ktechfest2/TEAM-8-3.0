import { describe, expect, it } from "vitest";
import { canonicalJson } from "@/lib/chain/canonical";
import { GENESIS_HASH, buildEntry, computeHash, sha256Hex, verifyChain } from "@/lib/chain/hash";
import type { ChainEntry, SubmissionPayload } from "@/lib/types";

const payload = (n: number): SubmissionPayload => ({
  unitCode: "LA03-007",
  senderHash: sha256Hex(`sender-${n}`),
  figures: { A: 100 + n, B: 98, C: 41, D: 7, rejected: 6, accredited: 300 },
  hasPhoto: n % 2 === 0,
  createdAt: new Date(Date.UTC(2027, 1, 20, 18, n)).toISOString(),
});

function chainOf(n: number): ChainEntry[] {
  const out: ChainEntry[] = [];
  let prev = GENESIS_HASH;
  for (let i = 0; i < n; i++) {
    const e = buildEntry(payload(i), prev);
    out.push(e);
    prev = e.hash;
  }
  return out;
}

describe("canonicalJson", () => {
  it("sorts keys at every depth and drops whitespace", () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: "x" } })).toBe(
      '{"a":{"c":"x","d":[3,{"y":2,"z":1}]},"b":1}',
    );
  });

  it("is independent of insertion order", () => {
    expect(canonicalJson({ x: 1, y: 2 })).toBe(canonicalJson({ y: 2, x: 1 }));
  });

  it("refuses values that JSON cannot represent faithfully", () => {
    expect(() => canonicalJson(NaN)).toThrow();
    expect(() => canonicalJson(undefined)).toThrow();
  });
});

describe("hash chain", () => {
  it("is SHA-256 of previous hash plus canonical JSON", () => {
    const p = payload(1);
    const expected = sha256Hex(GENESIS_HASH + canonicalJson(p));
    expect(computeHash(GENESIS_HASH, p)).toBe(expected);
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
  });

  it("normalises timestamps so a database round trip hashes the same", () => {
    const p = payload(1);
    const roundTripped = { ...p, createdAt: p.createdAt.replace("Z", "+00:00") };
    expect(computeHash(GENESIS_HASH, roundTripped)).toBe(computeHash(GENESIS_HASH, p));
  });

  it("verifies an untouched chain", () => {
    const chain = chainOf(5);
    const report = verifyChain(chain);
    expect(report).toMatchObject({ ok: true, length: 5, head: chain[4].hash, breaks: [] });
  });

  it("verifies an empty chain", () => {
    expect(verifyChain([])).toMatchObject({ ok: true, length: 0, head: GENESIS_HASH });
  });

  it("detects an edited figure", () => {
    const chain = chainOf(4);
    chain[2] = { ...chain[2], figures: { ...chain[2].figures, A: 999 } };
    const report = verifyChain(chain);
    expect(report.ok).toBe(false);
    expect(report.breaks).toEqual([expect.objectContaining({ index: 2, kind: "hash_mismatch" })]);
  });

  it("detects an edit even if the attacker recomputes that entry's hash", () => {
    const chain = chainOf(4);
    const edited = buildEntry({ ...chain[1], hasPhoto: !chain[1].hasPhoto }, chain[1].prevHash);
    chain[1] = edited;
    const report = verifyChain(chain);
    expect(report.ok).toBe(false);
    expect(report.breaks).toEqual([expect.objectContaining({ index: 2, kind: "prev_mismatch" })]);
  });

  it("detects a deleted entry", () => {
    const chain = chainOf(4);
    chain.splice(1, 1);
    expect(verifyChain(chain).breaks[0]).toMatchObject({ index: 1, kind: "prev_mismatch" });
  });

  it("detects reordered entries", () => {
    const chain = chainOf(3);
    [chain[1], chain[2]] = [chain[2], chain[1]];
    expect(verifyChain(chain).ok).toBe(false);
  });
});
