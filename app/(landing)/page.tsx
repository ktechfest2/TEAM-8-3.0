import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import { Reel, type ReelData } from "@/components/landing/Reel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentElection, currentTrail, currentUnits } from "@/lib/count/current";
import { FINDING_LABEL, headlineComparison, n, unexplainedAreas } from "@/lib/count/explain";
import { PARTIES } from "@/lib/count/trail";
import { recordedNotes } from "@/lib/notes/recorded";
import { landing as c } from "./content";

// The landing page: what Tallie found on a real election, then the three moments a voter is left
// guessing, each as a walkthrough that plays by itself, then what's next.

const description =
  "An election companion for Nigerian voters: where do I vote and is it open, is the result on the wall the one that was announced, and is this thing I heard true.";

export const metadata: Metadata = {
  title: "Tallie: an election companion for Nigerian voters",
  description,
};

const NAV = [
  { href: "/#morning", label: "Election morning" },
  { href: "/#results", label: "After the results" },
  { href: "/#rumours", label: "Rumours" },
];

const FOOTER = [...NAV, { href: "/setup", label: "Run it yourself" }];

function RunIt({ small }: { small?: boolean }) {
  return (
    <Link href="/setup" className={`tl-button${small ? " tl-button--small" : ""}`}>
      Run it yourself <span aria-hidden="true">→</span>
    </Link>
  );
}

/** What Tallie found on the real data, read from the count trail so the page cannot drift from the product. */
function evidence() {
  const trail = currentTrail();
  const flagged = unexplainedAreas(trail);
  const exhibits = flagged.flatMap((area) => {
    const comparison = headlineComparison(area);
    return comparison ? [{ area, comparison }] : [];
  });
  const scale = Math.max(1, ...exhibits.flatMap((e) => [e.comparison.portalSum, e.comparison.announced]));
  return {
    exhibits,
    scale,
    total: trail.areas.length,
    stats: [
      { figure: n(trail.coverage.total), text: "polling units" },
      { figure: `${Math.round((trail.coverage.read / trail.coverage.total) * 100)}%`, text: "of result sheets read" },
      { figure: n(trail.areas.length), text: "local governments checked" },
      { figure: n(flagged.length), text: "that do not add up" },
    ],
  };
}

const STRENGTH = { well_reported: "Well reported", partly_reported: "Partly reported", disputed: "Sources disagree", nothing_found: "Nothing reliable found" };
const REASON = { sum_above_announced: "Missing sheets could only add votes.", gap_beyond_missing: "Too few voters in the missing sheets to make up the gap." };

/**
 * Everything the walkthroughs show, read from the same count trail and recorded notes the app uses.
 * The walkthroughs are scripted, but nothing in them is invented here.
 */
