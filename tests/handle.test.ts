import { beforeEach, describe, expect, it } from "vitest";
import { appendSubmission } from "@/lib/chain/append";
import { verifyChain } from "@/lib/chain/hash";
import { handleMessage } from "@/lib/commands/handle";
import type { Deps } from "@/lib/context";
import { MESSAGES } from "@/lib/i18n/messages";
import { ConsoleMessaging } from "@/lib/providers/messaging";
import { MockIRev, MockVoterLookup } from "@/lib/providers/mock";
import { isValidTwilioSignature, twilioSignature } from "@/lib/providers/twilioSignature";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { hashSender } from "@/lib/senders";
import { MemoryStore } from "@/lib/store/memory";

const SALT = "test-salt";
let deps: Deps;
let store: MemoryStore;

beforeEach(() => {
  store = new MemoryStore(SEED_UNITS);
  deps = {
    store,
    voterLookup: new MockVoterLookup(),
    irev: new MockIRev(),
    messaging: new ConsoleMessaging(),
    salt: SALT,
    warnings: [],
  };
});

const send = (from: string, text: string, hasPhoto = false) => handleMessage(deps, { from, text, hasPhoto });

describe("handleMessage", () => {
  it("READY reports card status and a moved unit, and remembers the unit", async () => {
    const r = await send("whatsapp:+2348000000001", "READY 4821");
    expect(r.reply).toContain("Your card is marked ready");
    expect(r.reply).toContain("moved to Unit 007, Ward 3 (LA03-007)");
    const sender = await store.getSender(hashSender("+2348000000001", SALT));
    expect(sender?.unitCode).toBe("LA03-007");
  });

  it("never stores the phone number", async () => {
    await send("whatsapp:+2348000000001", "READY 4821");
    await send("whatsapp:+2348000000001", "REPORT ARRIVED");
    const dump = JSON.stringify([await store.listSignals(["LA03-007"]), await store.getSender(hashSender("+2348000000001", SALT))]);
    expect(dump).not.toContain("2348000000001");
  });

  it("asks for a unit before accepting reports", async () => {
    const r = await send("sim:new", "REPORT ARRIVED");
    expect(r.reply).toContain("I don't know your polling unit yet");
  });

  it("counts one vote per sender per signal, and labels one reporter as unverified", async () => {
    const first = await send("sim:a", "REPORT ARRIVED EN01-002");
    expect(first.reply).toContain("Thanks, your report is counted.");
    expect(first.reply).toContain("1 voter reports officials arrived (unverified).");

    const again = await send("sim:a", "REPORT ARRIVED");
    expect(again.reply).toContain("You already reported this");
    expect(again.reply).toContain("1 voter reports officials arrived (unverified).");

    const other = await send("sim:b", "REPORT ARRIVED EN01-002");
    expect(other.reply).toContain("2 voters report officials arrived.");
    expect(other.reply).toContain("not confirmed facts");
  });

  it("refuses impossible result figures without logging them", async () => {
    const r = await send("sim:a", "RESULT A500 B98 C41 D7 REJ6 ACC264 LA03-007");
    expect(r.reply).toContain("Votes plus rejected (652) are more than accredited voters (264).");
    expect(r.reply).toContain("Check the wall again");
    expect(await store.listResults()).toHaveLength(0);
  });

  it("checks accredited against the unit's registered voters", async () => {
    const r = await send("sim:a", "RESULT A1 B1 C1 D1 REJ1 ACC900 LA03-007");
    expect(r.reply).toContain("Accredited (900) is more than registered voters (850).");
  });

  it("logs a valid result, compares it, and builds consensus across voters", async () => {
    const first = await send("sim:a", "RESULT A112 B98 C41 D7 REJ6 ACC264 LA03-007", true);
    expect(first.reply).toContain("Your figures are in the log");
    expect(first.reply).toContain("Matches the published result");
    expect(first.reply).toContain("You are the first");

    const second = await send("sim:b", "RESULT A112 B98 C41 D7 REJ6 ACC264 LA03-007");
    expect(second.reply).toContain("2 voters have sent these same figures.");

    const rows = await store.listResults();
    expect(rows).toHaveLength(2);
    expect(rows[0].hasPhoto).toBe(true);
    expect(verifyChain(rows).ok).toBe(true);
  });

  it("names differing fields with neutral wording", async () => {
    const r = await send("sim:a", "RESULT A90 B102 C30 D5 REJ4 ACC249 LA05-012");
    expect(r.reply).toContain("unmatched, needs review: Party B (you: 102, published: 120)");
    expect(r.reply).toContain("not proof of a problem");
    expect(r.reply.toLowerCase()).not.toMatch(/rigged|fraud|fake|stolen/);
  });

  it("says when nothing is published yet", async () => {
    const r = await send("sim:a", "RESULT A1 B1 C1 D1 REJ1 ACC5 EN01-002");
    expect(r.reply).toContain("No published result for this unit yet");
  });

  it("switches language and replies in Pidgin", async () => {
    expect((await send("sim:a", "LANG PIDGIN")).reply).toBe("Language don change to Pidgin.");
    expect((await send("sim:a", "READY 1234")).reply).toContain("Your card never ready");
  });

  it("marks stub languages as needing native review", async () => {
    expect((await send("sim:a", "LANG HAUSA")).reply).toContain("needs native review");
  });

  it("UNIT shows live counts including seeded reports", async () => {
    await seedDemoReports(store, SALT);
    const r = await send("sim:a", "UNIT LA03-007");
    expect(r.reply).toContain("2 voters report officials arrived.");
    expect(r.reply).toContain("1 voter reports accreditation started (unverified).");
    expect(r.reply).toContain("3 voters report a long queue.");
    expect(r.reply).toContain("match the published result");
  });
});

describe("hash chain under concurrency", () => {
  it("does not fork when many submissions arrive at once", async () => {
    const figures = { A: 1, B: 1, C: 1, D: 1, rejected: 1, accredited: 10 };
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        appendSubmission(store, {
          unitCode: "LA03-007",
          senderHash: hashSender(`sim:${i}`, SALT),
          figures,
          hasPhoto: false,
          createdAt: new Date().toISOString(),
        }),
      ),
    );
    const rows = await store.listResults();
    expect(rows).toHaveLength(25);
    expect(new Set(rows.map((r) => r.prevHash)).size).toBe(25);
    expect(verifyChain(rows).ok).toBe(true);
  });

  it("detects a row edited directly in storage", async () => {
    await seedDemoReports(store, SALT);
    store._tamper(3, { figures: { A: 1, B: 102, C: 30, D: 5, rejected: 4, accredited: 249 } });
    const report = verifyChain(await store.listResults());
    expect(report.ok).toBe(false);
    expect(report.breaks[0]).toMatchObject({ index: 2, kind: "hash_mismatch" });
  });
});

describe("i18n", () => {
  it("every language implements every message", () => {
    const keys = Object.keys(MESSAGES.en).sort();
    for (const m of Object.values(MESSAGES)) expect(Object.keys(m).sort()).toEqual(keys);
  });
});

describe("Twilio signature", () => {
  it("accepts a correctly signed request and rejects a tampered one", () => {
    const url = "https://example.test/api/whatsapp";
    const params = { From: "whatsapp:+2348000000001", Body: "HELP" };
    const sig = twilioSignature("token", url, params);
    expect(isValidTwilioSignature("token", url, params, sig)).toBe(true);
    expect(isValidTwilioSignature("token", url, { ...params, Body: "READY 4821" }, sig)).toBe(false);
    expect(isValidTwilioSignature("token", url, params, null)).toBe(false);
  });
});
