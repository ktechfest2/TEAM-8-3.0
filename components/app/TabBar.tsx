"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const TABS = [
  {
    href: "/",
    label: "My unit",
    match: (p: string) => p === "/",
    svg: (
      <svg {...icon} aria-hidden>
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/count",
    label: "Count",
    match: (p: string) => p.startsWith("/count"),
    svg: (
      <svg {...icon} aria-hidden>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
  {
    href: "/ask",
    label: "Ask",
    match: (p: string) => p.startsWith("/ask"),
    svg: (
      <svg {...icon} aria-hidden>
        <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4.2A8 8 0 1 1 20 12z" />
      </svg>
    ),
  },
  {
    href: "/more",
    label: "More",
    match: (p: string) => p.startsWith("/more"),
    svg: (
      <svg {...icon} aria-hidden>
        <circle cx="5" cy="12" r="1.4" fill="currentColor" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        <circle cx="19" cy="12" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="shrink-0 border-t border-ln bg-sf/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const on = t.match(path);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium no-underline ${on ? "text-gr" : "text-mu"}`}
              >
                {t.svg}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
