/**
 * Everything Tallie cannot actually access sits behind one of these interfaces.
 * No INEC data access is assumed.
 */

export interface CardStatus {
  ready: boolean;
  assignedUnit: string;
  /** Set when the voter's unit changed since they registered. */
  previousUnit: string | null;
  note: string | null;
}

export interface VoterLookupProvider {
  readonly name: string;
  readonly mocked: boolean;
  /** A real lookup would need far more than 4 digits (and INEC's cooperation). */
  lookupCard(last4: string): Promise<CardStatus | null>;
}

export interface Delivery {
  delivered: boolean;
  via: string;
}

export interface MessagingProvider {
  readonly name: string;
  /** `to` is the raw channel address (e.g. "whatsapp:+234..."). It must never be logged or stored. */
  send(to: string, body: string): Promise<Delivery>;
}
