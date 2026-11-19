import voters from "@/data/seed/voters.json";
import irev from "@/data/seed/irev_results.json";
import type { ResultFigures } from "@/lib/types";
import type { CardStatus, IRevProvider, VoterLookupProvider } from "./types";

const DEMO_UNITS = ["LA03-007", "LA05-012", "KN02-031", "KN02-018", "EN01-002"];

/** MOCK: fictional cards from data/seed/voters.json; any other 4 digits get a made-up but stable answer. */
export class MockVoterLookup implements VoterLookupProvider {
  readonly name = "mock-voter-lookup";
  readonly mocked = true;

  async lookupCard(last4: string): Promise<CardStatus | null> {
    if (!/^\d{4}$/.test(last4)) return null;
    const known = voters.cards.find((c) => c.last4 === last4);
    if (known) {
      return {
        ready: known.ready,
        assignedUnit: known.assignedUnit,
        previousUnit: known.previousUnit,
        note: known.note,
      };
    }
    // Same rule as the landing-page demo: any 4 digits work.
    const n = Number.parseInt(last4, 10);
    const ready = n % 3 !== 0;
    const moved = n % 2 === 0;
    if (moved) {
      return { ready, assignedUnit: "LA03-007", previousUnit: "LA03-004", note: "Same ward, about 400 m from your old unit." };
    }
    return { ready, assignedUnit: DEMO_UNITS[n % DEMO_UNITS.length], previousUnit: null, note: null };
  }
}

/** MOCK: published figures from data/seed/irev_results.json. IReV is not accessed. */
export class MockIRev implements IRevProvider {
  readonly name = "mock-irev";
  readonly mocked = true;

  async publishedResult(unitCode: string): Promise<ResultFigures | null> {
    const r = (irev.results as Record<string, ResultFigures | null>)[unitCode];
    return r ? { ...r } : null;
  }
}
