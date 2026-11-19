import { describe, expect, it } from "vitest";
import { buildCountTrail, findArea, type AnnouncedArea, type PublishedUnit } from "@/lib/count/trail";
import { rivers2023 } from "@/lib/count/rivers2023";

const unit = (code: string, figures: Partial<Record<"APC" | "LP" | "PDP" | "NNPP", number>> | null, registered = 500): PublishedUnit => ({
  code,
  name: `Unit ${code}`,
  ward: `Ward ${code.slice(6, 8)}`,
  lga: `LGA ${code.slice(3, 5)}`,
  registered,
  accredited: figures ? 300 : null,
  sheet: figures ? "read" : "not_uploaded",
  figures: figures ? { APC: 0, LP: 0, PDP: 0, NNPP: 0, ...figures } : null,
  sheetUrl: null,
});

const announce = (code: string, figures: Partial<Record<"APC" | "LP" | "PDP" | "NNPP", number>>): AnnouncedArea => ({
  code,
  name: `LGA ${code.slice(3, 5)}`,
  figures: { APC: 0, LP: 0, PDP: 0, NNPP: 0, ...figures },
});

const state = { code: "99", name: "Teststate" };
const of = (units: PublishedUnit[], announced: AnnouncedArea[]) => buildCountTrail({ state, units, announced });

describe("count trail", () => {
  it("adds published results up through ward, local government and state", () => {
    const trail = of(
      [unit("99/01/01/001", { APC: 100, LP: 50 }), unit("99/01/01/002", { APC: 20, LP: 5 }), unit("99/01/02/001", { APC: 1, LP: 2 }), unit("99/02/01/001", { APC: 7 })],
      [],
    );
    expect(trail.kind).toBe("state");
    expect(trail.portalSum).toMatchObject({ APC: 128, LP: 57 });
    const lga = findArea(trail, "99/01")!;
    expect(lga.kind).toBe("lga");
    expect(lga.name).toBe("LGA 01");
    expect(lga.portalSum).toMatchObject({ APC: 121, LP: 57 });
    expect(findArea(trail, "99/01/01")!.portalSum).toMatchObject({ APC: 120, LP: 55 });
    expect(findArea(trail, "99/01/01")!.kind).toBe("ward");
  });

  it("reports coverage: units read, units that exist, and registered voters in the units not read", () => {
    const trail = of([unit("99/01/01/001", { APC: 10 }), unit("99/01/01/002", null, 400), unit("99/01/01/003", null, 250)], []);
    expect(trail.coverage).toEqual({ read: 1, total: 3, registeredMissing: 650 });
  });

  it("has nothing to compare where no result was announced, such as a ward", () => {
    const trail = of([unit("99/01/01/001", { APC: 10 })], [announce("99/01", { APC: 10 })]);
    const ward = findArea(trail, "99/01/01")!;
    expect(ward.announced).toBeNull();
    expect(ward.comparisons).toEqual([]);
    expect(ward.finding).toBeNull();
  });

  it("finds a local government consistent when the portal sum equals the announced result", () => {
    const lga = findArea(of([unit("99/01/01/001", { APC: 900, LP: 400 })], [announce("99/01", { APC: 900, LP: 400 })]), "99/01")!;
    expect(lga.finding).toBe("consistent");
    expect(lga.comparisons.find((c) => c.party === "APC")).toMatchObject({ portalSum: 900, announced: 900, gap: 0, finding: "consistent" });
  });

  it("treats a small difference as reading noise, not a mismatch worth flagging", () => {
    const lga = findArea(of([unit("99/01/01/001", { APC: 8125 }, 20000)], [announce("99/01", { APC: 8066 })]), "99/01")!;
    expect(lga.comparisons.find((c) => c.party === "APC")!.finding).toBe("consistent");
  });

  it("leaves a mismatch open when the units not read could account for it", () => {
    const lga = findArea(of([unit("99/01/01/001", { APC: 1000 }, 2000), unit("99/01/01/002", null, 3000)], [announce("99/01", { APC: 2500 })]), "99/01")!;
    expect(lga.comparisons.find((c) => c.party === "APC")).toMatchObject({ gap: 1500, finding: "open" });
    expect(lga.finding).toBe("open");
  });

  it("flags an unexplained mismatch when the announced result is higher than every missing voter could make up", () => {
    const lga = findArea(of([unit("99/01/01/001", { APC: 1000 }, 2000), unit("99/01/01/002", null, 300)], [announce("99/01", { APC: 2500 })]), "99/01")!;
    expect(lga.comparisons.find((c) => c.party === "APC")).toMatchObject({ gap: 1500, finding: "unexplained", reason: "gap_beyond_missing" });
    expect(lga.finding).toBe("unexplained");
  });

  it("flags an unexplained mismatch when a partial portal sum is already above the announced result", () => {
    const lga = findArea(of([unit("99/01/01/001", { LP: 6000 }, 9000), unit("99/01/01/002", null, 5000)], [announce("99/01", { LP: 3000 })]), "99/01")!;
    expect(lga.comparisons.find((c) => c.party === "LP")).toMatchObject({ gap: -3000, finding: "unexplained", reason: "sum_above_announced" });
  });

  it("gives the state an announced result only when every local government has one", () => {
    const units = [unit("99/01/01/001", { APC: 10 }), unit("99/02/01/001", { APC: 20 })];
    expect(of(units, [announce("99/01", { APC: 10 })]).announced).toBeNull();
    const full = of(units, [announce("99/01", { APC: 10 }), announce("99/02", { APC: 20 })]);
    expect(full.announced).toMatchObject({ APC: 30 });
    expect(full.finding).toBe("consistent");
  });

  it("orders areas by code and returns null for an area that does not exist", () => {
    const trail = of([unit("99/02/01/001", { APC: 1 }), unit("99/01/01/001", { APC: 1 })], []);
    expect(trail.areas.map((a) => a.code)).toEqual(["99/01", "99/02"]);
    expect(findArea(trail, "99/09")).toBeNull();
  });
});

describe("count trail on Rivers State 2023", () => {
  const trail = buildCountTrail(rivers2023());

  it("covers 5,316 of 6,866 polling units across 23 local governments", () => {
    expect(trail.coverage.read).toBe(5316);
    expect(trail.coverage.total).toBe(6866);
    expect(trail.areas).toHaveLength(23);
  });

  it("flags Obio/Akpor: the partial portal sum for LP is far above what was announced", () => {
    const lp = findArea(trail, "32/15")!.comparisons.find((c) => c.party === "LP")!;
    expect(lp).toMatchObject({ portalSum: 68521, announced: 3829, finding: "unexplained", reason: "sum_above_announced" });
  });

  it("flags Oyigbo the same way", () => {
    const lga = findArea(trail, "32/21")!;
    expect(lga.finding).toBe("unexplained");
    expect(lga.comparisons.find((c) => c.party === "LP")).toMatchObject({ portalSum: 17875, announced: 10784 });
  });

  it("does not flag a local government whose differences are within reading noise or missing units", () => {
    expect(findArea(trail, "32/02")!.finding).not.toBe("unexplained"); // Ahoada East
  });
});
