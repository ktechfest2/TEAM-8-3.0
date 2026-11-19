import type { FieldDiff } from "@/lib/rules/compare";
import type { ValidationIssue } from "@/lib/rules/validate";
import type { ResultStatus } from "@/lib/rules/summary";
import type { ParseError } from "@/lib/commands/parse";
import { FIGURE_LABELS, type Lang, type PollingUnit, type Signal } from "@/lib/types";

/**
 * Every user-facing reply goes through here. Plain language, short lines, neutral wording:
 * a mismatch is "unmatched, needs review", never an accusation.
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
  signal(s: Signal, count: number): string;
  countsNote(): string;
  reportCounted(): string;
  reportDuplicate(): string;
  resultInvalid(issues: ValidationIssue[]): string;
  resultLogged(shortHash: string): string;
  resultMatches(): string;
  resultUnmatched(diffs: FieldDiff[]): string;
  resultNotPublished(): string;
  resultFirst(): string;
  resultAgree(n: number): string;
  resultOthersDiffer(n: number): string;
  resultConflicting(): string;
  resultStatus(s: ResultStatus, agreeing: number, diffs: FieldDiff[]): string;
}

const diffList = (diffs: FieldDiff[], you: string, pub: string) =>
  diffs.map((d) => `${FIGURE_LABELS[d.field]} (${you}: ${d.reported}, ${pub}: ${d.published})`).join("; ");

const en: Messages = {
  help: () =>
    [
      "Tally helps you on election day. Send:",
      "READY 1234: is my card ready, did my unit move? (last 4 digits of your card)",
      "UNIT: my polling unit and live reports",
      "REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE: tell other voters what you see",
      "RESULT A112 B98 C41 D7 REJ6 ACC264: check the figures on the wall",
      "LANG PIDGIN: change language (EN, PIDGIN, HAUSA, YORUBA, IGBO)",
    ].join("\n"),
  parseError: (e) => {
    switch (e.code) {
      case "empty":
      case "unknown_command":
        return "Sorry, I didn't understand that. Send HELP to see what you can send.";
      case "ready_needs_last4":
        return "Send READY and the last 4 digits of your card, for example: READY 4821";
      case "report_needs_signal":
        return "Send REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE.";
      case "result_missing_fields":
        return `Some figures are missing: ${e.missing.map((m) => FIGURE_LABELS[m]).join(", ")}. Send all of them, for example: RESULT A112 B98 C41 D7 REJ6 ACC264`;
      case "result_duplicate_field":
        return `${FIGURE_LABELS[e.field]} appears twice. Send each figure once.`;
      case "result_bad_token":
        return `I couldn't read "${e.token}". Use this format: RESULT A112 B98 C41 D7 REJ6 ACC264`;
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
  unitSame: (u) => `Your polling unit has not changed: ${u.name} (${u.code}), ${u.state}.`,
  unitMoved: (u, note) => `Your polling unit moved to ${u.name} (${u.code}), ${u.state}.${note ? ` ${note}` : ""}`,
  readyNext: () => "On the day, send UNIT to see live reports from your unit.",
  unitUnknown: () =>
    "I don't know your polling unit yet. Send READY and the last 4 digits of your card, or add your unit code, for example: UNIT LA03-007",
  unitCodeNotFound: (code) => `There is no unit ${code} in the demo data. Check the code and try again.`,
  unitHeader: (u) => `${u.name} (${u.code}), ${u.state}. Live reports:`,
  signal: (s, n) => {
    const what = { arrived: "officials arrived", accred: "accreditation started", queue: "a long queue" }[s];
    if (n === 0) return `No reports yet of ${what}.`;
    if (n === 1) return `1 voter reports ${what} (unverified).`;
    return `${n} voters report ${what}.`;
  },
  countsNote: () => "These are counts of reports, not confirmed facts. One report alone is shown as unverified.",
  reportCounted: () => "Thanks, your report is counted.",
  reportDuplicate: () => "You already reported this at this unit. Each voter counts once.",
  resultInvalid: (issues) =>
    [
      ...issues.map((i) => {
        switch (i.code) {
          case "not_whole_number":
            return `${FIGURE_LABELS[i.field]} must be a whole number.`;
          case "total_exceeds_accredited":
            return `Votes plus rejected (${i.total}) are more than accredited voters (${i.accredited}).`;
          case "accredited_exceeds_registered":
            return `Accredited (${i.accredited}) is more than registered voters (${i.registered}).`;
        }
      }),
      "These figures can't be right. Check the wall again before sending.",
    ].join("\n"),
  resultLogged: (h) => `Got it. Your figures are in the log (entry ${h}).`,
  resultMatches: () => "Matches the published result for this unit.",
  resultUnmatched: (diffs) =>
    `Published, but unmatched, needs review: ${diffList(diffs, "you", "published")}. This can be a typo or a correction, not proof of a problem.`,
  resultNotPublished: () => "No published result for this unit yet. Send UNIT later to check again.",
  resultFirst: () => "You are the first to send figures for this unit. They stay unverified until another voter sends the same.",
  resultAgree: (n) => `${n} voters have sent these same figures.`,
  resultOthersDiffer: (n) => `${n} other voters agree on different figures. Please check the wall again.`,
  resultConflicting: () => "Voters at this unit have sent different figures, so they need review.",
  resultStatus: (s, n, diffs) => {
    switch (s) {
      case "no_submissions":
        return "No result figures sent yet.";
      case "single_unverified":
        return "1 voter has sent result figures (unverified).";
      case "submissions_differ":
        return "Voters sent different result figures. Needs review.";
      case "consensus_matches":
        return `${n} voters agree on the figures, and they match the published result.`;
      case "consensus_unmatched":
        return `${n} voters agree on the figures. Unmatched with the published result, needs review: ${diffList(diffs, "voters", "published")}.`;
      case "consensus_not_published":
        return `${n} voters agree on the figures. No published result yet.`;
    }
  },
};

const pcm: Messages = {
  ...en,
  help: () =>
    [
      "Tally go help you for election day. Send:",
      "READY 1234: your card don ready? your unit don move? (last 4 number for your card)",
      "UNIT: your polling unit and wetin people dey report",
      "REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE: tell other voters wetin you see",
      "RESULT A112 B98 C41 D7 REJ6 ACC264: check the figures wey dem paste for wall",
      "LANG EN: change language (EN, PIDGIN, HAUSA, YORUBA, IGBO)",
    ].join("\n"),
  parseError: (e) => {
    switch (e.code) {
      case "empty":
      case "unknown_command":
        return "Sorry, I no understand. Send HELP make you see wetin you fit send.";
      case "ready_needs_last4":
        return "Send READY plus the last 4 number for your card, like this: READY 4821";
      case "report_needs_signal":
        return "Send REPORT ARRIVED, REPORT ACCRED or REPORT QUEUE.";
      case "result_missing_fields":
        return `Some figures no dey: ${e.missing.map((m) => FIGURE_LABELS[m]).join(", ")}. Send all of dem, like this: RESULT A112 B98 C41 D7 REJ6 ACC264`;
      case "result_duplicate_field":
        return `${FIGURE_LABELS[e.field]} show two times. Send each figure one time.`;
      case "result_bad_token":
        return `I no fit read "${e.token}". Use this format: RESULT A112 B98 C41 D7 REJ6 ACC264`;
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
  unitSame: (u) => `Your polling unit no change: ${u.name} (${u.code}), ${u.state}.`,
  unitMoved: (u, note) => `Your polling unit don move go ${u.name} (${u.code}), ${u.state}.${note ? ` ${note}` : ""}`,
  readyNext: () => "For election day, send UNIT make you see wetin people dey report for your unit.",
  unitUnknown: () =>
    "I never know your polling unit. Send READY plus the last 4 number for your card, or add your unit code like this: UNIT LA03-007",
  unitCodeNotFound: (code) => `Unit ${code} no dey for the demo data. Check the code and try again.`,
  unitHeader: (u) => `${u.name} (${u.code}), ${u.state}. Wetin people dey report:`,
  signal: (s, n) => {
    const what = { arrived: "say officials don land", accred: "say accreditation don start", queue: "say the line long well well" }[s];
    if (n === 0) return `Nobody never report ${what}.`;
    if (n === 1) return `1 voter report ${what} (unverified).`;
    return `${n} voters report ${what}.`;
  },
  countsNote: () => "Na count of reports be this, no be confirmed fact. If na only one person report am, e still be unverified.",
  reportCounted: () => "Thank you, we don count your report.",
  reportDuplicate: () => "You don already report this one for this unit. Each voter count only one time.",
  resultInvalid: (issues) =>
    [
      ...issues.map((i) => {
        switch (i.code) {
          case "not_whole_number":
            return `${FIGURE_LABELS[i.field]} suppose be whole number.`;
          case "total_exceeds_accredited":
            return `Votes plus rejected (${i.total}) pass accredited voters (${i.accredited}).`;
          case "accredited_exceeds_registered":
            return `Accredited (${i.accredited}) pass registered voters (${i.registered}).`;
        }
      }),
      "These figures no fit correct. Check the wall again before you send.",
    ].join("\n"),
  resultLogged: (h) => `We don receive am. Your figures dey the log (entry ${h}).`,
  resultMatches: () => "E match the result wey dem publish for this unit.",
  resultUnmatched: (diffs) =>
    `Dem don publish, but e no match, e need review: ${diffList(diffs, "you", "published")}. E fit be typo or correction, e no be proof say something wrong.`,
  resultNotPublished: () => "Dem never publish result for this unit. Send UNIT later make you check again.",
  resultFirst: () => "You be the first person wey send figures for this unit. E go remain unverified until another voter send the same thing.",
  resultAgree: (n) => `${n} voters don send the same figures.`,
  resultOthersDiffer: (n) => `${n} other voters agree on different figures. Abeg check the wall again.`,
  resultConflicting: () => "Voters for this unit send different figures, so e need review.",
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
