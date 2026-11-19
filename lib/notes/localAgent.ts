import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { Lang } from "@/lib/types";
import { defaultMismatchQuestion, parseResearch, parseTranslation, researchPrompt, translatePrompt } from "./prompt";
import type { Note, Researcher, ResearchRequest } from "./types";

/**
 * Live research on a local machine (docs/adr/0003): Claude Code runs headless under the developer's own login
 * and reaches the web and X through the tools Agent Reach installs. Nothing here works on a hosted server.
 */

// The only things the researcher may run. It reads the public web; it never touches local files.
const ALLOWED = [
  "Bash(mcporter call exa.web_search_exa:*)",
  "Bash(curl -s https://r.jina.ai/:*)",
  'Bash(curl -s "https://r.jina.ai/:*)',
  "Bash(twitter search:*)",
  // OpenCLI reads these through the Chrome profile that has its extension and is already signed in.
  "Bash(opencli reddit search:*)",
  "Bash(opencli facebook search:*)",
  "Bash(opencli instagram search:*)",
  "WebSearch",
  "WebFetch",
];
const DISALLOWED = ["Read", "Write", "Edit", "Glob", "Grep", "NotebookEdit", "Agent", "Task", "Skill"];

/** Agent Reach keeps the X session in its own config. Pass it to the child only; never log it. */
function twitterEnv(): Record<string, string> {
  const file = join(homedir(), ".agent-reach", "config.yaml");
  if (!existsSync(file)) return {};
  const text = readFileSync(file, "utf8");
  const get = (key: string) => new RegExp(`^${key}:\\s*["']?([^"'\\s]+)`, "m").exec(text)?.[1];
  const token = get("twitter_auth_token");
  const ct0 = get("twitter_ct0");
  return token && ct0 ? { TWITTER_AUTH_TOKEN: token, TWITTER_CT0: ct0 } : {};
}

interface RunOptions {
  tools: boolean;
  model: string;
  maxTurns: number;
  timeoutMs: number;
}

/** Runs one headless Claude Code prompt and returns its final text. */
function runClaude(prompt: string, opts: RunOptions): Promise<string> {
  const args = ["-p", "--output-format", "json", "--model", opts.model, "--max-turns", String(opts.maxTurns)];
  if (opts.tools) args.push("--allowedTools", ...ALLOWED);
  args.push("--disallowedTools", ...DISALLOWED, ...(opts.tools ? [] : ["Bash", "WebSearch", "WebFetch"]));

  return new Promise((resolve, reject) => {
    const child = spawn(process.env.TALLY_CLAUDE_BIN ?? "claude", args, {
      // An empty working folder: the researcher has no project to look at.
      cwd: mkdtempSync(join(tmpdir(), "tally-research-")),
      env: { ...process.env, ...(opts.tools ? twitterEnv() : {}) },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Research took too long and was stopped"));
    }, opts.timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Could not start Claude Code (${e.message}). Is it installed and on PATH?`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(out) as { result?: string; is_error?: boolean };
        if (parsed.is_error || typeof parsed.result !== "string") throw new Error(parsed.result ?? "no result");
        resolve(parsed.result);
      } catch (e) {
        reject(new Error(`Claude Code exited with ${code}: ${(e as Error).message || err.slice(0, 300)}`));
      }
    });
    child.stdin.end(prompt);
  });
}

const noteId = (req: ResearchRequest, question: string) =>
  `${req.about ? `mismatch-${req.about.replace(/\//g, "-")}` : `rumour-${createHash("sha256").update(question.toLowerCase()).digest("hex").slice(0, 10)}`}.${req.lang}`;

export class LocalAgentResearcher implements Researcher {
  readonly mode = "live" as const;

  constructor(private readonly model = process.env.TALLY_RESEARCH_MODEL ?? "sonnet") {}

  async research(req: ResearchRequest): Promise<Note | null> {
    const question = req.question.trim() || (req.about ? (defaultMismatchQuestion(req.about) ?? "") : "");
    if (!question) return null;
    const text = await runClaude(researchPrompt({ ...req, question }), { tools: true, model: this.model, maxTurns: 30, timeoutMs: 6 * 60_000 });
    return {
      id: noteId(req, question),
      kind: req.about ? "mismatch" : "rumour",
      asked: question,
      lang: req.lang,
      ...parseResearch(text),
      researchedAt: new Date().toISOString(),
      recorded: false,
      ...(req.about ? { about: req.about } : {}),
    };
  }

  /** The same note in another language. Translation only: no new research, no tools. */
  async translate(note: Note, lang: Lang): Promise<Note> {
    const text = await runClaude(translatePrompt(note, lang), { tools: false, model: this.model, maxTurns: 1, timeoutMs: 2 * 60_000 });
    return parseTranslation(text, note, lang);
  }
}
