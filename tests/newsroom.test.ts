import { beforeEach, describe, expect, it } from "vitest";
import type { Deps } from "@/lib/context";
import { csvCell, liveReportLabel, parseFilter, toCsv } from "@/lib/newsroom";
import { ConsoleMessaging } from "@/lib/providers/messaging";
import { MockVoterLookup } from "@/lib/providers/mock";
import { newsroomSummaries } from "@/lib/queries";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { MemoryStore } from "@/lib/store/memory";

describe("newsroom helpers", () => {
  it("neutralises spreadsheet formulas and quotes cells", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell('say "hi"')).toBe(`"say ""hi"""`);
    expect(csvCell(null)).toBe(`""`);
    expect(csvCell(3)).toBe(`"3"`);
  });

  it("accepts only well-formed filters", () => {
    expect(parseFilter(new URLSearchParams("lga=Obio/Akpor&unit=32/15/04/012"))).toEqual({ lga: "Obio/Akpor", unitCode: "32/15/04/012" });
    expect(parseFilter({ lga: "<script>", unit: "LA03-007" })).toEqual({ lga: undefined, unitCode: undefined });
  });

  it("labels a single live report as unverified", () => {
    expect(liveReportLabel(0)).toBe("0");
    expect(liveReportLabel(1)).toBe("1 (unverified)");
    expect(liveReportLabel(4)).toBe("4");
  });
});

describe("newsroom summaries", () => {
  let deps: Deps;

  beforeEach(async () => {
    const store = new MemoryStore(SEED_UNITS);
    deps = { store, voterLookup: new MockVoterLookup(), messaging: new ConsoleMessaging(), salt: "test-salt", warnings: [] };
    await seedDemoReports(store, "test-salt");
  });

  it("lists only polling units with at least one live report, in unit-code order", async () => {
    const rows = await newsroomSummaries(deps, {});
    expect(rows.map((r) => r.unit.code)).toEqual(["32/15/04/012", "32/21/01/001", "32/22/01/004", "32/22/05/001"]);
    expect(rows[0].counts).toEqual({ arrived: 2, accred: 1, queue: 3 });
  });

  it("narrows by local government and by polling unit", async () => {
    expect((await newsroomSummaries(deps, { lga: "Port Harcourt" })).map((r) => r.unit.code)).toEqual(["32/22/01/004", "32/22/05/001"]);
    expect((await newsroomSummaries(deps, { unitCode: "32/21/01/001" })).map((r) => r.unit.code)).toEqual(["32/21/01/001"]);
    expect(await newsroomSummaries(deps, { lga: "Tai" })).toEqual([]);
    expect(await newsroomSummaries(deps, { lga: "Tai", unitCode: "32/21/01/001" })).toEqual([]);
  });

  it("exports the same rows as CSV, with no result columns", async () => {
    const csv = toCsv(await newsroomSummaries(deps, { lga: "Oyigbo" }));
    const [header, row] = csv.trim().split("\r\n");
    expect(header).toBe(
      '"local_government","ward","polling_unit","unit_name","officials_arrived_reports","accreditation_started_reports","long_queue_reports","first_report_utc","last_report_utc","data_note"',
    );
    expect(row).toContain('"Oyigbo","Okoloma","32/21/01/001","School Hall C.P.S. Okoloma","1","0","0"');
  });
});
