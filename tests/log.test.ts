import { describe, expect, it } from "vitest";
import { canonicalJson } from "@/lib/chain/canonical";
import { GENESIS_HASH, sha256Hex } from "@/lib/chain/hash";
import type { PublishedUnit } from "@/lib/count/trail";
import { sealLog, verifyLog } from "@/lib/log";
import { RIVERS_2023_SEAL, verifyRivers2023 } from "@/lib/log/rivers2023";

const unit = (code: string, apc: number | null): PublishedUnit => ({
  code,
  name: `Unit ${code}`,
  ward: `Ward ${code.slice(6, 8)}`,
  lga: `LGA ${code.slice(3, 5)}`,
  registered: 500,
  accredited: apc === null ? null : 300,
  sheet: apc === null ? "not_uploaded" : "read",
  figures: apc === null ? null : { APC: apc, LP: 20, PDP: 10, NNPP: 0 },
  sheetUrl: null,
});

/** Three local governments, two polling units each. */
const units = (): PublishedUnit[] => [
  unit("99/01/01/001", 100),
  unit("99/01/01/002", null),
  unit("99/02/01/001", 40),
  unit("99/02/01/002", 55),
  unit("99/03/01/001", 7),
  unit("99/03/01/002", 9),
];
const SEALED_AT = "2027-01-16T20:00:00.000Z";

describe("canonicalJson", () => {
  it("sorts keys at every depth and drops whitespace", () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: "x" } })).toBe('{"a":{"c":"x","d":[3,{"y":2,"z":1}]},"b":1}');
  });

  it("is independent of insertion order", () => {
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });

  it("refuses values that JSON cannot represent faithfully", () => {
    expect(() => canonicalJson({ a: Number.NaN })).toThrow();
    expect(() => canonicalJson(undefined)).toThrow();
  });
});

describe("the log", () => {
  it("chains each entry to the one before it with SHA-256, starting from genesis", () => {
    const [first] = units();
    const entry = { unitCode: first.code, sheet: "read", figures: first.figures, registered: 500, accredited: 300 };
    const seal = sealLog([first], SEALED_AT);
    expect(seal.head).toBe(sha256Hex(GENESIS_HASH + canonicalJson(entry)));
    expect(seal.head).toMatch(/^[0-9a-f]{64}$/);
  });

  it("seals with a head, a length and one checkpoint per local government", () => {
    const seal = sealLog(units(), SEALED_AT);
    expect(seal).toMatchObject({ sealedAt: SEALED_AT, length: 6 });
    expect(seal.checkpoints.map((c) => [c.areaCode, c.name, c.units])).toEqual([
      ["99/01", "LGA 01", 2],
      ["99/02", "LGA 02", 2],
      ["99/03", "LGA 03", 2],
    ]);
    expect(seal.checkpoints[2].hash).toBe(seal.head);
  });

  it("verifies an untouched log", () => {
    const report = verifyLog(units(), sealLog(units(), SEALED_AT));
    expect(report).toMatchObject({ ok: true, length: 6, firstBreak: null });
    expect(report.head).toBe(report.expectedHead);
    expect(report.checkpoints.every((c) => c.ok)).toBe(true);
  });

  it("verifies an empty log", () => {
    const report = verifyLog([], sealLog([], SEALED_AT));
    expect(report).toMatchObject({ ok: true, length: 0, head: GENESIS_HASH, checkpoints: [] });
  });

  it("names the local government where a figure was edited, and breaks every one after it", () => {
    const seal = sealLog(units(), SEALED_AT);
    const edited = units();
    edited[3] = { ...edited[3], figures: { ...edited[3].figures!, APC: 5500 } };
    const report = verifyLog(edited, seal);
    expect(report.ok).toBe(false);
    expect(report.firstBreak).toBe("99/02");
    expect(report.checkpoints.map((c) => c.ok)).toEqual([true, false, false]);
    expect(report.head).not.toBe(report.expectedHead);
  });

  it("notices a sheet that was read at sealing time and has since gone missing", () => {
    const seal = sealLog(units(), SEALED_AT);
    const edited = units();
    edited[0] = { ...edited[0], sheet: "not_uploaded", figures: null, accredited: null };
    expect(verifyLog(edited, seal)).toMatchObject({ ok: false, firstBreak: "99/01" });
  });

  it("breaks when an entry is removed", () => {
    const seal = sealLog(units(), SEALED_AT);
    const report = verifyLog(
      units().filter((u) => u.code !== "99/03/01/001"),
      seal,
    );
    expect(report).toMatchObject({ ok: false, firstBreak: "99/03", length: 5 });
    expect(report.checkpoints.map((c) => c.ok)).toEqual([true, true, false]);
  });

  it("breaks when a whole local government is removed", () => {
    const seal = sealLog(units(), SEALED_AT);
    const report = verifyLog(
      units().filter((u) => !u.code.startsWith("99/03")),
      seal,
    );
    expect(report).toMatchObject({ ok: false, firstBreak: "99/03" });
  });

  it("breaks when entries are reordered", () => {
    const seal = sealLog(units(), SEALED_AT);
    const reordered = units();
    [reordered[2], reordered[3]] = [reordered[3], reordered[2]];
    expect(verifyLog(reordered, seal)).toMatchObject({ ok: false, firstBreak: "99/02" });
  });

  it("breaks when an entry is added that was never sealed", () => {
    const seal = sealLog(units(), SEALED_AT);
    const report = verifyLog([...units(), unit("99/04/01/001", 1)], seal);
    expect(report).toMatchObject({ ok: false, firstBreak: "99/04" });
  });

  it("ignores fields that are not part of an entry, such as the unit's name", () => {
    const seal = sealLog(units(), SEALED_AT);
    const renamed = units().map((u) => ({ ...u, name: "Renamed", sheetUrl: "https://example.test/x" }));
    expect(verifyLog(renamed, seal).ok).toBe(true);
  });
});

describe("the log over Rivers State 2023", () => {
  it("still matches the committed seal", () => {
    const report = verifyRivers2023();
    expect(report.ok).toBe(true);
    expect(report.length).toBe(6866);
    expect(report.checkpoints).toHaveLength(23);
    expect(report.head).toBe(RIVERS_2023_SEAL.head);
  });
});
