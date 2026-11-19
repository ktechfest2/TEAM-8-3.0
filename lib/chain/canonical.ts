/**
 * Canonical JSON: object keys sorted, no whitespace, arrays kept in order.
 * Equal values always serialise to the same string, so their hashes match.
 */
export function canonicalJson(value: unknown): string {
  if (value === undefined) throw new Error("undefined in canonical JSON");
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Non-finite number in canonical JSON");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}
