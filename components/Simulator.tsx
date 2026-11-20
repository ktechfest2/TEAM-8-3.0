"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "sent" | "queued" | "failed";
interface Msg {
  id: string;
  who: "me" | "tally";
  text: string;
  status?: Status;
}
interface Pending {
  id: string;
  from: string;
  text: string;
}

const SENDER_KEY = "tally.sim.sender";
const QUEUE_KEY = "tally.sim.queue";

const QUICK = ["READY 4821", "UNIT", "REPORT ARRIVED", "REPORT QUEUE", "UNIT 32/22/05/001", "LANG PIDGIN", "HELP"];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: queue lives in memory only */
  }
}

const WELCOME: Msg = { id: "welcome", who: "tally", text: "Hi, I'm Tallie. Start with READY 4821." };

export function Simulator() {
  const [sender, setSender] = useState<string>("");
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [text, setText] = useState("");
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<Pending[]>([]);
  const flushing = useRef(false);

  useEffect(() => {
    let s = load<string>(SENDER_KEY, "");
    if (!/^sim:[A-Za-z0-9_-]{4,64}$/.test(s)) {
      s = `sim:${uid()}`;
      save(SENDER_KEY, s);
    }
    setSender(s);
    queueRef.current = load<Pending[]>(QUEUE_KEY, []).filter((p) => p && typeof p.from === "string" && typeof p.text === "string");
    if (queueRef.current.length) {
      setMsgs((m) => [
        ...m,
        ...queueRef.current.map((p) => ({ id: p.id, who: "me" as const, text: p.text, status: "queued" as Status })),
      ]);
    }
    setOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const setStatus = (id: string, status: Status) => setMsgs((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));

  const deliver = useCallback(async (p: Pending): Promise<boolean> => {
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: p.from, text: p.text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(p.id, "failed");
        setMsgs((m) => [...m, { id: uid(), who: "tally", text: data.error ?? `Something went wrong (HTTP ${res.status}).` }]);
        return true; // server answered: do not retry
      }
      setStatus(p.id, "sent");
      setMsgs((m) => [...m, { id: uid(), who: "tally", text: data.reply }]);
      return true;
    } catch {
      return false; // network: keep it queued
    }
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || !sender) return;
    flushing.current = true;
    setBusy(true);
    try {
      while (queueRef.current.length) {
        const ok = await deliver(queueRef.current[0]);
        if (!ok) break;
        queueRef.current = queueRef.current.slice(1);
        save(QUEUE_KEY, queueRef.current);
      }
    } finally {
      flushing.current = false;
      setBusy(false);
    }
  }, [deliver, sender]);

  useEffect(() => {
    const up = () => {
      setOnline(true);
      void flush();
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    if (sender && queueRef.current.length && navigator.onLine) void flush();
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [flush, sender]);

  function submit(raw: string) {
    const t = raw.trim();
    if (!t || !sender) return;
    const p: Pending = { id: uid(), from: sender, text: t.slice(0, 500) };
    setMsgs((m) => [...m, { id: p.id, who: "me", text: p.text, status: "queued" }]);
    queueRef.current = [...queueRef.current, p];
    save(QUEUE_KEY, queueRef.current);
    setText("");
    void flush();
  }

  function newVoter() {
    const s = `sim:${uid()}`;
    save(SENDER_KEY, s);
    setSender(s);
    setMsgs([{ ...WELCOME, id: uid(), text: "You're a different voter now. Your reports count separately." }]);
  }

  return (
    <div className="mx-auto max-w-[440px]">
      <section
        aria-label="Chat with Tallie"
        className="flex h-[min(72dvh,640px)] flex-col rounded-[32px] bg-sf p-3 shadow-[0_20px_60px_-25px_rgba(0,0,0,.35)] ring-1 ring-ln sm:p-4"
      >
        <div className="flex items-center gap-2.5 px-1 pb-3">
          <span className="grid size-8 place-items-center rounded-full bg-gr text-sm font-bold text-bg">T</span>
          <div className="mr-auto leading-tight">
            <div className="font-semibold">Tallie</div>
            <div className="text-xs text-mu" aria-live="polite">
              {!online ? "Offline · will send when signal returns" : busy ? "typing…" : "online"}
            </div>
          </div>
          <button type="button" onClick={newVoter} className="rounded-full px-3 py-1 text-sm font-semibold text-gr hover:bg-gl">
            New voter
          </button>
        </div>

        <div ref={logRef} role="log" aria-live="polite" aria-label="Messages" className="flex-1 overflow-y-auto rounded-2xl bg-bg px-2 py-1" tabIndex={0}>
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`pop my-2 max-w-[86%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
                m.who === "me" ? "ml-auto rounded-br-md bg-tx text-sf" : "rounded-bl-md bg-sf"
              }`}
            >
              <span className="sr-only">{m.who === "me" ? "You: " : "Tallie: "}</span>
              {m.text}
              {m.who === "me" && m.status && m.status !== "sent" && (
                <span className="mt-1 block text-xs opacity-80">{m.status === "queued" ? "⏳ queued" : "not sent"}</span>
              )}
            </div>
          ))}
        </div>

        <form
          className="flex items-center gap-2 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <label htmlFor="sim-input" className="sr-only">
            Message
          </label>
          <input
            id="sim-input"
            className="field rounded-full px-4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={500}
          />
          <button className="btn shrink-0 rounded-full px-4" type="submit" disabled={!text.trim() || !sender} aria-label="Send">
            ➤
          </button>
        </form>
      </section>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip font-mono text-[12px]" onClick={() => submit(q)} disabled={!sender}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
