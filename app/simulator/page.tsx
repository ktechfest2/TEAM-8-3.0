import type { Metadata } from "next";
import { Simulator } from "@/components/Simulator";

export const metadata: Metadata = { title: "Try it · Tally" };

export default function SimulatorPage() {
  return (
    <div className="py-10">
      <div className="mb-8 text-center">
        <h1 className="text-[clamp(30px,5vw,42px)] font-extrabold">Try Tally</h1>
        <p className="mt-2 text-mu">Same replies a voter gets on WhatsApp or SMS.</p>
      </div>
      <Simulator />
    </div>
  );
}
