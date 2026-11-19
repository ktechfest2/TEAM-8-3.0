import type { Lang } from "@/lib/types";

/**
 * How solid the public reporting behind a note is. This grades the evidence, never the people involved:
 * a note describes what has been reported and does not rule on who is right (GLOSSARY.md: Note).
 */
export type NoteStrength = "well_reported" | "partly_reported" | "disputed" | "nothing_found";

export const NOTE_STRENGTHS: NoteStrength[] = ["well_reported", "partly_reported", "disputed", "nothing_found"];

export interface NoteSource {
  title: string;
  url: string;
  publisher: string;
  /** As printed by the source, if it gives one. */
  date?: string;
}

export interface Note {
  id: string;
  /** A rumour a voter asked about, or a mismatch in the count trail. */
  kind: "rumour" | "mismatch";
  /** The question as the voter put it. */
  asked: string;
  lang: Lang;
  /** What public reporting says, in short paragraphs. */
  found: string[];
  /** Questions the reporting leaves open. */
  questions: string[];
  sources: NoteSource[];
  strength: NoteStrength;
  /** One sentence saying why the evidence gets that grade. */
  strengthLine: string;
  /** What the researcher did, in order, in plain words. */
  steps: string[];
  researchedAt: string;
  /** True when this note was saved from an earlier research run rather than researched just now. */
  recorded: boolean;
  /** Area code, for a note about a mismatch. */
  about?: string;
}

export interface ResearchRequest {
  question: string;
  lang: Lang;
  /** Area code when the question is about a mismatch in the count trail. */
  about?: string;
}

/** The seam between Tally and whatever does the research. Two adapters: live (local agent) and recorded. */
export interface Researcher {
  readonly mode: "live" | "recorded";
  /** Null means this researcher has no note for the request. */
  research(req: ResearchRequest): Promise<Note | null>;
}
