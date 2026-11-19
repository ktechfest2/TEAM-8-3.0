import { LocalAgentResearcher } from "./localAgent";
import { RecordedResearcher } from "./recorded";
import type { Note, Researcher, ResearchRequest } from "./types";

export type { Note, NoteSource, NoteStrength, Researcher, ResearchRequest } from "./types";

/** Live research needs a local machine with Claude Code and Agent Reach. Turn it on with TALLY_RESEARCH=live. */
export const liveResearchEnabled = () => process.env.TALLY_RESEARCH === "live";

export type AskOutcome = { status: "note"; note: Note } | { status: "live_only" } | { status: "failed"; message: string };

/**
 * Answers a rumour or a mismatch with a note. Where live research is on, it researches now and falls back to a
 * recorded note if the run fails. Elsewhere it serves a recorded note, or says plainly that this needs live research.
 */
export async function ask(
  req: ResearchRequest,
  researchers: { live?: Researcher; recorded: Researcher } = {
    live: liveResearchEnabled() ? new LocalAgentResearcher() : undefined,
    recorded: new RecordedResearcher(),
  },
): Promise<AskOutcome> {
  let failure: string | null = null;
  if (researchers.live) {
    try {
      const note = await researchers.live.research(req);
      if (note) return { status: "note", note };
    } catch (e) {
      failure = (e as Error).message;
    }
  }
  const saved = await researchers.recorded.research(req);
  if (saved) return { status: "note", note: saved };
  return failure ? { status: "failed", message: failure } : { status: "live_only" };
}
