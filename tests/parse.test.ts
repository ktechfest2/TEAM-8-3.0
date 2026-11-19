import { describe, expect, it } from "vitest";
import { parseCommand } from "@/lib/commands/parse";

const figures = { A: 112, B: 98, C: 41, D: 7, rejected: 6, accredited: 264 };

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
    expect(parseCommand("unit la03-007")).toEqual({ kind: "unit", unitCode: "LA03-007" });
  });

  it.each([
    ["REPORT ARRIVED", "arrived"],
    ["report accred", "accred"],
    ["Report accreditation", "accred"],
    ["REPORT QUEUE", "queue"],
  ])("parses %j", (text, signal) => {
    expect(parseCommand(text)).toEqual({ kind: "report", signal });
  });

  it("parses REPORT with a unit code in any position", () => {
    expect(parseCommand("REPORT LA03-007 QUEUE")).toEqual({ kind: "report", signal: "queue", unitCode: "LA03-007" });
  });

  it("asks for a signal when REPORT has none", () => {
    expect(parseCommand("REPORT")).toEqual({ kind: "error", error: { code: "report_needs_signal" } });
    expect(parseCommand("REPORT FIGHTING")).toEqual({ kind: "error", error: { code: "report_needs_signal" } });
  });

  it("parses RESULT in the documented format", () => {
    expect(parseCommand("RESULT A112 B98 C41 D7 REJ6 ACC264")).toEqual({ kind: "result", figures });
  });

  it("parses RESULT with spaces, separators, lower case and any order", () => {
    expect(parseCommand("result acc 264, rej 6, d=7 c:41 b 98 a 112")).toEqual({ kind: "result", figures });
  });

  it("parses RESULT with a unit code", () => {
    expect(parseCommand("RESULT A112 B98 C41 D7 REJ6 ACC264 LA03-007")).toEqual({
      kind: "result",
      figures,
      unitCode: "LA03-007",
    });
  });

  it("lists missing RESULT fields", () => {
    expect(parseCommand("RESULT A112 B98")).toEqual({
      kind: "error",
      error: { code: "result_missing_fields", missing: ["C", "D", "rejected", "accredited"] },
    });
  });

  it("rejects a repeated RESULT field", () => {
    expect(parseCommand("RESULT A1 A2 B98 C41 D7 REJ6 ACC264")).toEqual({
      kind: "error",
      error: { code: "result_duplicate_field", field: "A" },
    });
  });

  it("rejects an unreadable RESULT token", () => {
    expect(parseCommand("RESULT A112 E5 B98 C41 D7 REJ6 ACC264")).toEqual({
      kind: "error",
      error: { code: "result_bad_token", token: "E5" },
    });
    expect(parseCommand("RESULT A-5 B98")).toMatchObject({ kind: "error", error: { code: "result_bad_token" } });
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
