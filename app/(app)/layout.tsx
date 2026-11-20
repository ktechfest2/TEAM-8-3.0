import Link from "next/link";
import { TabBar } from "@/components/app/TabBar";

/**
 * The app. On a phone it fills the screen. On a wide screen it sits in a phone-sized frame
 * beside the way back to the landing page.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1040px] items-center justify-center gap-20 lg:px-8">
      <aside className="hidden max-w-[400px] flex-1 lg:block">
        <Link href="/" className="flex w-fit items-center gap-3 text-[44px] font-bold leading-none text-tx no-underline">
          <span className="grid size-12 place-items-center rounded-full bg-ac text-xl text-ad" aria-hidden>
            T
          </span>
          Tallie
        </Link>
        <p className="mt-5 text-lg text-mu">An election companion for Nigerian voters, from your polling unit to the final result.</p>
        <p className="mt-6 text-sm text-mu">
          The results are real data: Rivers State, 2023 presidential election. Card checks and reports from polling units are simulated.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link className="text-gr underline-offset-4 hover:underline" href="/">
            About Tallie
          </Link>
          <Link className="text-gr underline-offset-4 hover:underline" href="/setup">
            Run it yourself
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
