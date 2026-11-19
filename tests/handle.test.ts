import { beforeEach, describe, expect, it } from "vitest";
import { handleMessage } from "@/lib/commands/handle";
import type { Deps } from "@/lib/context";
import { MESSAGES } from "@/lib/i18n/messages";
import { ConsoleMessaging } from "@/lib/providers/messaging";
import { MockVoterLookup } from "@/lib/providers/mock";
import { isValidTwilioSignature, twilioSignature } from "@/lib/providers/twilioSignature";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { hashSender } from "@/lib/senders";
import { MemoryStore } from "@/lib/store/memory";

const SALT = "test-salt";
/** State Primary School Rumuobiakani I, Obio/Akpor: the unit demo card 4821 moved to. */
const UNIT = "32/15/04/012";
/** School Hall C.P.S. Okoloma, Oyigbo. */
const OTHER_UNIT = "32/21/01/001";

let deps: Deps;
let store: MemoryStore;

beforeEach(() => {
  store = new MemoryStore(SEED_UNITS);
  deps = { store, voterLookup: new MockVoterLookup(), messaging: new ConsoleMessaging(), salt: SALT, warnings: [] };
});

const send = (from: string, text: string) => handleMessage(deps, { from, text });

describe("handleMessage", () => {
  it("READY reports card status and a moved unit, and remembers the unit", async () => {
    const r = await send("whatsapp:+2348000000001", "READY 4821");
    expect(r.reply).toContain("Your card is marked ready");
    expect(r.reply).toContain(`moved to State Primary School Rumuobiakani I (${UNIT}), Obio/Akpor.`);
    const sender = await store.getSender(hashSender("+2348000000001", SALT));
    expect(sender?.unitCode).toBe(UNIT);
  });

  it("READY says when the unit has not changed", async () => {
    const r = await send("sim:steady", "READY 5555");
    expect(r.reply).toContain("Your polling unit has not changed: St. Mary's Primary School I (32/22/05/001), Port Harcourt.");
  });

  it("answers any 4 digits with a real polling unit", async () => {
    for (const digits of ["0001", "0002", "0003", "9998", "7777"]) {
      const r = await send(`sim:any-${digits}`, `READY ${digits}`);
      expect(r.reply).toMatch(/Your polling unit (moved to|has not changed)/);
      expect(r.reply).not.toContain("There is no unit");
    }
  });

  it("never stores the phone number", async () => {
    await send("whatsapp:+2348000000001", "READY 4821");
    await send("whatsapp:+2348000000001", "REPORT ARRIVED");
    const dump = JSON.stringify([await store.listLiveReports([UNIT]), await store.getSender(hashSender("+2348000000001", SALT))]);
    expect(dump).not.toContain("2348000000001");
  });

  it("asks for a unit before accepting live reports", async () => {
    const r = await send("sim:new", "REPORT ARRIVED");
    expect(r.reply).toContain("I don't know your polling unit yet");
    expect(r.reply).toContain("UNIT 32/15/04/012");
  });

  it("says when a unit code does not exist", async () => {
    const r = await send("sim:new", "UNIT 99/99/99/999");
    expect(r.reply).toBe("There is no unit 99/99/99/999 in the data. Check the code and try again.");
  });

  it("counts one live report per voter per kind, and labels one voter as unverified", async () => {
    const first = await send("sim:a", `REPORT ARRIVED ${OTHER_UNIT}`);
    expect(first.reply).toContain("Thanks, your report is counted.");
    expect(first.reply).toContain("1 voter reports officials arrived (unverified).");

    const again = await send("sim:a", "REPORT ARRIVED");
    expect(again.reply).toContain("You already reported this");
    expect(again.reply).toContain("1 voter reports officials arrived (unverified).");

    const other = await send("sim:b", `REPORT ARRIVED ${OTHER_UNIT}`);
    expect(other.reply).toContain("2 voters report officials arrived.");
    expect(other.reply).toContain("not confirmed facts");
  });

  it("no longer takes result figures from voters", async () => {
    const r = await send("sim:a", `RESULT A112 B98 C41 D7 REJ6 ACC264 ${UNIT}`);
    expect(r.command).toBe("error");
    expect(r.reply).toBe("Sorry, I didn't understand that. Send HELP to see what you can send.");
  });

  it("HELP lists exactly the commands that exist", async () => {
    const r = await send("sim:a", "HELP");
    for (const word of ["READY", "UNIT", "REPORT", "LANG"]) expect(r.reply).toContain(word);
    expect(r.reply).not.toContain("RESULT");
  });

  it("switches language and replies in Pidgin", async () => {
    expect((await send("sim:a", "LANG PIDGIN")).reply).toBe("Language don change to Pidgin.");
    expect((await send("sim:a", "READY 1234")).reply).toContain("Your card never ready");
  });

  it("marks stub languages as needing native review", async () => {
    expect((await send("sim:a", "LANG HAUSA")).reply).toContain("needs native review");
  });

  it("UNIT shows the unit header and live report counts only", async () => {
    await seedDemoReports(store, SALT);
    const r = await send("sim:a", `UNIT ${UNIT}`);
    expect(r.reply.split("\n")).toEqual([
      `State Primary School Rumuobiakani I (${UNIT}), Obio/Akpor. Live reports:`,
      "2 voters report officials arrived.",
      "1 voter reports accreditation started (unverified).",
      "3 voters report a long queue.",
      "These are counts of reports, not confirmed facts. One report alone is shown as unverified.",
    ]);
  });
});

describe("i18n", () => {
  it("every language implements every message", () => {
    const keys = Object.keys(MESSAGES.en).sort();
    for (const m of Object.values(MESSAGES)) expect(Object.keys(m).sort()).toEqual(keys);
  });

  it("never calls a live report verified", () => {
    for (const m of Object.values(MESSAGES)) {
      for (const n of [0, 1, 2, 9]) expect(m.liveReport("arrived", n).replace(/unverified/g, "")).not.toMatch(/verified|confirmed/i);
    }
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
