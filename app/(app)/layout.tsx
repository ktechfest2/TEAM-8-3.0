import { Context } from "@/components/app/Context";
import { TabBar } from "@/components/app/TabBar";
import { currentElection, currentTrail } from "@/lib/count/current";
import { n } from "@/lib/count/explain";

/**
 * The app. On a phone it fills the screen. On a wide screen it sits in a phone-sized frame
 * beside an explanation of how the part on screen works.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { coverage } = currentTrail();
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1120px] items-center justify-center gap-16 lg:px-8">
      <Context election={`${currentElection.state.name} State, ${currentElection.election}`} units={n(coverage.total)} sheets={n(coverage.read)} />

      <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg lg:h-[min(860px,calc(100dvh-48px))] lg:w-[400px] lg:shrink-0 lg:rounded-[44px] lg:border-[10px] lg:border-tx lg:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]">
        <main id="main" className="app-scroll flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
        <TabBar />
      </div>
    </div>
  );
}
