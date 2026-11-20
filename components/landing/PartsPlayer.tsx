"use client";

// The three parts of Tallie on the landing page, one at a time. Each shows the product itself:
// a recording of a real run when one exists, otherwise the live app in a phone.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { landing, type Part } from "@/app/(landing)/content";

const parts = landing.parts as Part[];
// The app at phone size. Below the app's wide-screen breakpoint it fills its frame, so the
// landing page draws the phone around it.
const PHONE = { width: 390, height: 800 };

function Screen({ part, live }: { part: Part; live: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, (e.contentRect.height - 56) / PHONE.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (part.video) {
    return (
      <div className="tl-screen">
        <video src={part.video} controls muted playsInline preload="none" aria-label={`Tallie: ${part.name}`} />
      </div>
    );
  }
  return (
    <div ref={box} className="tl-screen tl-screen--phone">
      <div className="tl-phone" style={{ width: PHONE.width * scale, height: PHONE.height * scale }}>
        {live && (
          <iframe
            src={part.href}
            title={`Tallie: ${part.name}`}
            tabIndex={-1}
            aria-hidden="true"
            style={{ width: PHONE.width, height: PHONE.height, transform: `scale(${scale})` }}
          />
        )}
      </div>
      <Link href={part.href} className="tl-cover" tabIndex={live ? 0 : -1}>
        <span className="tl-cover-text">
          {part.open} <span aria-hidden="true">→</span>
        </span>
      </Link>
    </div>
  );
}

function Slide({ part, n, active, seen, go }: { part: Part; n: number; active: boolean; seen: boolean; go: (n: number) => void }) {
  const tab = active ? 0 : -1;
  return (
    <article className="tl-slide" aria-roledescription="slide" aria-label={`${n + 1} of ${parts.length}: ${part.name}`} aria-hidden={!active} inert={!active}>
      <p className="tl-label">
        {String(n + 1).padStart(2, "0")} · {part.name}
      </p>
      <h3 className="tl-question">{part.question}</h3>
      <p className="tl-you">{part.you}</p>

      <div className="tl-stagebox">
        <Screen part={part} live={seen} />
        {n > 0 && (
          <button type="button" className="tl-arrow tl-arrow--prev" onClick={() => go(n - 1)} tabIndex={tab} aria-label={`Previous: ${parts[n - 1].name}`}>
            ←
          </button>
        )}
        {n < parts.length - 1 && (
          <button type="button" className="tl-arrow tl-arrow--next" onClick={() => go(n + 1)} tabIndex={tab} aria-label={`Next: ${parts[n + 1].name}`}>
            →
          </button>
        )}
      </div>

      <div className="tl-cols">
        <p className="tl-para">{part.does}</p>
        <div>
          <h4 className="tl-answers-title">What comes back</h4>
          <ul className="tl-answers">
            {part.answers.map((a) => (
              <li key={a.name}>
                <span className="tl-answer">{a.name}</span>
                <span className="tl-decides">{a.decides}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="tl-status">{part.status}</p>
          <div className="tl-part-actions">
            <Link href="/setup" className="tl-button" tabIndex={tab}>
              Run it yourself <span aria-hidden="true">→</span>
            </Link>
            <Link href={part.href} className="tl-textlink" tabIndex={tab}>
              {part.open} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/** The part names, the sliding stage (arrows, names or a swipe) and the counter. */
export function PartsPlayer() {
  const [i, setI] = useState(0);
  // A part's live page loads the first time it is shown, not before.
  const [seen, setSeen] = useState<boolean[]>(() => parts.map((_, n) => n === 0));
  const go = useCallback((n: number) => {
    const to = Math.max(0, Math.min(parts.length - 1, n));
    setI(to);
    setSeen((s) => (s[to] ? s : s.map((v, k) => v || k === to)));
  }, []);
  const startX = useRef<number | null>(null);

  return (
    <>
      <div className="tl-wrap">
        <nav className="tl-names" aria-label="Choose a moment">
          {parts.map((p, n) => (
            <button key={p.id} type="button" className="tl-name" aria-current={n === i ? "true" : undefined} onClick={() => go(n)}>
              <span className="tl-n">{String(n + 1).padStart(2, "0")}</span>
              {p.name}
            </button>
          ))}
        </nav>
      </div>

      <div
        className="tl-stage"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") startX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        }}
      >
        <div className="tl-viewport">
          <div className="tl-track" style={{ transform: `translateX(-${i * 100}%)` }}>
            {parts.map((part, n) => (
              <div key={part.id} className="tl-cell">
                <Slide part={part} n={n} active={n === i} seen={seen[n]} go={go} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="tl-wrap tl-count">
        {i + 1} of {parts.length}
        {i < parts.length - 1 ? ` · Next: ${parts[i + 1].name}` : ""}
      </p>
    </>
  );
}
