import { describe, expect, it } from "vitest";
import { csvCell, parseFilter, signalLabel } from "@/lib/newsroom";

describe("newsroom helpers", () => {
  it("neutralises spreadsheet formulas and quotes cells", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell('say "hi"')).toBe(`"say ""hi"""`);
    expect(csvCell(null)).toBe(`""`);
    expect(csvCell(3)).toBe(`"3"`);
  });

  it("accepts only well-formed filters", () => {
    expect(parseFilter(new URLSearchParams("state=Lagos&unit=la03-007"))).toEqual({ state: "Lagos", unitCode: "LA03-007" });
    expect(parseFilter({ state: "<script>", unit: "x" })).toEqual({ state: undefined, unitCode: undefined });
  });

  it("labels a single report as unverified", () => {
    expect(signalLabel(0)).toBe("0");
    expect(signalLabel(1)).toBe("1 (unverified)");
    expect(signalLabel(4)).toBe("4");
  });
});
