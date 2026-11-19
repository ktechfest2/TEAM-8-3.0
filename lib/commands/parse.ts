import type { Lang, ResultFigures, Signal } from "@/lib/types";

/**
 * One parser for every channel (WhatsApp, SMS, simulator). Case-insensitive, tolerant of extra
 * spaces, punctuation and "A 112" vs "A112". Any command can end with a unit code (e.g. LA03-007).
 */
export type Command =
  | { kind: "help" }
  | { kind: "ready"; last4: string }
  | { kind: "unit"; unitCode?: string }
  | { kind: "report"; signal: Signal; unitCode?: string }
  | { kind: "result"; figures: ResultFigures; unitCode?: string }
  | { kind: "lang"; lang: Lang }
  | { kind: "error"; error: ParseError };

export type ParseError =
  | { code: "empty" }
  | { code: "unknown_command"; word: string }
  | { code: "ready_needs_last4" }
  | { code: "report_needs_signal" }
  | { code: "result_missing_fields"; missing: (keyof ResultFigures)[] }
  | { code: "result_duplicate_field"; field: keyof ResultFigures }
  | { code: "result_bad_token"; token: string }
  | { code: "lang_unknown" };

export const UNIT_CODE_RE = /^[A-Z]{2}\d{2}-\d{3}$/;

const SIGNAL_WORDS: Record<string, Signal> = {
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

const FIELD_WORDS: Record<string, keyof ResultFigures> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  REJ: "rejected",
  REJECTED: "rejected",
  ACC: "accredited",
  ACCRED: "accredited",
  ACCREDITED: "accredited",
};
const REQUIRED_FIELDS: (keyof ResultFigures)[] = ["A", "B", "C", "D", "rejected", "accredited"];

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

function parseResult(tokens: string[]): Command {
  const figures: Partial<ResultFigures> = {};
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    // "A112" / "REJ6" / "ACC264" glued together
    const glued = /^([A-Z]+)(\d+)$/.exec(tok);
    let word: string;
    let num: string | undefined;
    if (glued) {
      word = glued[1];
      num = glued[2];
      i += 1;
    } else if (/^[A-Z]+$/.test(tok) && i + 1 < tokens.length && /^\d+$/.test(tokens[i + 1])) {
      word = tok;
      num = tokens[i + 1];
      i += 2;
    } else {
      return { kind: "error", error: { code: "result_bad_token", token: tok } };
    }
    const field = FIELD_WORDS[word];
    if (!field) return { kind: "error", error: { code: "result_bad_token", token: tok } };
    if (figures[field] !== undefined) return { kind: "error", error: { code: "result_duplicate_field", field } };
    figures[field] = Number.parseInt(num, 10);
  }
  const missing = REQUIRED_FIELDS.filter((f) => figures[f] === undefined);
  if (missing.length) return { kind: "error", error: { code: "result_missing_fields", missing } };
  return { kind: "result", figures: figures as ResultFigures };
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
      const signal = rest.map((w) => SIGNAL_WORDS[w]).find(Boolean);
      if (!signal) return { kind: "error", error: { code: "report_needs_signal" } };
      return withUnit({ kind: "report", signal });
    }

    case "RESULT":
    case "RESULTS": {
      const parsed = parseResult(rest);
      return parsed.kind === "result" ? withUnit(parsed) : parsed;
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
