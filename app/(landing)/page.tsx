import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import { PartsPlayer } from "@/components/landing/PartsPlayer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentElection, currentTrail } from "@/lib/count/current";
import { explainComparison, headlineComparison, n, unexplainedAreas } from "@/lib/count/explain";
import { landing as c } from "./content";

// The landing page: the three moments a voter is left guessing, each shown in the product itself,
// then how it works, what it found on a real election, and what's next.

const description =
  "An election companion for Nigerian voters: where do I vote and is it open, is the result on the wall the one that was announced, and is this thing I heard true.";

export const metadata: Metadata = {
  title: "Tallie: an election companion for Nigerian voters",
  description,
};

const NAV = [
  { href: "/unit", label: "Election morning" },
  { href: "/count", label: "After the results" },
  { href: "/ask", label: "Rumours" },
];

const FOOTER = [...NAV, { href: "/verify", label: "Verify the data" }, { href: "/setup", label: "Run it yourself" }];

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
    stats: [
      { figure: n(trail.coverage.total), text: "polling units" },
      { figure: `${Math.round((trail.coverage.read / trail.coverage.total) * 100)}%`, text: "of result sheets read" },
      { figure: n(trail.areas.length), text: "local governments checked" },
      { figure: n(flagged.length), text: "that do not add up" },
    ],
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
                <a href="#parts" className="tl-textlink">
                  See it work <span aria-hidden="true">↓</span>
                </a>
                <RunIt />
              </div>
            </div>
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
          <PartsPlayer />
        </section>

        <section className="tl-band" aria-labelledby="tl-how">
          <div className="tl-wrap">
            <h2 id="tl-how" className="tl-label">
              {c.how.label}
            </h2>
            <p className="tl-statement tl-statement--wide">{c.how.statement}</p>
            <ol className="tl-flow">
              {c.how.steps.map((s) => (
                <li key={s.n} className="tl-flow-step">
                  <span className="tl-flow-n" aria-hidden="true">
                    {s.n}
                  </span>
                  <h3 className="tl-flow-title">{s.title}</h3>
                  <p className="tl-flow-text">{s.text}</p>
                </li>
              ))}
            </ol>
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
              <p className="tl-evidence-body">{c.evidence.body}</p>
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
                  <p className="tl-exhibit-text">{explainComparison(k, area)}</p>
                  <Link href={`/count/${area.code}`} className="tl-textlink">
                    See the working <span aria-hidden="true">→</span>
                  </Link>
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
              <a href={c.evidence.bbc.url} target="_blank" rel="noreferrer" className="tl-textlink">
                {c.evidence.bbc.text} <span aria-hidden="true">↗</span>
              </a>
            </p>
          </div>
        </section>

        <section className="tl-next" aria-labelledby="tl-next">
          <div className="tl-wrap">
            <h2 id="tl-next" className="tl-label">
              {c.next.label}
            </h2>
            <p className="tl-statement tl-statement--wide">{c.next.statement}</p>
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
              <Link href="/count" className="tl-textlink">
                Open the live results <span aria-hidden="true">→</span>
              </Link>
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
