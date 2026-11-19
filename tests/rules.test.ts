import { describe, expect, it } from "vitest";
import { confidence, countLiveReports, REPORTED_MIN } from "@/lib/rules/liveReports";
import { summarizeUnit } from "@/lib/rules/summary";
import type { LiveReport, PollingUnit } from "@/lib/types";

const unit: PollingUnit = {
  code: "32/15/04/012",
  name: "State Primary School Rumuobiakani I",
  ward: "Rumuodomaya (3a)",
  lga: "Obio/Akpor",
  state: "Rivers",
  registeredVoters: 1184,
};

const report = (kind: LiveReport["kind"], senderHash: string, minute: number): LiveReport => ({
  unitCode: unit.code,
  kind,
  senderHash,
  createdAt: new Date(Date.UTC(2027, 0, 16, 7, minute)).toISOString(),
});

describe("live reports", () => {
  it("counts distinct voters per kind", () => {
    const counts = countLiveReports([
      { kind: "arrived", senderHash: "a" },
      { kind: "arrived", senderHash: "b" },
      { kind: "arrived", senderHash: "a" },
      { kind: "queue", senderHash: "a" },
    ]);
    expect(counts).toEqual({ arrived: 2, accred: 0, queue: 1 });
  });

  it("labels one voter as unverified, two or more as reported, and never as confirmed", () => {
    expect(REPORTED_MIN).toBe(2);
    expect(confidence(0)).toBe("none");
    expect(confidence(1)).toBe("unverified");
    expect(confidence(2)).toBe("reported");
    expect(confidence(50)).toBe("reported");
  });
});

describe("summarizeUnit", () => {
  it("gives counts and the first and last report times", () => {
    const s = summarizeUnit(unit, [report("queue", "b", 44), report("arrived", "a", 5), report("arrived", "b", 9)]);
    expect(s.unit).toBe(unit);
    expect(s.counts).toEqual({ arrived: 2, accred: 0, queue: 1 });
    expect(s.firstReportAt).toBe(report("arrived", "a", 5).createdAt);
    expect(s.lastReportAt).toBe(report("queue", "b", 44).createdAt);
  });

  it("has no times when nobody has reported", () => {
    expect(summarizeUnit(unit, [])).toMatchObject({ counts: { arrived: 0, accred: 0, queue: 0 }, firstReportAt: null, lastReportAt: null });
  });
});
