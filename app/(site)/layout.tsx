import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Pages that sit beside the app: the SMS simulator, the Newsroom and the log check. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ln bg-bg/90 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex max-w-[1040px] items-center gap-5 px-4 py-3 sm:px-5">
          <Link href="/" className="mr-auto flex items-center gap-2.5 text-xl font-bold text-tx no-underline">
            <span className="grid size-8 place-items-center rounded-full bg-ac text-[14px] text-ad">T</span>
            Tally
          </Link>
          <Link className="text-[15px] font-medium text-mu hover:text-tx" href="/simulator">
            Text Tally
          </Link>
          <Link className="text-[15px] font-medium text-mu hover:text-tx" href="/newsroom">
            Newsroom
          </Link>
          <Link className="hidden text-[15px] font-medium text-mu hover:text-tx sm:inline" href="/verify">
            Verify
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-[1040px] px-4 sm:px-5">
        {children}
      </main>
    </>
  );
}
