/**
 * The Log: a hash-chained record of what the results portal showed for each polling unit.
 *
 * Each polling unit is one entry, chained to the one before it:
 *   hash = SHA-256(previous hash + canonical JSON of the entry)
 * A seal records the chain's head and one checkpoint per local government. Change, remove or reorder
 * any entry afterwards and the recomputed chain no longer matches the seal, from that local
 * government onward. Pure; no I/O.
 */
import { canonicalJson } from "@/lib/chain/canonical";
import { GENESIS_HASH, sha256Hex } from "@/lib/chain/hash";
import type { PublishedUnit } from "@/lib/count/trail";

export interface Checkpoint {
  /** Local government code, e.g. "32/15". */
  areaCode: string;
  name: string;
  /** Entries in this local government. */
  units: number;
  /** The chain hash after the last entry of this local government. */
  hash: string;
}

export interface Seal {
  sealedAt: string;
  length: number;
  head: string;
  checkpoints: Checkpoint[];
}

export interface CheckpointReport {
  areaCode: string;
  name: string;
  units: number;
  ok: boolean;
}

export interface LogReport {
  ok: boolean;
  /** Entries found now. */
  length: number;
  /** The chain head recomputed now. */
  head: string;
  /** The head recorded in the seal. */
  expectedHead: string;
  checkpoints: CheckpointReport[];
  /** The first local government whose entries no longer match the seal, or null. */
  firstBreak: string | null;
}

/** Only these fields are hashed: everything a reader would care about someone changing. */
function entryOf(u: PublishedUnit) {
  return {
    unitCode: u.code,
    sheet: u.sheet,
    figures: u.figures ? { APC: u.figures.APC, LP: u.figures.LP, PDP: u.figures.PDP, NNPP: u.figures.NNPP } : null,
    registered: u.registered,
    accredited: u.accredited,
  };
}

/** Walks the chain in the order given, closing a checkpoint each time the local government changes. */
function chain(units: PublishedUnit[]): { head: string; checkpoints: Checkpoint[] } {
  const checkpoints: Checkpoint[] = [];
  let head = GENESIS_HASH;
  let open: Checkpoint | null = null;
  for (const u of units) {
    head = sha256Hex(head + canonicalJson(entryOf(u)));
    const areaCode = u.code.slice(0, 5);
    if (!open || open.areaCode !== areaCode) {
      open = { areaCode, name: u.lga, units: 0, hash: head };
      checkpoints.push(open);
    }
    open.units++;
    open.hash = head;
  }
  return { head, checkpoints };
}

/** Seals the published results as they stand. Entries are taken in the order given (unit-code order). */
export function sealLog(units: PublishedUnit[], sealedAt = new Date().toISOString()): Seal {
  const { head, checkpoints } = chain(units);
  return { sealedAt, length: units.length, head, checkpoints };
}

/** Recomputes the chain and checks it against a seal. */
export function verifyLog(units: PublishedUnit[], seal: Seal): LogReport {
  const now = chain(units);
  const checkpoints: CheckpointReport[] = seal.checkpoints.map((sealed, i) => {
    const found = now.checkpoints[i];
    const ok = !!found && found.areaCode === sealed.areaCode && found.units === sealed.units && found.hash === sealed.hash;
    return { areaCode: sealed.areaCode, name: sealed.name, units: found?.areaCode === sealed.areaCode ? found.units : sealed.units, ok };
  });
  // Local governments that appear now but were never sealed.
  for (const extra of now.checkpoints.slice(seal.checkpoints.length)) {
    checkpoints.push({ areaCode: extra.areaCode, name: extra.name, units: extra.units, ok: false });
  }
  const firstBreak = checkpoints.find((c) => !c.ok)?.areaCode ?? null;
  return {
    ok: firstBreak === null && now.head === seal.head && units.length === seal.length,
    length: units.length,
    head: now.head,
    expectedHead: seal.head,
    checkpoints,
    firstBreak,
  };
}
