"use client";

// The three walkthroughs on the landing page. Each one plays by itself like a screen recording:
// it types, taps and shows what comes back, with a caption saying what is happening and why it
// matters. Nothing is fetched while it plays. Every value on screen is handed in by the page,
// which reads it from the same data and recorded notes the app uses.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Frame = {
  title: string;
  text: string;
  /** The one thing to remember from this step. */
  point?: string;
  /** How long the step stays up once any typing in it has finished. */
  ms: number;
  /** Typing or a list filling in: how many small steps, and how fast. */
  ticks?: number;
  tickMs?: number;
};

type Finding = "consistent" | "open" | "unexplained";

export type ReelData = {
  morning: {
    vin: string;
    unit: { name: string; ward: string; lga: string; code: string };
    moved: string;
  };
  results: {
    election: string;
    read: string;
    total: string;
    pct: number;
    areas: number;
    groups: { finding: Finding; title: string }[];
    flagged: { name: string; party: string; sheets: string; announced: string }[];
    area: {
      name: string;
      coverage: string;
      pct: number;
      rows: { party: string; sheets: string; announced: string; sheetsPct: number; announcedPct: number; finding: Finding; label: string; reason?: string }[];
      wards: { name: string; line: string }[];
      wardCount: number;
    };
    note: { steps: string[]; first: string; strength: string; sources: { publisher: string; title: string }[] };
  };
  rumours: {
    asked: string;
    steps: string[];
    strength: string;
    first: string;
    sources: { publisher: string; title: string }[];
    pidgin: { asked: string; first: string };
  };
};

const END: Frame = {
  title: "This is what you get on your own computer.",
  text: "Nothing here is staged. The same figures and the same note come back when you run Tallie yourself.",
  ms: 0,
};

/* ---------- the player ---------- */

