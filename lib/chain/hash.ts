import { createHash } from "node:crypto";

/** What the first link of any hash chain points back to. */
export const GENESIS_HASH = "0".repeat(64);

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}
