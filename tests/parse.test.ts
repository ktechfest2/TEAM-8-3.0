import { describe, expect, it } from "vitest";
import { parseCommand } from "@/lib/commands/parse";

describe("parseCommand", () => {
  it.each(["HELP", "help", "  Help  ", "hi", "MENU"])("parses %j as help", (text) => {
    expect(parseCommand(text)).toEqual({ kind: "help" });
  });

  it("parses READY with the last 4 digits", () => {
    expect(parseCommand("ready 4821")).toEqual({ kind: "ready", last4: "4821" });
    expect(parseCommand("READY 48 21")).toEqual({ kind: "ready", last4: "4821" });
  });

  it("rejects READY without exactly 4 digits", () => {
    for (const text of ["READY", "READY 482", "READY 48211", "READY abcd"]) {
      expect(parseCommand(text)).toEqual({ kind: "error", error: { code: "ready_needs_last4" } });
    }
  });

  it("parses UNIT with and without a unit code", () => {
    expect(parseCommand("UNIT")).toEqual({ kind: "unit" });
    expect(parseCommand("unit 32/15/04/012")).toEqual({ kind: "unit", unitCode: "32/15/04/012" });
    expect(parseCommand("UNIT 32/15/04/012.")).toEqual({ kind: "unit", unitCode: "32/15/04/012" });
  });

  it("does not mistake other text for a unit code", () => {
    expect(parseCommand("UNIT 32/15/04")).toEqual({ kind: "unit" });
    expect(parseCommand("UNIT LA03-007")).toEqual({ kind: "unit" });
  });

  it.each([
    ["REPORT ARRIVED", "arrived"],
    ["report accred", "accred"],
    ["Report accreditation", "accred"],
    ["REPORT QUEUE", "queue"],
  ])("parses %j", (text, report) => {
    expect(parseCommand(text)).toEqual({ kind: "report", report });
  });

  it("parses REPORT with a unit code in any position", () => {
    expect(parseCommand("REPORT 32/21/01/001 QUEUE")).toEqual({ kind: "report", report: "queue", unitCode: "32/21/01/001" });
    expect(parseCommand("report queue 32/21/01/001")).toEqual({ kind: "report", report: "queue", unitCode: "32/21/01/001" });
  });

  it("asks what was seen when REPORT does not say", () => {
    expect(parseCommand("REPORT")).toEqual({ kind: "error", error: { code: "report_needs_kind" } });
    expect(parseCommand("REPORT FIGHTING")).toEqual({ kind: "error", error: { code: "report_needs_kind" } });
  });

  it("no longer accepts figures from voters", () => {
    expect(parseCommand("RESULT A112 B98 C41 D7 REJ6 ACC264")).toEqual({
      kind: "error",
      error: { code: "unknown_command", word: "RESULT" },
    });
  });

  it("parses LANG", () => {
    expect(parseCommand("LANG PIDGIN")).toEqual({ kind: "lang", lang: "pcm" });
    expect(parseCommand("lang yoruba")).toEqual({ kind: "lang", lang: "yo" });
    expect(parseCommand("LANG KLINGON")).toEqual({ kind: "error", error: { code: "lang_unknown" } });
  });

  it("returns errors for empty and unknown input", () => {
    expect(parseCommand("   ")).toEqual({ kind: "error", error: { code: "empty" } });
    expect(parseCommand("VOTE FOR ME")).toEqual({ kind: "error", error: { code: "unknown_command", word: "VOTE" } });
  });
});
