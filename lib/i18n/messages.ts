import type { ParseError } from "@/lib/commands/parse";
import type { Lang, LiveReportKind, PollingUnit } from "@/lib/types";

/**
 * Every reply a voter gets over WhatsApp, SMS or the simulator goes through here.
 * Plain language, short lines, and counts rather than conclusions.
 */
export interface Messages {
  help(): string;
  parseError(e: ParseError): string;
  langSet(): string;
  cardNotFound(): string;
  cardReady(ready: boolean): string;
  unitSame(u: PollingUnit): string;
  unitMoved(u: PollingUnit, note: string | null): string;
  readyNext(): string;
  unitUnknown(): string;
  unitCodeNotFound(code: string): string;
  unitHeader(u: PollingUnit): string;
  liveReport(k: LiveReportKind, count: number): string;
  countsNote(): string;
  reportCounted(): string;
  reportDuplicate(): string;
}

const EXAMPLE_UNIT = "32/15/04/012";

const en: Messages = {
  help: () =>
    [
      "Tallie helps you on election day. Send:",
      "READY 1234: is my card ready, did my unit move? (last 4 digits of your card)",
      "UNIT: my polling unit and live reports",
      "REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE: tell other voters what you see",
      "LANG PIDGIN: change language (EN, PIDGIN, HAUSA, YORUBA, IGBO)",
    ].join("\n"),
  parseError: (e) => {
    switch (e.code) {
      case "empty":
      case "unknown_command":
        return "Sorry, I didn't understand that. Send HELP to see what you can send.";
      case "ready_needs_last4":
        return "Send READY and the last 4 digits of your card, for example: READY 4821";
      case "report_needs_kind":
        return "Send REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE.";
      case "lang_unknown":
        return "Choose a language: LANG EN, LANG PIDGIN, LANG HAUSA, LANG YORUBA or LANG IGBO.";
    }
  },
  langSet: () => "Language set to English.",
  cardNotFound: () => "We couldn't find that card in the demo data. Check the last 4 digits and try again.",
  cardReady: (ready) =>
    ready
      ? "Your card is marked ready for collection or use."
      : "Your card is not marked ready yet. Ask at your ward collection point.",
  unitSame: (u) => `Your polling unit has not changed: ${u.name} (${u.code}), ${u.lga}.`,
  unitMoved: (u, note) => `Your polling unit moved to ${u.name} (${u.code}), ${u.lga}.${note ? ` ${note}` : ""}`,
  readyNext: () => "On the day, send UNIT to see live reports from your unit.",
  unitUnknown: () =>
    `I don't know your polling unit yet. Send READY and the last 4 digits of your card, or add your unit code, for example: UNIT ${EXAMPLE_UNIT}`,
  unitCodeNotFound: (code) => `There is no unit ${code} in the data. Check the code and try again.`,
  unitHeader: (u) => `${u.name} (${u.code}), ${u.lga}. Live reports:`,
  liveReport: (k, n) => {
    const what = { arrived: "officials arrived", accred: "accreditation started", queue: "a long queue" }[k];
    if (n === 0) return `No reports yet of ${what}.`;
    if (n === 1) return `1 voter reports ${what} (unverified).`;
    return `${n} voters report ${what}.`;
  },
  countsNote: () => "These are counts of reports, not confirmed facts. One report alone is shown as unverified.",
  reportCounted: () => "Thanks, your report is counted.",
  reportDuplicate: () => "You already reported this at this unit. Each voter counts once.",
};

const pcm: Messages = {
  ...en,
  help: () =>
    [
      "Tallie go help you for election day. Send:",
      "READY 1234: your card don ready? your unit don move? (last 4 number for your card)",
      "UNIT: your polling unit and wetin people dey report",
      "REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE: tell other voters wetin you see",
      "LANG EN: change language (EN, PIDGIN, HAUSA, YORUBA, IGBO)",
    ].join("\n"),
  parseError: (e) => {
    switch (e.code) {
      case "empty":
      case "unknown_command":
        return "Sorry, I no understand. Send HELP make you see wetin you fit send.";
      case "ready_needs_last4":
        return "Send READY plus the last 4 number for your card, like this: READY 4821";
      case "report_needs_kind":
        return "Send REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE.";
      case "lang_unknown":
        return "Choose language: LANG EN, LANG PIDGIN, LANG HAUSA, LANG YORUBA or LANG IGBO.";
    }
  },
  langSet: () => "Language don change to Pidgin.",
  cardNotFound: () => "We no see that card for the demo data. Check the last 4 number and try again.",
  cardReady: (ready) =>
    ready
      ? "Your card don ready. You fit collect am or use am."
      : "Your card never ready. Ask for your ward collection point.",
  unitSame: (u) => `Your polling unit no change: ${u.name} (${u.code}), ${u.lga}.`,
  unitMoved: (u, note) => `Your polling unit don move go ${u.name} (${u.code}), ${u.lga}.${note ? ` ${note}` : ""}`,
  readyNext: () => "For election day, send UNIT make you see wetin people dey report for your unit.",
  unitUnknown: () =>
    `I never know your polling unit. Send READY plus the last 4 number for your card, or add your unit code like this: UNIT ${EXAMPLE_UNIT}`,
  unitCodeNotFound: (code) => `Unit ${code} no dey for the data. Check the code and try again.`,
  unitHeader: (u) => `${u.name} (${u.code}), ${u.lga}. Wetin people dey report:`,
  liveReport: (k, n) => {
    const what = { arrived: "say officials don land", accred: "say accreditation don start", queue: "say the line long well well" }[k];
    if (n === 0) return `Nobody never report ${what}.`;
    if (n === 1) return `1 voter report ${what} (unverified).`;
    return `${n} voters report ${what}.`;
  },
  countsNote: () => "Na count of reports be this, no be confirmed fact. If na only one person report am, e still be unverified.",
  reportCounted: () => "Thank you, we don count your report.",
  reportDuplicate: () => "You don already report this one for this unit. Each voter count only one time.",
};

/**
 * STUBS. Hausa, Yoruba and Igbo copy has NOT been written yet: these fall back to English and
 * every reply is tagged so nobody mistakes it for a translation. Needs native review before use.
 */
export const NEEDS_NATIVE_REVIEW: Record<Lang, boolean> = { en: false, pcm: true, ha: true, yo: true, ig: true };
export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  pcm: "Pidgin",
  ha: "Hausa",
  yo: "Yorùbá",
  ig: "Igbo",
};

function stub(lang: Lang): Messages {
  const name = LANG_NAMES[lang];
  return {
    ...en,
    help: () => `[${name} translation needs native review. Showing English.]\n${en.help()}`,
    langSet: () => `Language set to ${name}. ${name} replies are not ready yet (needs native review), so you will see English for now.`,
  };
}

export const MESSAGES: Record<Lang, Messages> = { en, pcm, ha: stub("ha"), yo: stub("yo"), ig: stub("ig") };

export function t(lang: Lang): Messages {
  return MESSAGES[lang] ?? en;
}
