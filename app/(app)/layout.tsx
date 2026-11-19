import Link from "next/link";
import { TabBar } from "@/components/app/TabBar";

const POINTS = [
  { k: "My unit", v: "Is my card ready, did my polling unit move, and is it running right now?" },
  { k: "Count", v: "Follow the count from polling unit to ward, local government and state, and see where it stops adding up." },
  { k: "Ask", v: "Heard something? Tally researches it and answers with sources, in your language." },
];

/**
 * The app. On a phone it fills the screen. On a wide screen it sits in a phone-sized frame
 * beside a short explanation of what you are looking at.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1120px] items-center justify-center gap-16 lg:px-8">
      <aside className="hidden max-w-[440px] flex-1 lg:block">
        <p className="eyebrow">Every Vote, Every Voice</p>
        <h1 className="mt-3 text-[56px] font-bold leading-[1.02]">Know it counted.</h1>
        <p className="mt-4 text-lg text-mu">
          Tally is an election companion for Nigerian voters. It works as an app, and over WhatsApp and SMS on any phone.
        </p>
        <dl className="mt-8 space-y-5">
          {POINTS.map((p) => (
            <div key={p.k}>
              <dt className="font-semibold">{p.k}</dt>
              <dd className="text-mu">{p.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-mu">
          The count shown is real: Rivers State, 2023 presidential election, read from result sheets on INEC&apos;s portal by CCIJ.
          Card lookups and live reports are simulated.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link className="text-gr underline-offset-4 hover:underline" href="/simulator">
            Text Tally by SMS
          </Link>
          <Link className="text-gr underline-offset-4 hover:underline" href="/newsroom">
            Newsroom
          </Link>
          <Link className="text-gr underline-offset-4 hover:underline" href="/verify">
            Verify the log
          </Link>
        </div>
      </aside>

      <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg lg:h-[min(860px,calc(100dvh-48px))] lg:w-[400px] lg:shrink-0 lg:rounded-[44px] lg:border-[10px] lg:border-tx lg:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]">
        <main id="main" className="app-scroll flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
        <TabBar />
      </div>
    </div>
  );
}
