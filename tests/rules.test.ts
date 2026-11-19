import { describe, expect, it } from "vitest";
import {
  compareWithPublished,
  confidence,
  countSignals,
  findConsensus,
  summarizeUnit,
  validateResult,
} from "@/lib/rules";
import type { PollingUnit, ResultFigures, ResultRow } from "@/lib/types";

const ok: ResultFigures = { A: 112, B: 98, C: 41, D: 7, rejected: 6, accredited: 264 };

describe("validateResult", () => {
  it("accepts figures where votes + rejected equals accredited", () => {
    expect(validateResult(ok, 850)).toEqual([]);
  });

  it("accepts votes + rejected below accredited (some accredited voters did not vote)", () => {
    expect(validateResult({ ...ok, accredited: 300 }, 850)).toEqual([]);
  });

  it("flags votes + rejected above accredited", () => {
    expect(validateResult({ ...ok, A: 113 }, 850)).toEqual([
      { code: "total_exceeds_accredited", total: 265, accredited: 264 },
    ]);
  });

  it("flags accredited above registered", () => {
    expect(validateResult(ok, 200)).toEqual([{ code: "accredited_exceeds_registered", accredited: 264, registered: 200 }]);
  });

  it("allows accredited exactly equal to registered", () => {
    expect(validateResult(ok, 264)).toEqual([]);
  });

  it("reports both arithmetic problems at once", () => {
    const issues = validateResult({ ...ok, A: 500 }, 200);
    expect(issues.map((i) => i.code)).toEqual(["total_exceeds_accredited", "accredited_exceeds_registered"]);
  });

  it("rejects negative and fractional figures before doing arithmetic", () => {
    const issues = validateResult({ ...ok, B: -1, C: 1.5 }, 850);
    expect(issues).toEqual([
      { code: "not_whole_number", field: "B" },
      { code: "not_whole_number", field: "C" },
    ]);
  });
});

const sub = (senderHash: string, figures: ResultFigures) => ({ senderHash, figures });

describe("findConsensus", () => {
  it("returns none with no submissions", () => {
    expect(findConsensus([])).toEqual({ status: "none", submitters: 0 });
  });

  it("treats one submission as single (unverified)", () => {
    expect(findConsensus([sub("a", ok)]).status).toBe("single");
  });

  it("forms consensus from two identical submissions by different senders", () => {
    const c = findConsensus([sub("a", ok), sub("b", { ...ok })]);
    expect(c).toMatchObject({ status: "consensus", agreeing: 2, submitters: 2, figures: ok });
  });

  it("does not let one sender create consensus by repeating themselves", () => {
    expect(findConsensus([sub("a", ok), sub("a", ok)]).status).toBe("single");
  });

  it("uses each sender's latest submission (typo corrections)", () => {
    const typo = { ...ok, A: 121 };
    const c = findConsensus([sub("a", typo), sub("b", ok), sub("a", ok)]);
    expect(c).toMatchObject({ status: "consensus", agreeing: 2 });
  });

  it("reports conflicting when two senders disagree", () => {
    expect(findConsensus([sub("a", ok), sub("b", { ...ok, B: 99 })])).toEqual({
      status: "conflicting",
      submitters: 2,
      groups: 2,
    });
  });

  it("reports conflicting on a tie between two agreeing groups", () => {
    const other = { ...ok, B: 99 };
    const c = findConsensus([sub("a", ok), sub("b", ok), sub("c", other), sub("d", other)]);
    expect(c.status).toBe("conflicting");
  });

  it("picks the larger group when there is a clear lead", () => {
    const other = { ...ok, B: 99 };
    const c = findConsensus([sub("a", ok), sub("b", ok), sub("c", ok), sub("d", other)]);
    expect(c).toMatchObject({ status: "consensus", agreeing: 3, submitters: 4, figures: ok });
  });

  it("does not depend on key order inside figures", () => {
    const reordered = { accredited: 264, rejected: 6, D: 7, C: 41, B: 98, A: 112 } as ResultFigures;
    expect(findConsensus([sub("a", ok), sub("b", reordered)]).status).toBe("consensus");
  });
});

describe("compareWithPublished", () => {
  it("matches identical figures", () => {
    expect(compareWithPublished(ok, { ...ok })).toEqual({ status: "matches" });
  });

  it("names every differing field", () => {
    expect(compareWithPublished(ok, { ...ok, B: 102, accredited: 270 })).toEqual({
      status: "unmatched",
      diffs: [
        { field: "B", reported: 98, published: 102 },
        { field: "accredited", reported: 264, published: 270 },
      ],
    });
  });

  it("reports not_published when there is no published result", () => {
    expect(compareWithPublished(ok, null)).toEqual({ status: "not_published" });
  });
});

describe("signals", () => {
  it("counts distinct senders per signal", () => {
    const counts = countSignals([
      { signal: "arrived", senderHash: "a" },
      { signal: "arrived", senderHash: "b" },
      { signal: "arrived", senderHash: "a" },
      { signal: "queue", senderHash: "a" },
    ]);
    expect(counts).toEqual({ arrived: 2, accred: 0, queue: 1 });
  });

  it("labels one reporter as unverified and never as confirmed", () => {
    expect(confidence(0)).toBe("none");
    expect(confidence(1)).toBe("unverified");
    expect(confidence(2)).toBe("reported");
    expect(confidence(50)).toBe("reported");
  });
});

describe("summarizeUnit", () => {
  const unit: PollingUnit = {
    code: "LA03-007",
    name: "Unit 007, Ward 3",
    ward: "Ward 3",
    lga: "Demo",
    state: "Lagos",
    registeredVoters: 850,
  };
  const row = (seq: number, senderHash: string, figures: ResultFigures, hasPhoto = false): ResultRow => ({
    seq,
    unitCode: unit.code,
    senderHash,
    figures,
    hasPhoto,
    createdAt: `2027-02-20T18:0${seq}:00.000Z`,
    prevHash: "",
    hash: "",
  });

  it("marks consensus that differs from published as unmatched", () => {
    const s = summarizeUnit(unit, [], [row(1, "a", ok, true), row(2, "b", ok)], { ...ok, B: 102 });
    expect(s.resultStatus).toBe("consensus_unmatched");
    expect(s.photos).toBe(1);
    expect(s.firstReportAt).toBe("2027-02-20T18:01:00.000Z");
  });

  it("never compares a single submission with the published result", () => {
    const s = summarizeUnit(unit, [], [row(1, "a", { ...ok, B: 1 })], ok);
    expect(s.resultStatus).toBe("single_unverified");
    expect(s.comparison).toBeNull();
  });

  it("handles consensus before publication", () => {
    const s = summarizeUnit(unit, [], [row(1, "a", ok), row(2, "b", ok)], null);
    expect(s.resultStatus).toBe("consensus_not_published");
  });
});
