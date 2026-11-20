"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AskOutcome } from "@/lib/notes";
import type { Note, NoteStrength } from "@/lib/notes/types";
import type { Lang } from "@/lib/types";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "pcm", label: "Pidgin" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
];

const STRENGTH: Record<NoteStrength, { label: string; tone: string }> = {
  well_reported: { label: "Well reported", tone: "bg-gl text-gr" },
  partly_reported: { label: "Partly reported", tone: "bg-al text-am" },
  disputed: { label: "Sources disagree", tone: "bg-al text-am" },
  nothing_found: { label: "Nothing reliable found", tone: "bg-bg text-mu" },
};

const WAITING = ["Searching the web", "Reading the reports", "Checking what people are posting", "Comparing the sources", "Writing the note"];

type Turn =
  | { id: number; role: "voter"; text: string }
  | { id: number; role: "working"; steps: string[]; shown: number }
  | { id: number; role: "note"; note: Note; shown: number }
  | { id: number; role: "info"; text: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const when = (iso: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

function NoteCard({ note, shown }: { note: Note; shown: number }) {
  const s = STRENGTH[note.strength];
  // Parts appear one after another: paragraphs, then the open questions, then the sources.
  const parts = note.found.length;
  return (
    <article className="pop card !p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span>
        <span className="text-xs text-mu">{note.recorded ? `Recorded research · ${when(note.researchedAt)}` : "Researched just now"}</span>
      </div>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed">
        {note.found.slice(0, shown).map((p, i) => (
          <p key={i} className="pop">
            {p}
          </p>
        ))}
      </div>
      {shown > parts && note.strengthLine && <p className="pop mt-3 text-sm font-medium">{note.strengthLine}</p>}
      {shown > parts && note.questions.length > 0 && (
        <div className="pop mt-4">
          <h3 className="eyebrow">Still open</h3>
          <ul className="mt-1.5 space-y-1.5 text-[15px]">
            {note.questions.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-mu">
                  ?
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {shown > parts + 1 && (
        <div className="pop mt-4">
          <h3 className="eyebrow">Sources</h3>
          {note.sources.length === 0 ? (
            <p className="mt-1.5 text-sm text-mu">No reliable source was found.</p>
          ) : (
            <ol className="rows mt-1">
              {note.sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noreferrer" className="block py-2.5 text-tx no-underline">
                    <span className="block text-sm font-medium text-gr">{src.publisher}</span>
                    <span className="block text-sm text-mu">
                      {src.title}
                      {src.date ? ` · ${src.date}` : ""}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-mu">Tallie describes what has been reported. It does not rule on who is right.</p>
        </div>
      )}
    </article>
  );
}

export function Ask({ suggestions, initial }: { suggestions: string[]; initial?: { question: string; about: string } }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const bottom = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tally.lang") as Lang | null;
      if (saved && LANGS.some((l) => l.code === saved)) setLang(saved);
    } catch {}
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const patch = (id: number, change: Partial<Turn>) => setTurns((ts) => ts.map((t) => (t.id === id ? ({ ...t, ...change } as Turn) : t)));

  const send = useCallback(
    async (question: string, about?: string, useLang: Lang = lang) => {
      if (busy || (!question.trim() && !about)) return;
      setBusy(true);
      setText("");
      const voterId = nextId.current++;
      const workId = nextId.current++;
      setTurns((ts) => [...ts, { id: voterId, role: "voter", text: question }, { id: workId, role: "working", steps: WAITING, shown: 1 }]);

      // While waiting, walk through generic steps so the voter can see work is happening.
      let waiting = true;
      (async () => {
        for (let i = 2; waiting && i <= WAITING.length; i++) {
          await sleep(2600);
          if (waiting) patch(workId, { shown: i });
        }
      })();

      let outcome: AskOutcome;
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, lang: useLang, about }),
        });
        outcome = (await res.json()) as AskOutcome;
      } catch {
        outcome = { status: "failed", message: "Could not reach Tallie. Check your connection and try again." };
      }
      waiting = false;

      if (outcome.status !== "note") {
        const info =
          outcome.status === "live_only"
            ? "Nobody has researched this one yet. Live research runs where Tallie is set up on a computer; here you can open the questions that were researched earlier."
            : `The research did not finish: ${outcome.message}`;
        setTurns((ts) => ts.filter((t) => t.id !== workId).concat({ id: nextId.current++, role: "info", text: info }));
        setBusy(false);
        return;
      }

      // Show what the researcher actually did, then reveal the note part by part.
      const { note } = outcome;
      const steps = note.steps.length ? note.steps : WAITING;
      patch(workId, { steps, shown: 0 });
      for (let i = 1; i <= steps.length; i++) {
        await sleep(note.recorded ? 750 : 250);
        patch(workId, { shown: i });
      }
      await sleep(500);
      const noteId = nextId.current++;
      setTurns((ts) => ts.filter((t) => t.id !== workId).concat({ id: noteId, role: "note", note, shown: 0 }));
      for (let i = 1; i <= note.found.length + 2; i++) {
        await sleep(650);
        patch(noteId, { shown: i });
      }
      setBusy(false);
    },
    [busy, lang],
  );

  // Arriving from a mismatch in the count: ask about it straight away.
  useEffect(() => {
    if (initial && !started.current) {
      started.current = true;
      let saved: Lang = "en";
      try {
        const l = localStorage.getItem("tally.lang") as Lang | null;
        if (l && LANGS.some((x) => x.code === l)) saved = l;
      } catch {}
      void send(initial.question, initial.about, saved);
    }
  }, [initial, send]);

  /** Types a suggested question into the box, then sends it. */
  async function typeAndSend(q: string) {
    if (busy) return;
    for (let i = 1; i <= q.length; i++) {
      setText(q.slice(0, i));
      await sleep(14);
    }
    await sleep(250);
    void send(q);
  }

  function chooseLang(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem("tally.lang", l);
    } catch {}
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 pb-3 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="text-[30px] font-bold">When a rumour spreads</h1>
        <p className="mt-1 text-[15px] text-mu">Heard something? Tallie checks what has been reported and shows its sources.</p>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Answer language">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              aria-pressed={lang === l.code}
              onClick={() => chooseLang(l.code)}
              className={`chip shrink-0 ${lang === l.code ? "!border-tx !bg-tx !text-sf" : ""}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-3 px-4 pb-4" aria-live="polite">
        {turns.length === 0 && (
          <div className="space-y-2 pt-1">
            <p className="eyebrow px-1">Try one</p>
            {suggestions.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => void typeAndSend(q)}
                style={{ animationDelay: `${i * 70}ms` }}
                className="pop card block w-full cursor-pointer !p-4 text-left text-[15px] font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {turns.map((t) => {
          if (t.role === "voter")
            return (
              <p key={t.id} className="pop ml-auto w-fit max-w-[86%] rounded-3xl rounded-br-lg bg-tx px-4 py-2.5 text-[15px] text-sf">
                {t.text}
              </p>
            );
          if (t.role === "info")
            return (
              <p key={t.id} className="pop card !p-4 text-[15px] text-mu">
                {t.text}
              </p>
            );
          if (t.role === "working")
            return (
              <div key={t.id} className="pop card !p-4">
                <ol className="space-y-2 text-[15px]">
                  {t.steps.slice(0, Math.max(1, t.shown)).map((s, i, arr) => {
                    const current = i === arr.length - 1;
                    return (
                      <li key={i} className={`pop flex gap-2.5 ${current ? "text-tx" : "text-mu"}`}>
                        <span aria-hidden className={`mt-[7px] size-2 shrink-0 rounded-full ${current ? "animate-pulse bg-gr" : "bg-ln"}`} />
                        <span>{s}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          return <NoteCard key={t.id} note={t.note} shown={t.shown} />;
        })}
        <div ref={bottom} />
      </div>

      <form
        className="sticky bottom-0 flex items-end gap-2 border-t border-ln bg-bg/95 px-4 py-3 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <label htmlFor="ask" className="sr-only">
          What did you hear?
        </label>
        <input
          id="ask"
          className="field flex-1"
          placeholder="What did you hear?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={400}
          autoComplete="off"
        />
        <button className="btn !min-h-12 !px-4" type="submit" disabled={busy || !text.trim()} aria-label="Ask">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
