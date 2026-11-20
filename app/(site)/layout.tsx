import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/unit", label: "Election morning" },
  { href: "/count", label: "After the results" },
  { href: "/ask", label: "Rumours" },
  { href: "/setup", label: "Run it yourself" },
  { href: "/status", label: "Connections" },
];

/** Pages that sit beside the app: the setup guide, the log check and the text-channel simulator. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ln bg-bg/90 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex max-w-[1040px] items-center gap-5 px-4 py-3 sm:px-5">
          <Link href="/" className="mr-auto flex items-center gap-2.5 text-xl font-bold text-tx no-underline">
            <span className="grid size-8 place-items-center rounded-full bg-ac text-[14px] text-ad">T</span>
            Tallie
          </Link>
          {NAV.map((l) => (
            <Link key={l.href} className="hidden text-[15px] font-medium text-mu hover:text-tx sm:inline" href={l.href}>
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-[1040px] px-4 sm:px-5">
        {children}
      </main>
    </>
  );
}
