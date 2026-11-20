"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Point = { k: string; v: string };
type Section = { title: string; points: Point[] };

/** What sits beside the phone on a wide screen: how the part you are looking at works. */
const SECTIONS: { match: (p: string) => boolean; section: Section }[] = [
  {
    match: (p) => p.startsWith("/count"),
    section: {
      title: "How the results check works",
      points: [
        { k: "INEC's figures against INEC's figures", v: "The sheets come from the results portal. The announced figures were released by INEC. Nothing is typed in by voters." },
        { k: "Plain arithmetic", v: "Sheets are added up for each local government. No AI model touches an election figure." },
        { k: "Two tests for a mismatch", v: "The sheets already add up to more than was announced, or the gap is bigger than every registered voter in the unread sheets." },
        { k: "Sealed", v: "Every published result is in a hash-chained log anyone can re-check." },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/ask"),
    section: {
      title: "How the research agent works",
      points: [
        { k: "An agent, not a chatbot", v: "Claude runs headless through Claude Code, in an empty folder, with read-only tools." },
        { k: "It reads the open web", v: "Through Agent Reach (open source): web search, page reading, X, Reddit, Facebook and Instagram." },
        { k: "Sources or nothing", v: "Every statement must come from a page it opened. With no sources it can only say nothing reliable was found." },
        { k: "It describes, it does not rule", v: "A note says what was reported, by whom and how solid it is. In five languages." },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/more"),
    section: {
      title: "About this prototype",
      points: [
        { k: "Hackathon prototype", v: "For Every Vote, Every Voice, KTech Fest 3.0." },
        { k: "Open source, credited", v: "Data from CCIJ. Research tools from Agent Reach. Built with Claude." },
      ],
    },
  },
  {
    match: () => true,
    section: {
      title: "How the card check works",
      points: [
        { k: "One number", v: "The voter identification number on the card finds the polling unit. The number is never stored." },
        { k: "Moved units", v: "If the polling unit moved, Tallie says where it is now." },
        { k: "Reports count once", v: "One voter's report stays unverified until a second voter reports the same." },
        { k: "Simulated here", v: "A real card lookup needs INEC's cooperation. Tap “Use a demo card”." },
      ],
    },
  },
];

export function Context({ election, units, sheets }: { election: string; units: string; sheets: string }) {
  const path = usePathname();
  const { section } = SECTIONS.find((s) => s.match(path))!;
  return (
    <aside className="hidden max-w-[440px] flex-1 lg:block">
      <Link href="/" className="flex w-fit items-center gap-2.5 text-2xl font-bold text-tx no-underline">
        <span className="grid size-9 place-items-center rounded-full bg-ac text-[15px] text-ad" aria-hidden>
          T
        </span>
        Tallie
      </Link>

      <div className="mt-8 rounded-3xl bg-tx p-6 text-bg">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ac">Run on real data</p>
        <p className="mt-2 text-[30px] font-bold leading-[1.1]">{election}</p>
        <p className="num mt-3 text-[17px] opacity-80">
          {units} polling units · {sheets} result sheets read
        </p>
      </div>

      <h2 className="mt-9 text-xl font-semibold">{section.title}</h2>
      <dl className="mt-4 space-y-4">
        {section.points.map((p) => (
          <div key={p.k} className="border-l-2 border-ac pl-4">
            <dt className="font-semibold">{p.k}</dt>
            <dd className="text-[15px] text-mu">{p.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <Link className="text-gr underline-offset-4 hover:underline" href="/">
          About Tallie
        </Link>
        <Link className="text-gr underline-offset-4 hover:underline" href="/setup">
          Run it yourself
        </Link>
      </div>
    </aside>
  );
}
