import type { Metadata } from "next";
import Link from "next/link";
import { MyUnit } from "@/components/app/MyUnit";

export const metadata: Metadata = { title: "Election morning · Tallie" };

export default function HomePage() {
  return (
    <div className="pb-8">
      <header className="flex items-center gap-2.5 px-5 pb-2 pt-[max(20px,env(safe-area-inset-top))]">
        <Link href="/" target="_top" className="flex items-center gap-2.5 text-tx no-underline" aria-label="Tallie home">
          <span className="grid size-9 place-items-center rounded-full bg-ac text-[15px] font-bold text-ad">T</span>
          <span className="text-xl font-bold">Tallie</span>
        </Link>
      </header>
      <div className="space-y-4 px-4 pt-2">
        <section className="px-1">
          <h1 className="text-[34px] font-bold">Election morning</h1>
          <p className="mt-2 text-mu">Where you vote, and whether your polling unit has opened.</p>
        </section>

        <MyUnit />
      </div>
    </div>
  );
}
