import Link from "next/link";

const STEPS = [
  {
    n: "1. Am I ready?",
    body: "Check that your card is ready and whether your polling unit moved.",
    cmd: "READY 4821",
    href: "/simulator",
    cta: "Open the simulator",
  },
  {
    n: "2. Live at my unit",
    body: "See counted reports from other voters, and add what you see. One voter counts once.",
    cmd: "UNIT · REPORT ARRIVED",
    href: "/simulator",
    cta: "Open the simulator",
  },
  {
    n: "3. Check the wall",
    body: "Send the figures from the wall. Tally checks the arithmetic and compares them with the published result.",
    cmd: "RESULT A112 B98 C41 D7 REJ6 ACC264",
    href: "/simulator",
    cta: "Open the simulator",
  },
  {
    n: "4. Journalist view",
    body: "Filter reports by state and polling unit, see counts, photo flags and timestamps, export CSV.",
    cmd: "Every claim shown with its count",
    href: "/newsroom",
    cta: "Open the newsroom",
  },
];

export default function Home() {
  return (
    <>
      <div className="grid items-center gap-10 py-10 sm:py-14 md:grid-cols-[1.15fr_.85fr]">
        <div>
          <h1 className="text-[clamp(38px,6vw,64px)] font-extrabold tracking-[-0.02em]">
            Know where. Know when. Know it counted.
          </h1>
          <p className="my-5 max-w-[34em] text-[19px] text-mu">
            Tally walks a first-time voter through election day on WhatsApp or SMS: is my card ready, did my polling unit move,
            is the unit running, and does the number on the wall match what was published?
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" href="/simulator">
              Try the demo
            </Link>
            <a className="btn-o" href="#mock">
              What&rsquo;s mocked
            </a>
          </div>
        </div>

        <div aria-label="Example chat" role="img" className="mx-auto w-full max-w-[340px] rounded-[28px] border-[1.5px] border-ln bg-sf p-4">
          <div className="mb-3 border-b border-ln pb-2.5 font-semibold">Tally</div>
          <div className="pop my-2 ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] bg-gl px-3 py-2 text-[15px]">My unit moved?</div>
          <div className="pop my-2 max-w-[85%] rounded-[14px] rounded-bl-[4px] border border-ln bg-bg px-3 py-2 text-[15px] [animation-delay:.5s]">
            Yes. You now vote at Unit 007, Ward 3. Same ward, 400 m from your old unit.
          </div>
          <div className="pop my-2 ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] bg-gl px-3 py-2 text-[15px] [animation-delay:1s]">
            Is it running?
          </div>
          <div className="pop my-2 max-w-[85%] rounded-[14px] rounded-bl-[4px] border border-ln bg-bg px-3 py-2 text-[15px] [animation-delay:1.5s]">
            3 voters report officials arrived. Accreditation not yet reported.
          </div>
        </div>
      </div>

      <section className="py-9">
        <h2 className="mb-4 text-[clamp(26px,4vw,36px)] font-extrabold">Amaka&rsquo;s day, from her side</h2>
        <div className="grid gap-7 md:grid-cols-3">
          <div>
            <h3 className="mb-1.5 text-xl font-semibold">Before</h3>
            <p className="text-mu">
              Check that your card is ready and get told if your polling unit moved, before you queue at the wrong place.
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 text-xl font-semibold">During</h3>
            <p className="text-mu">
              See counted reports from other voters at your unit: officials arrived, accreditation started, queue length.
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 text-xl font-semibold">After</h3>
            <p className="text-mu">
              Send the numbers from the wall. Tally checks the arithmetic and tells you whether the published result matches.
            </p>
          </div>
        </div>
      </section>

      <section id="try" className="py-9">
        <h2 className="mb-4 text-[clamp(26px,4vw,36px)] font-extrabold">Try it</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="panel flex flex-col">
              <h3 className="text-xl font-semibold">{s.n}</h3>
              <p className="mt-2 flex-1 text-mu">{s.body}</p>
              <p className="mono mt-3">{s.cmd}</p>
              <Link href={s.href} className="mt-3 font-semibold text-gr underline-offset-4 hover:underline">
                {s.cta} →
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[15px] text-mu">
          Works on basic phones: SMS and WhatsApp, no app to install. Replies in English and Pidgin, with Hausa, Yorùbá and Igbo
          waiting for native-speaker review. A mismatch is shown as &ldquo;unmatched, needs review&rdquo;, never as an accusation.
        </p>
      </section>

      <section id="mock" className="py-9">
        <div className="rounded-[14px] bg-al px-5 py-5 sm:px-6">
          <h2 className="mb-3 text-[clamp(26px,4vw,36px)] font-extrabold">What&rsquo;s real and what&rsquo;s mocked</h2>
          <p>The rules are real. The data feeds are not.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b>Real:</b> arithmetic validation, count-based reports (one vote per voter per signal), match or unmatched logic,
              the hash-chained log you can <Link className="underline" href="/verify">verify</Link>, and the WhatsApp/SMS
              command handler.
            </li>
            <li>
              <b>Mocked:</b> card status and polling-unit lookup, the published IReV figures, other voters&rsquo; reports, and
              WhatsApp and SMS delivery (the simulator stands in; Twilio is optional).
            </li>
            <li>
              Polling unit codes, places and &ldquo;Party A to D&rdquo; are fictional. Photos are only flagged, never stored, until
              face blurring exists.
            </li>
            <li>We haven&rsquo;t confirmed that INEC offers public data access for these, so a live version needs their cooperation.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
