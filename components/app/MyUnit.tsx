"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Readiness } from "@/lib/myUnit";
import type { UnitSummary } from "@/lib/rules/summary";
import type { LiveReportKind, PollingUnit } from "@/lib/types";

const KINDS: { kind: LiveReportKind; label: string }[] = [
  { kind: "arrived", label: "Officials have arrived" },
  { kind: "accred", label: "Accreditation has started" },
  { kind: "queue", label: "There is a long queue" },
];

interface Saved {
  voter: string;
  unit?: PollingUnit;
  cardReady?: boolean;
  moved?: boolean;
  note?: string | null;
}

const KEY = "tally.myunit";

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {}
  const voter = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
  return { voter };
}
const store = (s: Saved) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
};

async function call<T>(body: object): Promise<T> {
  const res = await fetch("/api/app/unit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return (await res.json()) as T;
}

const countLine = (n: number) => (n === 0 ? "No reports yet" : n === 1 ? "1 voter · unverified" : `${n} voters`);

export function MyUnit() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [summary, setSummary] = useState<UnitSummary | null>(null);
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState<Partial<Record<LiveReportKind, boolean>>>({});

  useEffect(() => {
    const s = load();
    setSaved(s);
    if (s.unit) {
      call<{ summary?: UnitSummary }>({ voter: s.voter, code: s.unit.code }).then((r) => r.summary && setSummary(r.summary));
    }
  }, []);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!saved || busy) return;
    setBusy(true);
    setMessage(null);
    const r = await call<{ found?: boolean; readiness?: Readiness; summary?: UnitSummary | null; error?: string }>({ voter: saved.voter, action: "ready", last4 });
    setBusy(false);
    if (r.error) return setMessage(r.error);
    if (!r.found || !r.readiness?.unit) return setMessage("We couldn't find that card. Check the last 4 digits and try again.");
    const next: Saved = { voter: saved.voter, unit: r.readiness.unit, cardReady: r.readiness.cardReady, moved: r.readiness.moved, note: r.readiness.note };
    store(next);
    setSaved(next);
    setSummary(r.summary ?? null);
  }

  async function report(kind: LiveReportKind) {
    if (!saved?.unit || busy) return;
    setBusy(true);
    const r = await call<{ counted?: boolean; summary?: UnitSummary }>({ voter: saved.voter, action: "report", code: saved.unit.code, kind });
    setBusy(false);
    if (r.summary) setSummary(r.summary);
    setSent((s) => ({ ...s, [kind]: true }));
  }

  function forget() {
    if (!saved) return;
    const next = { voter: saved.voter };
    store(next);
    setSaved(next);
    setSummary(null);
    setLast4("");
    setSent({});
  }

  // Before the saved state is read, hold the space so the screen does not jump.
  if (!saved) return <section className="card min-h-[188px]" aria-busy="true" />;

  if (!saved.unit) {
    return (
      <section className="card">
        <p className="eyebrow">My polling unit</p>
        <h2 className="mt-2 text-xl font-semibold">Is my card ready? Did my unit move?</h2>
        <form onSubmit={check} className="mt-4 flex gap-2">
          <label htmlFor="last4" className="sr-only">
            Last 4 digits of your voter card
          </label>
          <input
            id="last4"
            className="field num flex-1 tracking-[0.3em]"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="Last 4 digits"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
            autoComplete="off"
          />
          <button className="btn" type="submit" disabled={busy || last4.length !== 4}>
            Check
          </button>
        </form>
        <p className="mt-3 text-sm text-mu" role="status">
          {message ?? "Tally remembers your polling unit, never your card. Try 4821 in this demo."}
        </p>
      </section>
    );
  }

  const u = saved.unit;
  const ward = u.code.slice(0, 8);
  return (
    <>
      <section className="card pop">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow">My polling unit</p>
          <button type="button" onClick={forget} className="-my-2 min-h-11 cursor-pointer text-sm font-medium text-gr">
            Change
          </button>
        </div>
        <h2 className="mt-1 text-2xl font-semibold">{u.name}</h2>
        <p className="mt-1 text-[15px] text-mu">
          {u.ward} ward · {u.lga} · <span className="num">{u.code}</span>
        </p>
        <div className="mt-4 space-y-2">
          <p className={saved.cardReady ? "card-ok text-[15px]" : "card-warn text-[15px]"}>
            {saved.cardReady ? "Your card is marked ready." : "Your card is not marked ready yet. Ask at your ward collection point."}
          </p>
          {saved.moved && (
            <p className="card-warn text-[15px]">
              Your polling unit moved here.{saved.note ? ` ${saved.note}` : ""}
            </p>
          )}
        </div>
        <Link href={`/count/${ward}`} className="btn-o mt-4 w-full">
          Follow this ward&apos;s count
        </Link>
      </section>

      <section className="card pop" style={{ animationDelay: "80ms" }}>
        <p className="eyebrow">Happening now</p>
        <ul className="rows mt-1">
          {KINDS.map(({ kind, label }) => {
            const count = summary?.counts[kind] ?? 0;
            return (
              <li key={kind} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{label}</div>
                  <div className={`num text-sm ${count === 1 ? "text-am" : "text-mu"}`}>{countLine(count)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void report(kind)}
                  disabled={busy || sent[kind]}
                  className="chip shrink-0 !min-h-11 disabled:cursor-default disabled:opacity-60"
                >
                  {sent[kind] ? "Counted" : "I see this"}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-mu">Counts of what voters at this unit report, not confirmed facts. Each voter counts once.</p>
      </section>
    </>
  );
}
