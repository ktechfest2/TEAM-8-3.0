/**
 * Seals the Log: writes data/rivers-2023/seal.json from published.json.
 *   npx tsx scripts/seal-log.ts
 * Run it once when the published results are recorded. Running it again after the data changes
 * replaces the seal, which defeats the point, so only re-seal on purpose and commit the result.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PublishedUnit } from "@/lib/count/trail";
import { sealLog } from "@/lib/log";

const dir = join(process.cwd(), "data", "rivers-2023");
const units = JSON.parse(readFileSync(join(dir, "published.json"), "utf8")) as PublishedUnit[];
const seal = sealLog(units, new Date().toISOString());

writeFileSync(join(dir, "seal.json"), JSON.stringify(seal, null, 1) + "\n");
console.log(`Sealed ${seal.length} entries across ${seal.checkpoints.length} local governments.`);
console.log(`Head: ${seal.head}`);
