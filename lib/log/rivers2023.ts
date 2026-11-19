import seal from "@/data/rivers-2023/seal.json";
import { rivers2023 } from "@/lib/count/rivers2023";
import { verifyLog, type LogReport, type Seal } from "./index";

/** The seal written by scripts/seal-log.ts when the Rivers 2023 published results were recorded. */
export const RIVERS_2023_SEAL = seal as Seal;

/** Recomputes the Log over the Rivers 2023 published results and checks it against the committed seal. */
export function verifyRivers2023(): LogReport {
  return verifyLog(rivers2023().units, RIVERS_2023_SEAL);
}
