import { describe, expect, it } from "vitest";
import { ask } from "@/lib/notes";
import { parseResearch, parseTranslation } from "@/lib/notes/prompt";
import { findRecorded, RecordedResearcher, similarity } from "@/lib/notes/recorded";
import type { Note, Researcher } from "@/lib/notes/types";

const note = (over: Partial<Note>): Note => ({
  id: "rumour-abc.en",
  kind: "rumour",
  asked: "Was voting extended in Rivers State?",
  lang: "en",
  found: ["INEC said voting continued in some units."],
  questions: [],
  sources: [{ title: "INEC statement", url: "https://example.org/inec", publisher: "INEC" }],
  strength: "well_reported",
  strengthLine: "Stated by INEC and reported by two outlets.",
  steps: ["Searched the web"],
  researchedAt: "2026-11-19T20:00:00.000Z",
  recorded: true,
  ...over,
});

describe("reading the researcher's reply", () => {
  const reply = (o: object) => `Here is the note:\n${JSON.stringify(o)}\nDone.`;
  const body = { found: ["One.", "Two."], questions: ["Why?"], strength: "disputed", strengthLine: "Sources disagree.", steps: ["Searched"] };

  it("takes the JSON object out of surrounding text", () => {
    const n = parseResearch(reply({ ...body, sources: [{ title: "T", url: "https://bbc.com/news/1", publisher: "BBC", date: "2023-04-03" }] }));
    expect(n.found).toEqual(["One.", "Two."]);
    expect(n.strength).toBe("disputed");
    expect(n.sources).toEqual([{ title: "T", url: "https://bbc.com/news/1", publisher: "BBC", date: "2023-04-03" }]);
  });

  it("drops sources without a real web address and names the publisher from the address when missing", () => {
    const n = parseResearch(reply({ ...body, sources: [{ title: "bad", url: "javascript:alert(1)" }, { title: "ok", url: "https://www.punchng.com/x" }] }));
    expect(n.sources).toEqual([{ title: "ok", url: "https://www.punchng.com/x", publisher: "punchng.com" }]);
  });

  it("never lets a note with no sources claim to be reported", () => {
    expect(parseResearch(reply({ ...body, strength: "well_reported", sources: [] })).strength).toBe("nothing_found");
  });

  it("refuses a reply with no findings or no JSON", () => {
    expect(() => parseResearch(reply({ ...body, found: [] }))).toThrow();
    expect(() => parseResearch("I could not do this.")).toThrow();
  });

  it("keeps the original wording when a translation comes back in the wrong shape", () => {
    const original = note({ found: ["A.", "B."] });
    const t = parseTranslation(JSON.stringify({ asked: "Dem extend voting?", found: ["Only one"], strengthLine: "INEC talk am." }), original, "pcm");
    expect(t).toMatchObject({ id: "rumour-abc.pcm", lang: "pcm", asked: "Dem extend voting?", found: ["A.", "B."], strengthLine: "INEC talk am." });
    expect(t.sources).toEqual(original.sources);
  });
});

describe("recorded notes", () => {
  const notes = [
    note({}),
    note({ id: "rumour-abc.pcm", lang: "pcm", asked: "Dem extend voting for Rivers State?" }),
    note({ id: "mismatch-32-15.en", kind: "mismatch", about: "32/15", asked: "Why do the announced results for Obio/Akpor differ?" }),
  ];

  it("scores wording by shared words", () => {
    expect(similarity("Was voting extended in Rivers State?", "was voting extended in rivers state")).toBe(1);
    expect(similarity("Was voting extended in Rivers State?", "Who won the football match?")).toBeLessThan(0.2);
  });

  it("matches a mismatch by its area and a rumour by its wording", () => {
    expect(findRecorded(notes, { question: "", lang: "en", about: "32/15" })?.id).toBe("mismatch-32-15.en");
    expect(findRecorded(notes, { question: "was voting extended in Rivers state", lang: "en" })?.id).toBe("rumour-abc.en");
    expect(findRecorded(notes, { question: "something unrelated entirely", lang: "en" })).toBeNull();
    expect(findRecorded(notes, { question: "", lang: "en", about: "32/21" })).toBeNull();
  });

  it("answers in the voter's language when that was recorded, otherwise in English", () => {
    expect(findRecorded(notes, { question: "Was voting extended in Rivers State?", lang: "pcm" })?.id).toBe("rumour-abc.pcm");
    expect(findRecorded(notes, { question: "Was voting extended in Rivers State?", lang: "ha" })?.id).toBe("rumour-abc.en");
  });
});

describe("asking", () => {
  const recorded = new RecordedResearcher([note({})]);
  const req = { question: "Was voting extended in Rivers State?", lang: "en" as const };
  const live = (fn: Researcher["research"]): Researcher => ({ mode: "live", research: fn });

  it("serves a recorded note, marked as recorded, where live research is off", async () => {
    const out = await ask(req, { recorded });
    expect(out).toMatchObject({ status: "note", note: { recorded: true } });
  });

  it("says plainly when a question needs live research", async () => {
    expect(await ask({ question: "A brand new rumour nobody recorded", lang: "en" }, { recorded })).toEqual({ status: "live_only" });
  });

  it("prefers live research when it is on", async () => {
    const fresh = note({ id: "fresh", recorded: false });
    expect(await ask(req, { recorded, live: live(async () => fresh) })).toEqual({ status: "note", note: fresh });
  });

  it("falls back to a recorded note when live research fails, and reports the failure when there is none", async () => {
    const broken = live(async () => {
      throw new Error("no network");
    });
    expect(await ask(req, { recorded, live: broken })).toMatchObject({ status: "note", note: { recorded: true } });
    expect(await ask({ question: "Unrecorded question about ballots", lang: "en" }, { recorded, live: broken })).toEqual({ status: "failed", message: "no network" });
  });
});
