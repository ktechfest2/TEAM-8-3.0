import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const head = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-head", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Tally: know it counted",
  description:
    "A WhatsApp and SMS companion that walks a first-time voter through election day. Hackathon prototype with mocked data.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1511" },
  ],
};

// Apply a saved theme before first paint, so there is no flash.
const themeScript = `try{var t=localStorage.getItem("tally.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn">
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-ln bg-bg/90 backdrop-blur">
          <nav aria-label="Main" className="mx-auto flex max-w-[1040px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 sm:px-5">
            <Link href="/" className="font-display text-xl font-extrabold text-tx no-underline">
              Tally
            </Link>
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold">
              <Link className="text-tx hover:text-gr" href="/simulator">Simulator</Link>
              <Link className="text-tx hover:text-gr" href="/newsroom">Newsroom</Link>
              <Link className="text-tx hover:text-gr" href="/verify">Verify log</Link>
            </div>
            <ThemeToggle />
          </nav>
        </header>
        <main id="main" className="mx-auto max-w-[1040px] px-4 sm:px-5">
          {children}
        </main>
        <footer className="mx-auto max-w-[1040px] px-4 pb-12 pt-8 text-[15px] text-mu sm:px-5">
          Built for the Every Vote, Every Voice hackathon. Party names, polling units and published results in this demo are
          placeholders. Built with an AI coding assistant (Claude).
        </footer>
      </body>
    </html>
  );
}
