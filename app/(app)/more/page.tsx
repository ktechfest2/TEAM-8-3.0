import type { Metadata } from "next";
import Link from "next/link";
import { Chevron, ScreenHeader } from "@/components/app/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "More · Tallie" };

const LINKS = [
  { href: "/simulator", title: "Text Tallie", sub: "A simulator of the WhatsApp and SMS channel, which is not live yet" },
  { href: "/setup", title: "Run it yourself", sub: "Set Tallie up on your own computer, with live research" },
  { href: "/verify", title: "Verify the log", sub: "Check that the published results Tallie uses have not been altered" },
];

export default function MorePage() {
  return (
    <div className="pb-8">
      <ScreenHeader title="More" />
      <div className="space-y-4 px-4">
        <ul className="card rows !p-0">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-[68px] items-center gap-3 px-5 py-3 text-tx no-underline">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-sm text-mu">{l.sub}</div>
                </div>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
        <div className="card flex items-center justify-between">
          <span className="font-medium">Appearance</span>
          <ThemeToggle />
        </div>
        <p className="px-1 text-xs text-mu">
          Hackathon prototype for Every Vote, Every Voice. The count is real data from the 2023 presidential election in Rivers
          State. Card lookups and live reports are simulated. Built with Claude.
        </p>
      </div>
    </div>
  );
}
