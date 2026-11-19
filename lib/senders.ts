import { sha256Hex } from "@/lib/chain/hash";

/**
 * Salted SHA-256 of the sender's address. The same phone hashes the same over WhatsApp and SMS.
 * The raw number is never stored or logged.
 */
export function normalizeAddress(address: string): string {
  return address
    .trim()
    .replace(/^whatsapp:/i, "")
    .replace(/[\s()-]/g, "")
    .toLowerCase();
}

export function hashSender(address: string, salt: string): string {
  if (!salt) throw new Error("Sender salt is empty");
  return sha256Hex(`${salt}:${normalizeAddress(address)}`);
}

/** Short, non-reversible label for UIs and logs. */
export function shortHash(h: string): string {
  return h.slice(0, 8);
}
