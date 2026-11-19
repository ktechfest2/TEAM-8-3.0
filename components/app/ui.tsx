import Link from "next/link";
import type { Finding } from "@/lib/count/trail";
import { FINDING_LABEL } from "@/lib/count/explain";

/** Screen header: optional back link, title, one line of context. */
export function ScreenHeader({ title, sub, back }: { title: string; sub?: string; back?: { href: string; label: string } }) {
  return (
    <header className="px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))]">
      {back && (
        <Link href={back.href} className="-ml-1 mb-2 inline-flex min-h-11 items-center gap-1 text-[15px] font-medium text-gr no-underline">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {back.label}
        </Link>
      )}
      <h1 className="text-[30px] font-bold">{title}</h1>
      {sub && <p className="mt-1 text-[15px] text-mu">{sub}</p>}
    </header>
  );
}

const TONE: Record<Finding, string> = {
  consistent: "bg-gl text-gr",
  open: "bg-bg text-mu",
  unexplained: "bg-al text-am",
};

export function FindingPill({ finding }: { finding: Finding }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[finding]}`}>{FINDING_LABEL[finding]}</span>;
}

export function Chevron() {
  return (
    <svg className="shrink-0 text-mu" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Share of result sheets read, as a thin bar. */
export function CoverageBar({ read, total }: { read: number; total: number }) {
  const pct = total ? Math.round((read / total) * 100) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-bg" role="img" aria-label={`${pct}% of result sheets read`}>
      <div className="grow-x h-full rounded-full bg-gr" style={{ width: `${pct}%` }} />
    </div>
  );
}
