import type { Metadata } from "next";
import { Simulator } from "@/components/Simulator";

export const metadata: Metadata = { title: "Simulator · Tally" };

export default function SimulatorPage() {
  return (
    <div className="py-8">
      <h1 className="text-[clamp(30px,5vw,44px)] font-extrabold">Try Tally in a chat</h1>
      <p className="mt-3 max-w-[38em] text-mu">
        This chat calls exactly the same handler as the WhatsApp and SMS webhooks, so what you see here is what a voter gets
        on their phone. No Twilio account needed. Card, unit and published result data are mocked.
      </p>
      <Simulator />
    </div>
  );
}
