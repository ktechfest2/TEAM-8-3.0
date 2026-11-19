import Link from "next/link";

const STEPS = [
  { n: "01", when: "Before", q: "Is my card ready? Did my unit move?", cmd: "READY 4821" },
  { n: "02", when: "During", q: "Is my unit running? See what other voters report.", cmd: "REPORT ARRIVED" },
  { n: "03", when: "After", q: "Does the result on the wall match what was published?", cmd: "RESULT A112 B98 …" },
];

const CHAT: { me?: boolean; text: string }[] = [
  { me: true, text: "My unit moved?" },
  { text: "Yes. You now vote at Unit 007, Ward 3. About 400 m from your old unit." },
  { me: true, text: "Is it running?" },
  { text: "3 voters report officials arrived. Accreditation not yet reported." },
];

export default function Home() {
  return (
    <>
      <section className="grid items-center gap-12 pb-16 pt-12 sm:pt-20 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gr">WhatsApp · SMS · no app needed</p>
          <h1 className="mt-4 text-[clamp(44px,7vw,76px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Know it counted.
          </h1>
          <p className="mt-5 max-w-[30em] text-[19px] text-mu">
            Tally walks first-time voters through election day, from finding the right polling unit to checking the result on
            the wall.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn" href="/simulator">
              Try it →
            </Link>
            <Link className="btn-o" href="/newsroom">
              Newsroom
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[330px]">
          <div aria-hidden className="absolute -inset-8 -z-10 rounded-full bg-gl blur-3xl" />
          <div role="img" aria-label="Example chat with Tally" className="rounded-[32px] bg-sf p-4 shadow-[0_20px_60px_-25px_rgba(0,0,0,.35)] ring-1 ring-ln">
            <div className="flex items-center gap-2.5 px-1 pb-3">
              <span className="grid size-8 place-items-center rounded-full bg-gr text-sm font-bold text-bg">T</span>
              <span className="font-semibold">Tally</span>
            </div>
            {CHAT.map((m, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 0.45}s` }}
                className={`pop my-2 max-w-[86%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
                  m.me ? "ml-auto rounded-br-md bg-gr text-bg" : "rounded-bl-md bg-bg"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ln py-16">
        <h2 className="text-[clamp(26px,3.5vw,34px)] font-extrabold">One voter, one day.</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="font-display text-sm font-semibold text-gr">
                {s.n} · {s.when}
              </span>
              <p className="mt-2 text-xl leading-snug">{s.q}</p>
              <code className="mt-4 inline-block rounded-md bg-gl px-2 py-1 font-mono text-[13px] text-tx">{s.cmd}</code>
            </li>
          ))}
        </ol>
        <p className="mt-14 text-mu">
          Counts, not claims: one report stays <em>unverified</em>. A mismatch reads <em>unmatched, needs review</em>, never an
          accusation. Every result is{" "}
          <Link href="/verify" className="text-gr underline-offset-4 hover:underline">
            hash-chained
          </Link>
          .
        </p>
      </section>
    </>
  );
}
