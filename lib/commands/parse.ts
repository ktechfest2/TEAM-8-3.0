import type { Lang, LiveReportKind } from "@/lib/types";

/**
 * One parser for every channel (WhatsApp, SMS, simulator). Case-insensitive and tolerant of extra
 * spaces and punctuation. Any command can carry a unit code (e.g. 32/15/04/012) in any position.
 */
export type Command =
  | { kind: "help" }
  | { kind: "ready"; last4: string }
  | { kind: "unit"; unitCode?: string }
  | { kind: "report"; report: LiveReportKind; unitCode?: string }
  | { kind: "lang"; lang: Lang }
  | { kind: "error"; error: ParseError };

export type ParseError =
  | { code: "empty" }
  | { code: "unknown_command"; word: string }
  | { code: "ready_needs_last4" }
  | { code: "report_needs_kind" }
  | { code: "lang_unknown" };

/** state/local government/ward/unit */
export const UNIT_CODE_RE = /^\d{2}\/\d{2}\/\d{2}\/\d{3}$/;

const REPORT_WORDS: Record<string, LiveReportKind> = {
  ARRIVED: "arrived",
  ARRIVE: "arrived",
  OFFICIALS: "arrived",
  ACCRED: "accred",
  ACCREDITATION: "accred",
  ACC: "accred",
  QUEUE: "queue",
  LINE: "queue",
};

const LANG_WORDS: Record<string, Lang> = {
  EN: "en",
  ENGLISH: "en",
  PCM: "pcm",
  PIDGIN: "pcm",
  HA: "ha",
  HAUSA: "ha",
  YO: "yo",
  YORUBA: "yo",
  IG: "ig",
  IGBO: "ig",
};

function tokenize(text: string): string[] {
  return text
    .toUpperCase()
    .replace(/[,;:=]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.!?]+|[.!?]+$/g, ""))
    .filter(Boolean);
}

/** Pulls a trailing or embedded unit code out of the tokens. */
function takeUnitCode(tokens: string[]): { rest: string[]; unitCode?: string } {
  const idx = tokens.findIndex((t) => UNIT_CODE_RE.test(t));
  if (idx === -1) return { rest: tokens };
  return { rest: tokens.filter((_, i) => i !== idx), unitCode: tokens[idx] };
}

export function parseCommand(text: string): Command {
  const all = tokenize(text ?? "");
  if (all.length === 0) return { kind: "error", error: { code: "empty" } };
  const [head, ...args] = all;
  const { rest, unitCode } = takeUnitCode(args);
  const withUnit = <T extends Command>(c: T): T => (unitCode && c.kind !== "error" ? { ...c, unitCode } : c);

  switch (head) {
    case "HELP":
    case "MENU":
    case "HI":
    case "HELLO":
    case "START":
    case "?":
      return { kind: "help" };

    case "READY": {
      const digits = rest.join("").replace(/\D/g, "");
      if (!/^\d{4}$/.test(digits)) return { kind: "error", error: { code: "ready_needs_last4" } };
      return { kind: "ready", last4: digits };
    }

    case "UNIT":
    case "STATUS":
      return withUnit({ kind: "unit" });

    case "REPORT": {
      const report = rest.map((w) => REPORT_WORDS[w]).find(Boolean);
      if (!report) return { kind: "error", error: { code: "report_needs_kind" } };
      return withUnit({ kind: "report", report });
    }

    case "LANG":
    case "LANGUAGE": {
      const lang = LANG_WORDS[rest[0] ?? ""];
      if (!lang) return { kind: "error", error: { code: "lang_unknown" } };
      return { kind: "lang", lang };
    }

    default:
      return { kind: "error", error: { code: "unknown_command", word: head.slice(0, 20) } };
  }
}