function usePlayer(frames: Frame[], active: boolean) {
  const [f, setF] = useState(0);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = frames.length - 1;

  // Play by itself whenever the walkthrough is on screen, unless the viewer prefers no motion.
  useEffect(() => {
    if (!active) {
      setPlaying(false);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setF((cur) => {
      if (cur < last) setPlaying(true);
      return cur;
    });
  }, [active, last]);

  useEffect(() => {
    if (!playing) return;
    const fr = frames[f];
    if (tick < (fr.ticks ?? 0)) {
      const id = setTimeout(() => setTick((t) => t + 1), fr.tickMs ?? 45);
      return () => clearTimeout(id);
    }
    if (f >= frames.length - 1) return setPlaying(false);
    const id = setTimeout(() => {
      setF(f + 1);
      setTick(0);
    }, fr.ms);
    return () => clearTimeout(id);
  }, [playing, f, tick, frames]);

  /** Jump to a step, shown complete. */
  const go = useCallback(
    (i: number) => {
      const to = Math.max(0, Math.min(frames.length - 1, i));
      setPlaying(false);
      setF(to);
      setTick(frames[to].ticks ?? 0);
    },
    [frames],
  );
  const toggle = () => {
    if (f >= frames.length - 1) {
      setF(0);
      setTick(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };
  return { f, tick, playing, go, toggle, done: f >= frames.length - 1 };
}

/* ---------- small pieces of the phone ---------- */

const hot = (on: boolean) => (on ? " rl-hot" : "");
const tap = (on: boolean) => (on ? " rl-tap" : "");

function Tabs({ on }: { on: 0 | 1 | 2 }) {
  return (
    <div className="grid shrink-0 grid-cols-4 border-t border-ln bg-sf text-center text-[10px] font-medium text-mu">
      {["Election", "Results", "Rumours", "More"].map((t, i) => (
        <span key={t} className={`py-3 ${i === on ? "text-gr" : ""}`}>
          <span aria-hidden className={`mx-auto mb-1 block size-1.5 rounded-full ${i === on ? "bg-gr" : "bg-ln"}`} />
          {t}
        </span>
      ))}
    </div>
  );
}

function Screen({ tab, children, shift = 0 }: { tab: 0 | 1 | 2; children: React.ReactNode; shift?: number }) {
  return (
    <div className="flex h-full flex-col bg-bg text-left text-tx">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="rl-scroll px-4 pb-6 pt-5" style={{ transform: `translateY(-${shift}px)` }}>
          {children}
        </div>
      </div>
      <Tabs on={tab} />
    </div>
  );
}

const PILL: Record<Finding, string> = { consistent: "bg-gl text-gr", open: "bg-bg text-mu", unexplained: "bg-al text-am" };
const DOT: Record<Finding, string> = { unexplained: "bg-am", consistent: "bg-gr", open: "bg-mu" };

/* ---------- 1. Election morning ---------- */

function morningFrames(d: ReelData["morning"]): Frame[] {
  return [
    { title: "Election morning.", text: "Amaka wants to know where she votes before she leaves home.", ms: 2600 },
    {
      title: "She types the number on her voter's card.",
      text: "Tallie uses it for this one lookup and never stores it. It remembers her polling unit, not her card.",
      point: "Private by design",
      ms: 1800,
      ticks: d.vin.length,
      tickMs: 70,
    },
    { title: "She taps Check.", text: "Tallie looks up the card and the polling unit it is assigned to.", ms: 1300 },
    {
      title: "Her card is valid, and her polling unit has moved.",
      text: "She finds out now, not at the wrong gate. In this prototype the lookup is simulated: a real one needs INEC's cooperation.",
      point: "She knows before she sets out",
      ms: 5200,
    },
    {
      title: "Voters already there say what they see.",
      text: "Officials arrived, accreditation started, long queue. One voter's report stays unverified until a second voter says the same.",
      point: "No single voice is taken as fact",
      ms: 5200,
    },
    { title: "She adds her own report in one tap.", text: "Her report makes it two, so it is no longer unverified. Each voter counts once.", ms: 4200 },
    END,
  ];
}

function MorningScreen({ d, f, tick }: { d: ReelData["morning"]; f: number; tick: number }) {
  const typed = f < 1 ? "" : f === 1 ? d.vin.slice(0, tick) : d.vin;
  const reports = [
    { label: "Officials have arrived", count: "3 voters", warn: false, mine: false },
    { label: "Accreditation has started", count: f >= 5 ? "2 voters" : "1 voter · unverified", warn: f < 5, mine: true },
    { label: "There is a long queue", count: "No reports yet", warn: false, mine: false },
  ];
  return (
    <Screen tab={0} shift={f >= 4 ? 150 : 0}>
      <h4 className="text-[26px] font-bold">Election morning</h4>
      <p className="mt-1 text-sm text-mu">Where you vote, and whether your polling unit has opened.</p>

      {f < 3 ? (
        <div className="card mt-4">
          <p className="eyebrow">My polling unit</p>
          <p className="mt-2 text-lg font-semibold">Is my card valid? Did my unit move?</p>
          <p className="mt-3 text-xs text-mu">Voter identification number, on the front of your card</p>
          <div className={`field num mt-1.5 flex items-center tracking-[0.06em]${hot(f === 1)}`}>
            {typed || <span className="text-mu">0000 0000 0000 0000 000</span>}
            {f === 1 && <span className="rl-caret" aria-hidden />}
          </div>
          <div className={`btn mt-2 w-full${tap(f === 2)} ${typed.length < d.vin.length ? "opacity-50" : ""}`}>{f === 2 ? "Checking" : "Check"}</div>
        </div>
      ) : (
        <>
          <div className={`card pop mt-4${hot(f === 3)}`}>
            <p className="eyebrow">My polling unit</p>
            <p className="mt-1 text-xl font-semibold leading-tight">{d.unit.name}</p>
            <p className="mt-1 text-[13px] text-mu">
              {d.unit.ward} ward · {d.unit.lga} · <span className="num">{d.unit.code}</span>
            </p>
            <p className="card-ok mt-3 text-sm">Your card is valid.</p>
            <p className="card-warn mt-2 text-sm">Your polling unit moved here. {d.moved}</p>
          </div>
          <div className={`card pop mt-4${hot(f === 4)}`}>
            <p className="eyebrow">Happening now</p>
            <ul className="rows mt-1">
              {reports.map((r) => (
                <li key={r.label} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{r.label}</div>
                    <div className={`num text-xs ${r.warn ? "text-am" : "text-mu"}`}>{r.count}</div>
                  </div>
                  <span className={`chip shrink-0 !min-h-8 !px-3 text-xs${tap(r.mine && f === 5)} ${r.mine && f >= 5 ? "opacity-60" : ""}`}>
                    {r.mine && f >= 5 ? "Counted" : "I see this"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Screen>
  );
}

/* ---------- 2. After the results ---------- */

function resultsFrames(d: ReelData["results"]): Frame[] {
  const top = d.flagged[0];
  return [
    {
      title: "This is a real election.",
      text: `${d.election}: ${d.total} polling units, with the figures read from the result sheets INEC published.`,
      point: "Run on real data, not a mock-up",
      ms: 5200,
    },
    {
      title: "Tallie says how much it could read.",
      text: `${d.read} of ${d.total} sheets were readable. Every sum is built only on those, and the number is shown beside it.`,
      point: "Honest about coverage",
      ms: 5000,
    },
    {
      title: `It adds the sheets up for all ${d.areas} local governments.`,
      text: "Then it puts each sum beside what was announced. This is plain arithmetic: no AI model touches an election figure.",
      point: "No AI in the count",
      ms: 5400,
    },
    { title: `Two do not add up. Open ${top.name}.`, text: "The rest either add up, or have too few readable sheets to tell.", ms: 2400 },
    {
      title: `${top.sheets} on the sheets. ${top.announced} announced.`,
      text: `That is ${top.party} in ${top.name}: the published result sheets beside the announced figure, drawn to the same scale.`,
      ms: 5200,
    },
    {
      title: "Why it is flagged.",
      text: "Sheets that are still missing could only add votes. They cannot explain a sum that is already higher than what was announced.",
      point: "Flagged only when missing sheets cannot explain it",
      ms: 5600,
    },
    {
      title: "Every figure can be followed down.",
      text: "Local government to ward to polling unit, and from there to the photo of the result sheet itself.",
      point: "Anyone can check the working",
      ms: 4600,
    },
    { title: "What was reported about this?", text: "A mismatch can have a lawful cause: a cancelled result, a court order, a rerun. So Tallie researches it.", ms: 2600 },
    {
      title: "A research agent goes and reads.",
      text: "It searches the web, opens the reports and checks social media. Each line is something it actually did.",
      ms: 1800,
      ticks: d.note.steps.length,
      tickMs: 950,
    },
    {
      title: "It reports what it found, not a verdict.",
      text: "The note says what was reported, by whom and how solid it is. Tallie never names a winner or tells anyone what to believe.",
      point: "Findings, with sources",
      ms: 6200,
    },
    END,
  ];
}

function ResultsScreen({ d, f, tick }: { d: ReelData["results"]; f: number; tick: number }) {
  if (f <= 3) {
    return (
      <Screen tab={1}>
        <h4 className="text-[26px] font-bold">After the results</h4>
        <p className="mt-1 text-sm text-mu">Do the result sheets add up to what was announced?</p>
        <div className={`mt-4 rounded-3xl bg-tx p-4 text-bg${hot(f === 0)}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ac">Run on real data</p>
          <p className="mt-1 text-lg font-bold leading-tight">{d.election}</p>
          <div className={`mt-3 h-2 overflow-hidden rounded-full bg-bg${hot(f === 1)}`}>
            <div className="h-full rounded-full bg-gr" style={{ width: `${d.pct}%` }} />
          </div>
          <p className="num mt-1.5 text-xs opacity-80">
            {d.read} of {d.total} result sheets read ({d.pct}%)
          </p>
        </div>
        <div className={`mt-4 space-y-2.5${hot(f === 2)}`}>
          {d.groups.map((g) => (
            <div key={g.finding} className="card !p-0">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <span aria-hidden className={`size-2.5 rounded-full ${DOT[g.finding]}`} />
                <span className="font-semibold">{g.title}</span>
              </div>
              {g.finding === "unexplained" && (
                <ul className="rows border-t border-ln">
                  {d.flagged.map((a, i) => (
                    <li key={a.name} className={`px-4 py-2.5${tap(i === 0 && f === 3)}`}>
                      <div className="font-medium">{a.name}</div>
                      <div className="num mt-0.5 flex justify-between text-xs text-mu">
                        <span>{a.party} · Sheets</span>
                        <span className="font-semibold text-tx">{a.sheets}</span>
                      </div>
                      <div className="num flex justify-between text-xs text-mu">
                        <span className="pl-[2.1rem]">Announced</span>
                        <span className="font-semibold text-am">{a.announced}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  if (f <= 7) {
    return (
      <Screen tab={1} shift={f === 6 ? 250 : 0}>
        <p className="text-sm font-medium text-gr">‹ Results</p>
        <h4 className="mt-1 text-[26px] font-bold">{d.area.name}</h4>
        <p className="text-sm text-mu">Local government</p>
        <div className={`btn mt-3 w-full !min-h-11 text-sm${tap(f === 7)}`}>See what was reported about this</div>
        <div className="card mt-3 !py-3">
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-gr" style={{ width: `${d.area.pct}%` }} />
          </div>
          <p className="num mt-1.5 text-xs font-medium">{d.area.coverage}</p>
        </div>
        <div className="card rows mt-3 !py-1">
          {d.area.rows.map((r) => (
            <div key={r.party} className={`py-3${hot(r.finding === "unexplained" && (f === 4 || f === 5))}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{r.party}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PILL[r.finding]}`}>{r.label}</span>
              </div>
              <div className="num mt-2 flex justify-between text-xs">
                <span className="text-mu">Sheets add up to</span>
                <span className="font-semibold">{r.sheets}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-bg">
                <div className="grow-x h-full rounded-full bg-tx" style={{ width: `${r.sheetsPct}%` }} />
              </div>
              <div className="num mt-2 flex justify-between text-xs">
                <span className="text-mu">Announced</span>
                <span className="font-semibold">{r.announced}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-bg">
                <div className="grow-x h-full rounded-full bg-ac" style={{ width: `${r.announcedPct}%` }} />
              </div>
              {r.reason && <p className={`mt-2 text-xs font-medium text-am${hot(f === 5)}`}>{r.reason}</p>}
            </div>
          ))}
        </div>
        <div className={`card mt-3 !p-0${hot(f === 6)}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold">{d.area.wardCount} wards</span>
            <span className="text-xs text-mu">{f >= 6 ? "Hide" : "Show"}</span>
          </div>
          {f >= 6 && (
            <ul className="rows border-t border-ln">
              {d.area.wards.map((w) => (
                <li key={w.name} className="pop px-4 py-2">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="num text-[11px] text-mu">{w.line}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen tab={2}>
      <h4 className="text-[22px] font-bold leading-tight">What was reported about {d.area.name}?</h4>
      {f === 8 ? (
        <Working steps={d.note.steps} shown={tick} />
      ) : (
        <NoteCard strength={d.note.strength} first={d.note.first} sources={d.note.sources} hotSources={false} hotText={f === 9} />
      )}
    </Screen>
  );
}

/* ---------- 3. When a rumour spreads ---------- */

function rumourFrames(d: ReelData["rumours"]): Frame[] {
  return [
    { title: "A voter hears something.", text: "Rumours move faster on election night than anyone can check them.", ms: 2600 },
    { title: "She types it the way she heard it.", text: "No form, no category. Just the question.", ms: 1400, ticks: d.asked.length, tickMs: 26 },
    { title: "She sends it.", text: "This starts a research run, not a chat reply.", ms: 1300 },
    {
      title: "Not a chatbot. An agent that goes and reads.",
      text: "Claude runs through Claude Code with Agent Reach, an open-source toolkit: web search, news pages, X, Reddit, Facebook and Instagram. Each line is something it did.",
      point: "A real research agent on open-source tools",
      ms: 2200,
      ticks: d.steps.length,
      tickMs: 1050,
    },
    {
      title: "Sources or nothing.",
      text: "Every statement must come from a page the agent opened. With no sources, the only thing it is allowed to say is that nothing reliable was found.",
      point: "It cannot make things up and pass",
      ms: 6200,
    },
    { title: "It shows where each thing came from.", text: "Fact-checkers, news reports, official statements. The voter can open any of them and read for herself.", point: "Checkable by anyone", ms: 5200 },
    { title: "She switches to Pidgin.", text: "The research is done once, then written in English, Pidgin, Hausa, Yorùbá and Igbo.", point: "In the voter's own language", ms: 5400 },
    {
      title: "It works under rules.",
      text: "It runs read-only in an empty folder. Text on a web page is evidence to weigh, never an instruction. And it describes the reporting without ruling on who is right.",
      point: "Safe to point at the open web",
      ms: 6200,
    },
    END,
  ];
}

function Working({ steps, shown }: { steps: string[]; shown: number }) {
  return (
    <div className="card mt-3 !p-4">
      <ol className="space-y-2 text-[13px]">
        {steps.slice(0, Math.max(1, shown)).map((s, i, arr) => {
          const current = i === arr.length - 1;
          return (
            <li key={s} className={`pop flex gap-2 ${current ? "text-tx" : "text-mu"}`}>
              <span aria-hidden className={`mt-[6px] size-2 shrink-0 rounded-full ${current ? "animate-pulse bg-gr" : "bg-ln"}`} />
              <span>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function NoteCard({ strength, first, sources, hotSources, hotText }: { strength: string; first: string; sources: { publisher: string; title: string }[]; hotSources: boolean; hotText: boolean }) {
  return (
    <div className="card pop mt-3 !p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-al px-2.5 py-1 text-[11px] font-semibold text-am">{strength}</span>
        <span className="text-[11px] text-mu">Recorded research</span>
      </div>
      <p className={`rl-clamp mt-3 text-[13px] leading-relaxed${hot(hotText)}`}>{first}</p>
      <div className={`mt-3${hot(hotSources)}`}>
        <p className="eyebrow !text-[11px]">Sources</p>
        <ol className="rows mt-0.5">
          {sources.map((s) => (
            <li key={s.title} className="py-1.5">
              <span className="block text-xs font-medium text-gr">{s.publisher}</span>
              <span className="block truncate text-[11px] text-mu">{s.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const LANGS = ["English", "Pidgin", "Hausa", "Yorùbá", "Igbo"];

function RumoursScreen({ d, f, tick }: { d: ReelData["rumours"]; f: number; tick: number }) {
  const pidgin = f >= 6;
  const typed = f < 1 ? "" : f === 1 ? d.asked.slice(0, tick) : "";
  const asked = pidgin ? d.pidgin.asked : d.asked;
  return (
    <Screen tab={2}>
      <h4 className="text-[22px] font-bold leading-tight">When a rumour spreads</h4>
      <div className="mt-2.5 flex gap-1.5 overflow-hidden">
        {LANGS.map((l, i) => {
          const on = pidgin ? i === 1 : i === 0;
          return (
            <span key={l} className={`chip shrink-0 !min-h-7 !px-2.5 text-[11px]${tap(i === 1 && f === 6)} ${on ? "!border-tx !bg-tx !text-sf" : ""}`}>
              {l}
            </span>
          );
        })}
      </div>

      {f >= 2 && <p className="pop ml-auto mt-3 w-fit max-w-[88%] rounded-3xl rounded-br-lg bg-tx px-3.5 py-2 text-[13px] text-sf">{asked}</p>}
      {f === 2 && <Working steps={["Starting the research"]} shown={1} />}
      {f === 3 && <Working steps={d.steps} shown={tick} />}
      {f >= 4 && <NoteCard strength={d.strength} first={pidgin ? d.pidgin.first : d.first} sources={d.sources} hotSources={f === 5} hotText={f === 4 || f === 6} />}

      {f < 2 && (
        <div className="mt-4 flex items-end gap-2">
          <div className={`field flex min-h-12 flex-1 items-center py-2 text-[13px] leading-snug${hot(f === 1)}`}>
            {typed || <span className="text-mu">What did you hear?</span>}
            {f === 1 && <span className="rl-caret" aria-hidden />}
          </div>
          <div className={`btn !min-h-12 !px-4${tap(f === 1 && tick >= d.asked.length)}`}>↑</div>
        </div>
      )}
    </Screen>
  );
}

/* ---------- one walkthrough ---------- */

type Part = { id: string; name: string; question: string };

function Walkthrough({ part, n, frames, active, children }: { part: Part; n: number; frames: Frame[]; active: boolean; children: (f: number, tick: number) => React.ReactNode }) {
  const { f, tick, playing, go, toggle, done } = usePlayer(frames, active);
  const fr = frames[f];
  return (
    <article id={part.id} className="rl-slide" aria-label={`${part.name}: ${part.question}`}>
      <div className="rl-grid">
        <div className="rl-text">
          <p className="tl-label">
            {String(n + 1).padStart(2, "0")} · {part.name}
          </p>
          <h3 className="tl-question">{part.question}</h3>

          <div className="rl-caption" aria-live="polite">
            <p className="rl-step">
              Step {f + 1} of {frames.length}
            </p>
            <p key={`t${f}`} className="rl-caption-title">
              {fr.title}
            </p>
            <p key={`x${f}`} className="rl-caption-text">
              {fr.text}
            </p>
            {fr.point && (
              <p key={`p${f}`} className="rl-point">
                {fr.point}
              </p>
            )}
            {done && (
              <Link href="/setup" className="tl-button rl-cta">
                Run it yourself <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>

          <div className="rl-controls">
            <button type="button" className="rl-play" onClick={toggle} aria-label={done ? "Play again" : playing ? "Pause" : "Play"}>
              {done ? "↻" : playing ? "❚❚" : "▶"}
            </button>
            <div className="rl-bar" role="group" aria-label="Steps">
              {frames.map((x, i) => (
                <button key={x.title} type="button" className="rl-seg" data-on={i <= f ? "true" : undefined} onClick={() => go(i)} aria-label={`Step ${i + 1}: ${x.title}`} aria-current={i === f ? "step" : undefined} />
              ))}
            </div>
          </div>
        </div>

        <div className="tl-demo-stage">
          <div className="tl-phone" aria-hidden="true">
            {children(f, tick)}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- the three, side by side, scrolled across ---------- */

export function Reel({ parts, data }: { parts: Part[]; data: ReelData }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);

  // Only the walkthrough in view plays.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  const show = (n: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  const frames = useRef([morningFrames(data.morning), resultsFrames(data.results), rumourFrames(data.rumours)]).current;

  return (
    <>
      <div className="tl-wrap">
        <nav className="rl-names" aria-label="Choose a walkthrough">
          {parts.map((p, n) => (
            <button key={p.id} type="button" className="rl-name" aria-current={n === i ? "true" : undefined} onClick={() => show(n)}>
              <span className="tl-n">{String(n + 1).padStart(2, "0")}</span>
              {p.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="rl-stage">
        {i > 0 && (
          <button type="button" className="rl-arrow rl-arrow--prev" onClick={() => show(i - 1)} aria-label={`Previous: ${parts[i - 1].name}`}>
            ←
          </button>
        )}
        {i < parts.length - 1 && (
          <button type="button" className="rl-arrow rl-arrow--next" onClick={() => show(i + 1)} aria-label={`Next: ${parts[i + 1].name}`}>
            →
          </button>
        )}
      <div ref={scroller} className="rl-scroller" onScroll={onScroll}>
        <Walkthrough part={parts[0]} n={0} frames={frames[0]} active={visible && i === 0}>
          {(f, tick) => <MorningScreen d={data.morning} f={f} tick={tick} />}
        </Walkthrough>
        <Walkthrough part={parts[1]} n={1} frames={frames[1]} active={visible && i === 1}>
          {(f, tick) => <ResultsScreen d={data.results} f={f} tick={tick} />}
        </Walkthrough>
        <Walkthrough part={parts[2]} n={2} frames={frames[2]} active={visible && i === 2}>
          {(f, tick) => <RumoursScreen d={data.rumours} f={f} tick={tick} />}
        </Walkthrough>
      </div>
      </div>
    </>
  );
}
