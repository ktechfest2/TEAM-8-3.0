"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "sent" | "queued" | "failed";
interface Msg {
  id: string;
  who: "me" | "tally";
  text: string;
  status?: Status;
  photo?: boolean;
}
interface Pending {
  id: string;
  from: string;
  text: string;
  hasPhoto: boolean;
}

const SENDER_KEY = "tally.sim.sender";
const QUEUE_KEY = "tally.sim.queue";

const QUICK = [
  "HELP",
  "READY 4821",
  "UNIT",
  "REPORT ARRIVED",
  "REPORT ACCRED",
  "REPORT QUEUE",
  "RESULT A112 B98 C41 D7 REJ6 ACC264",
  "RESULT A90 B102 C30 D5 REJ4 ACC249 LA05-012",
  "LANG PIDGIN",
  "LANG EN",
];

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

const WELCOME: Msg = {
  id: "welcome",
  who: "tally",
  text: "Hi, I'm Tally. Send HELP to see what I can do, or tap a suggestion below. Try READY 4821 first.",
};

export function Simulator() {
  const [sender, setSender] = useState<string>("");
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(false);
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string[]>([]);
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
      setMsgs((m) => [...m, ...queueRef.current.map((p) => ({ id: p.id, who: "me" as const, text: p.text, status: "queued" as Status, photo: p.hasPhoto }))]);
    }
    setOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const setStatus = (id: string, status: Status) => setMsgs((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));

  const deliver = useCallback(
    async (p: Pending): Promise<boolean> => {
      try {
        const res = await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: p.from, text: p.text, hasPhoto: p.hasPhoto }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus(p.id, "failed");
          setMsgs((m) => [...m, { id: uid(), who: "tally", text: data.error ?? `Something went wrong (HTTP ${res.status}).` }]);
          return true; // server answered: do not retry
        }
        setStatus(p.id, "sent");
        setMsgs((m) => [...m, { id: uid(), who: "tally", text: data.reply }]);
        if (Array.isArray(data.warnings)) setNotice(data.warnings);
        return true;
      } catch {
        return false; // network: keep it queued
      }
    },
    [],
  );

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
    const p: Pending = { id: uid(), from: sender, text: t.slice(0, 500), hasPhoto: photo };
    setMsgs((m) => [...m, { id: p.id, who: "me", text: p.text, status: "queued", photo: p.hasPhoto }]);
    queueRef.current = [...queueRef.current, p];
    save(QUEUE_KEY, queueRef.current);
    setText("");
    setPhoto(false);
    void flush();
  }

  function newVoter() {
    const s = `sim:${uid()}`;
    save(SENDER_KEY, s);
    setSender(s);
    setMsgs([{ ...WELCOME, id: uid(), text: "You are now a different voter. Reports from this voter count separately." }]);
  }

  const queued = msgs.filter((m) => m.status === "queued").length;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <section aria-label="Chat with Tally" className="flex h-[min(78dvh,680px)] flex-col rounded-[28px] border-[1.5px] border-ln bg-sf p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 border-b border-ln pb-2.5">
          <div>
            <div className="font-semibold">Tally</div>
            <div className="text-xs text-mu" aria-live="polite">
              {!online ? "Offline: messages will send when signal returns" : busy ? "Sending…" : "WhatsApp / SMS simulator"}
            </div>
          </div>
          <button type="button" className="chip" onClick={newVoter}>
            New voter
          </button>
        </div>

        <div ref={logRef} role="log" aria-live="polite" aria-label="Messages" className="flex-1 overflow-y-auto py-2" tabIndex={0}>
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`pop my-2 max-w-[88%] whitespace-pre-line rounded-[14px] px-3 py-2 text-[15px] ${
                m.who === "me" ? "ml-auto rounded-br-[4px] bg-gl" : "rounded-bl-[4px] border border-ln bg-bg"
              }`}
            >
              <span className="sr-only">{m.who === "me" ? "You: " : "Tally: "}</span>
              {m.photo && <span className="mb-1 block text-xs text-mu">📷 Photo attached</span>}
              {m.text}
              {m.who === "me" && m.status && m.status !== "sent" && (
                <span className={`mt-1 block text-xs ${m.status === "failed" ? "text-am" : "text-mu"}`}>
                  {m.status === "queued" ? "Queued, will send when online" : "Not sent"}
                </span>
              )}
            </div>
          ))}
        </div>

        <form
          className="border-t border-ln pt-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <label className="mb-2 flex items-center gap-2 text-sm text-mu">
            <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} className="size-4 accent-[var(--gr)]" />
            Attach a photo of the result sheet (demo: only the fact that one was attached is recorded)
          </label>
          <div className="flex gap-2">
            <label htmlFor="sim-input" className="sr-only">
              Message
            </label>
            <input
              id="sim-input"
              className="field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message, e.g. READY 4821"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={500}
            />
            <button className="btn px-4" type="submit" disabled={!text.trim() || !sender}>
              Send
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Tap to send</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} type="button" className="chip font-mono text-[13px]" onClick={() => submit(q)} disabled={!sender}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="card-ok text-[15px]">
          <b>Demo script.</b> READY 4821 (your unit moved), then UNIT to see live counts, REPORT ARRIVED to add yours, then
          RESULT with the wall figures. Press <b>New voter</b> and send the same RESULT again to see two voters agree.
        </div>

        <div className="card-warn text-[15px]">
          <b>Mocked here:</b> card status and polling-unit lookup, the published (IReV) figures, other voters&apos; reports,
          and message delivery. Turn your network off and send a message to see it queue and send when signal returns.
          {queued > 0 && <span className="mt-1 block">{queued} message(s) waiting to send.</span>}
        </div>

        {notice.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-mu">
            {notice.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}

        <p className="mono">Your simulated sender id: {sender ? `${sender.slice(0, 12)}…` : "…"} (hashed with a salt on the server, like a real number)</p>
      </aside>
    </div>
  );
}
