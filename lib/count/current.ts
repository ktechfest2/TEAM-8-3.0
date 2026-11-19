import { RIVERS_2023, rivers2023 } from "./rivers2023";
import { buildCountTrail, type AreaTrail, type PublishedUnit } from "./trail";

/**
 * The election Tally is currently following. Today that is the one real dataset we have;
 * a live election would swap the source here and nothing above it changes.
 */
let cached: { trail: AreaTrail; units: PublishedUnit[] } | undefined;

function load() {
  if (!cached) {
    const input = rivers2023();
    cached = { trail: buildCountTrail(input), units: input.units };
  }
  return cached;
}

export const currentElection = RIVERS_2023;
export const currentTrail = () => load().trail;
export const currentUnits = () => load().units;
