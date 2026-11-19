import Link from "next/link";
import { MyUnit } from "@/components/app/MyUnit";
import { Chevron } from "@/components/app/ui";
import { currentElection, currentTrail } from "@/lib/count/current";
import { n, unexplainedAreas } from "@/lib/count/explain";

export default function HomePage() {
  const trail = currentTrail();
  const flagged = unexplainedAreas(trail);
  return (
    <div className="pb-8">
      <header className="flex items-center gap-2.5 px-5 pb-2 pt-[max(20px,env(safe-area-inset-top))]">
        <span className="grid size-9 place-items-center rounded-full bg-ac text-[15px] font-bold text-ad">T</span>
        <span className="text-xl font-bold">Tally</span>
      </header>
      <div className="space-y-4 px-4 pt-2">
        <section className="px-1">
          <h1 className="text-[34px] font-bold">Know it counted.</h1>
          <p className="mt-2 text-mu">Your polling unit, the count, and the things you hear, checked.</p>
        </section>

        <MyUnit />

        <Link href="/count" className="card pop block text-tx no-underline">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Follow the count</p>
            <Chevron />
          </div>
          <p className="mt-2 text-xl font-semibold">
            {flagged.length} unexplained {flagged.length === 1 ? "mismatch" : "mismatches"} in {currentElection.state.name}
          </p>
          <p className="num mt-1 text-[15px] text-mu">
            {n(trail.coverage.read)} of {n(trail.coverage.total)} result sheets read · {currentElection.election}
          </p>
        </Link>

        <Link href="/ask" className="card pop block text-tx no-underline" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Heard something?</p>
            <Chevron />
          </div>
          <p className="mt-2 text-xl font-semibold">Ask Tally to check it</p>
          <p className="mt-1 text-[15px] text-mu">Tally researches what has been reported and answers with sources.</p>
        </Link>
      </div>
    </div>
  );
}
