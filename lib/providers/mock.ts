import voters from "@/data/seed/voters.json";
import type { CardStatus, VoterLookupProvider } from "./types";

/** Real Rivers State polling units that made-up cards are assigned to. */
const DEMO_UNITS = ["32/15/04/012", "32/21/01/001", "32/22/05/001", "32/22/01/004", "32/15/04/003"];

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
    // Any 4 digits work, so a demo never dead-ends.
    const n = Number.parseInt(last4, 10);
    const ready = n % 3 !== 0;
    const moved = n % 2 === 0;
    if (moved) {
      return { ready, assignedUnit: "32/15/04/012", previousUnit: "32/15/04/010", note: "Same ward, about 400 m from your old unit." };
    }
    return { ready, assignedUnit: DEMO_UNITS[n % DEMO_UNITS.length], previousUnit: null, note: null };
  }
}
