import recorded from "@/data/notes/recorded.json";
import type { Note, Researcher, ResearchRequest } from "./types";

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );

/** Share of words two questions have in common (Jaccard). */
export function similarity(a: string, b: string): number {
  const x = words(a);
  const y = words(b);
  if (x.size === 0 || y.size === 0) return 0;
  let both = 0;
  for (const w of x) if (y.has(w)) both++;
  return both / (x.size + y.size - both);
}

const CLOSE_ENOUGH = 0.6;

/**
 * Picks the recorded note for a request. A mismatch is matched by its area; a rumour by how close the wording is.
 * The voter's language wins; English is the fallback, since every note is recorded in English first.
 */
export function findRecorded(notes: Note[], req: ResearchRequest): Note | null {
  const pick = (candidates: Note[]) => candidates.find((n) => n.lang === req.lang) ?? candidates.find((n) => n.lang === "en") ?? null;

  if (req.about) return pick(notes.filter((n) => n.kind === "mismatch" && n.about === req.about));

  // Translations of one note share an id stem ("<stem>.<lang>"), so match on the wording in any language.
  const stemOf = (n: Note) => n.id.replace(/\.[a-z]{2,3}$/, "");
  const best = notes
    .filter((n) => n.kind === "rumour")
    .map((n) => ({ n, score: similarity(n.asked, req.question) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < CLOSE_ENOUGH) return null;
  return pick(notes.filter((n) => stemOf(n) === stemOf(best.n)));
}

export const recordedNotes = (): Note[] => recorded as Note[];

/** Serves notes saved from earlier real research runs. Used wherever live research cannot run (docs/adr/0003). */
export class RecordedResearcher implements Researcher {
  readonly mode = "recorded" as const;
  constructor(private readonly notes: Note[] = recordedNotes()) {}

  async research(req: ResearchRequest): Promise<Note | null> {
    const hit = findRecorded(this.notes, req);
    return hit ? { ...hit, recorded: true } : null;
  }
}