function reelData(): ReelData {
  const trail = currentTrail();
  const flagged = unexplainedAreas(trail);
  const area = flagged[0];
  const scale = Math.max(1, ...area.comparisons.flatMap((k) => [k.portalSum, k.announced]));
  const pct = (v: number) => Math.max(1.5, (v / scale) * 100);
  const count = (f: string) => trail.areas.filter((a) => a.finding === f).length;
  const notes = recordedNotes();
  const about = notes.find((x) => x.kind === "mismatch" && x.about === area.code && x.lang === "en")!;
  const rumour = notes.find((x) => x.kind === "rumour" && x.lang === "en")!;
  const pidgin = notes.find((x) => x.id === rumour.id.replace(/\.en$/, ".pcm")) ?? rumour;
  const unit = currentUnits().find((u) => u.code === "32/15/04/012")!;
  const sources = (list: { publisher: string; title: string }[]) => list.slice(0, 3).map(({ publisher, title }) => ({ publisher, title }));

  return {
    morning: {
      vin: "90F5 B1E3 6229 6014 821",
      unit: { name: unit.name, ward: unit.ward, lga: unit.lga, code: unit.code },
      moved: "Same ward, about 400 m from your old unit.",
    },
    results: {
      election: `${currentElection.state.name} State, ${currentElection.election}`,
      read: n(trail.coverage.read),
      total: n(trail.coverage.total),
      pct: Math.round((trail.coverage.read / trail.coverage.total) * 100),
      areas: trail.areas.length,
      groups: [
        { finding: "unexplained", title: `${count("unexplained")} do not add up` },
        { finding: "consistent", title: `${count("consistent")} add up` },
        { finding: "open", title: `${count("open")} with too few sheets to tell` },
      ],
      flagged: flagged.map((a) => {
        const k = headlineComparison(a)!;
        return { name: a.name, party: k.party, sheets: n(k.portalSum), announced: n(k.announced) };
      }),
      area: {
        name: area.name,
        coverage: `${n(area.coverage.read)} of ${n(area.coverage.total)} result sheets read`,
        pct: Math.round((area.coverage.read / area.coverage.total) * 100),
        // The two parties with the most at stake here are enough to show the comparison.
        rows: [...area.comparisons]
          .sort((x, y) => Math.max(y.portalSum, y.announced) - Math.max(x.portalSum, x.announced))
          .slice(0, 2)
          .map((k) => ({
            party: k.party,
            sheets: n(k.portalSum),
            announced: n(k.announced),
            sheetsPct: pct(k.portalSum),
            announcedPct: pct(k.announced),
            finding: k.finding,
            label: FINDING_LABEL[k.finding],
            reason: k.finding === "unexplained" && k.reason ? REASON[k.reason] : undefined,
          })),
        wards: area.areas.slice(0, 3).map((w) => ({
          name: w.name,
          line: `${n(w.coverage.read)} of ${n(w.coverage.total)} sheets · ${PARTIES.map((p) => `${p} ${n(w.portalSum[p])}`).join(" · ")}`,
        })),
        wardCount: area.areas.length,
      },
      note: { steps: about.steps, first: about.found[0], strength: STRENGTH[about.strength], sources: sources(about.sources) },
    },
    rumours: {
      asked: rumour.asked,
      steps: rumour.steps,
      strength: STRENGTH[rumour.strength],
      first: rumour.found[0],
      sources: sources(rumour.sources),
      pidgin: { asked: pidgin.asked, first: pidgin.found[0] },
    },
  };
}

export default function LandingPage() {
  const ev = evidence();
  const width = (v: number) => `${Math.max(0.6, (v / ev.scale) * 100)}%`;

  return (
    <div className="tl">
      <main id="main">
        <section className="tl-wrap" aria-labelledby="tl-title">
          <header className="tl-nav">
            <Link href="/" className="tl-wordmark" aria-label="Tallie home">
              <span className="tl-mark" aria-hidden="true">
                T
              </span>
              Tallie
            </Link>
            <nav aria-label="Main" className="tl-nav-links">
              {NAV.map((l) => (
                <Link key={l.href} href={l.href} className="tl-navlink">
                  {l.label}
                </Link>
              ))}
              <ThemeToggle />
              <RunIt small />
            </nav>
          </header>

          <div className="tl-hero">
            <h1 id="tl-title" className="tl-h1">
              <span>Tallie.</span> <span className="tl-soft">{c.title}</span>
            </h1>
            <div className="tl-hero-foot">
              <p className="tl-lede">{c.lede}</p>
              <div className="tl-actions">
                <a href="#morning" className="tl-textlink">
                  See it work <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="tl-evidence" aria-labelledby="tl-evidence">
          <div className="tl-wrap">
            <div className="tl-evidence-head">
              <div>
                <h2 id="tl-evidence" className="tl-label">
                  {c.evidence.label} · {currentElection.state.name} State, {currentElection.election}
                </h2>
                <p className="tl-evidence-title">{c.evidence.statement}</p>
              </div>
            </div>

            <div className="tl-exhibits">
              {ev.exhibits.map(({ area, comparison: k }) => (
                <article key={area.code} className="tl-exhibit">
                  <h3 className="tl-exhibit-name">
                    {area.name} <span>{k.party} votes</span>
                  </h3>
                  <dl className="tl-bars">
                    <div>
                      <dt>Result sheets add up to</dt>
                      <dd>
                        <span className="tl-bar tl-bar--sheets" style={{ width: width(k.portalSum) }} />
                        <span className="tl-bar-n">{n(k.portalSum)}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>Announced</dt>
                      <dd>
                        <span className="tl-bar tl-bar--announced" style={{ width: width(k.announced) }} />
                        <span className="tl-bar-n">{n(k.announced)}</span>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <dl className="tl-stats">
              {ev.stats.map((s) => (
                <div key={s.text}>
                  <dt className="tl-figure">{s.figure}</dt>
                  <dd>{s.text}</dd>
                </div>
              ))}
            </dl>
            <p className="tl-evidence-foot">
              <a href="#results" className="tl-textlink">
                See all {ev.total} local governments <span aria-hidden="true">↓</span>
              </a>
              <a href={c.evidence.bbc.url} target="_blank" rel="noreferrer" className="tl-evidence-source">
                {c.evidence.bbc.text} <span aria-hidden="true">↗</span>
              </a>
            </p>
          </div>
        </section>

        <section id="parts" className="tl-parts" aria-labelledby="tl-parts">
          <div className="tl-wrap tl-head">
            <h2 id="tl-parts" className="tl-label">
              {c.intro.label}
            </h2>
            <div>
              <p className="tl-statement">{c.intro.statement}</p>
              <p className="tl-body">{c.intro.body}</p>
            </div>
          </div>
          <Reel parts={c.parts} data={reelData()} />
        </section>

        <section className="tl-agent" aria-labelledby="tl-agent">
          <div className="tl-wrap">
            <div className="tl-agent-head">
              <div>
                <h2 id="tl-agent" className="tl-label">
                  {c.agent.label}
                </h2>
                <p className="tl-reach-title">{c.agent.statement}</p>
              </div>
              <div>
                <h3 className="tl-agent-sub">{c.agent.reads.title}</h3>
                <ul className="tl-chips">
                  {c.agent.reads.channels.map((ch) => (
                    <li key={ch}>{ch}</li>
                  ))}
                </ul>
                <p className="tl-agent-note">{c.agent.reads.note}</p>
              </div>
            </div>
            <ol className="tl-rules">
              {c.agent.rules.map((r, i) => (
                <li key={r.name}>
                  <span className="tl-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="tl-rule-name">{r.name}</h3>
                  <p className="tl-rule-text">{r.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="tl-reach" aria-labelledby="tl-reach">
          <div className="tl-wrap">
            <div className="tl-reach-head">
              <div>
                <h2 id="tl-reach" className="tl-label">
                  {c.reach.label}
                </h2>
                <p className="tl-reach-title">{c.reach.statement}</p>
              </div>
              <p className="tl-body">{c.reach.body}</p>
            </div>

            <ul className="tl-channels">
              {c.reach.channels.map((ch) => (
                <li key={ch.name} className="tl-channel">
                  <h3 className="tl-channel-name">{ch.name}</h3>
                  <p className="tl-channel-who">{ch.who}</p>
                  <p className="tl-channel-state" data-live={ch.state.startsWith("Working") ? "true" : undefined}>
                    {ch.state}
                  </p>
                </li>
              ))}
            </ul>

            <div className="tl-langs">
              <h3 className="tl-langs-title">{c.reach.languages.title}</h3>
              <ul className="tl-langs-list">
                {c.reach.languages.list.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <p className="tl-langs-note">{c.reach.languages.note}</p>
            </div>
          </div>
        </section>

        <section className="tl-next" aria-labelledby="tl-next">
          <div className="tl-wrap">
            <h2 id="tl-next" className="tl-label">
              {c.next.label}
            </h2>
            <p className="tl-statement">{c.next.statement}</p>
            <ol className="tl-road">
              {c.next.steps.map((s) => (
                <li key={s.title} className="tl-stop" data-done={s.done ? "true" : undefined}>
                  <span className="tl-stop-dot" aria-hidden="true" />
                  <span className="tl-stop-when">{s.when}</span>
                  <h3 className="tl-stop-title">{s.title}</h3>
                  <p className="tl-stop-text">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="tl-close" aria-labelledby="tl-close">
          <div className="tl-wrap">
            <h2 id="tl-close" className="tl-close-title">
              {c.close.title}
            </h2>
            <p className="tl-lede tl-close-body">{c.close.body}</p>
            <div className="tl-close-actions">
              <RunIt />
            </div>
          </div>
        </section>
      </main>

      <footer className="tl-wrap">
        <dl className="tl-credits">
          {c.credits.map((k) => (
            <div key={k.what}>
              <dt>{k.what}</dt>
              <dd>
                <a href={k.url} target="_blank" rel="noreferrer">
                  {k.who} <span aria-hidden="true">↗</span>
                </a>
              </dd>
            </div>
          ))}
        </dl>
        <div className="tl-footer">
          <span className="tl-wordmark">Tallie</span>
          <nav aria-label="Footer" className="tl-footer-links">
            {FOOTER.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <span className="tl-footer-legal">Team 8 · Every Vote, Every Voice · KTech Fest 3.0</span>
        </div>
      </footer>
    </div>
  );
}
