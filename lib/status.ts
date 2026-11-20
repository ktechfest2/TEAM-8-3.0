import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";
import { getDeps } from "@/lib/context";
import { currentElection, currentTrail } from "@/lib/count/current";
import { verifyRivers2023 } from "@/lib/log/rivers2023";
import { liveResearchEnabled } from "@/lib/notes";
import { recordedNotes } from "@/lib/notes/recorded";

/**
 * Whether everything Tallie needs is connected on this machine. It only looks: it reads the data that is
 * already loaded and checks which programs are on the PATH. It never reads a credential.
 */

export type CheckState = "ok" | "off" | "missing";

export interface Check {
  group: "Data" | "Research agent" | "Where the agent reads";
  name: string;
  state: CheckState;
  /** What was found, in a few words. */
  detail: string;
  /** What to do about it, when it is not connected. */
  fix?: string;
}

export interface Status {
  /** True when a question typed into Rumours will be researched live on this machine. */
  live: boolean;
  summary: string;
  checks: Check[];
}

/** Finds a program on the PATH without running it. */
function onPath(name: string): string | null {
  const exts = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const file = join(dir, name + ext.toLowerCase());
      if (existsSync(file)) return file;
      if (ext && existsSync(join(dir, name + ext))) return join(dir, name + ext);
    }
  }
  return null;
}

function version(bin: string): string | null {
  try {
    const r = spawnSync(bin, ["--version"], { encoding: "utf8", timeout: 8000, shell: process.platform === "win32", windowsHide: true });
    return r.status === 0 ? r.stdout.trim().split("\n")[0].slice(0, 60) : null;
  } catch {
    return null;
  }
}

const n = (v: number) => new Intl.NumberFormat("en-NG").format(v);

export async function systemStatus(): Promise<Status> {
  const trail = currentTrail();
  const log = verifyRivers2023();
  const notes = recordedNotes();
  const deps = await getDeps();

  const claudeBin = process.env.TALLY_CLAUDE_BIN ?? "claude";
  const claude = existsSync(claudeBin) ? claudeBin : onPath(claudeBin);
  const claudeVersion = claude ? version(claudeBin) : null;
  const switched = liveResearchEnabled();
  const tool = (cmd: string) => Boolean(onPath(cmd));
  const reach = "Install Agent Reach, then run agent-reach doctor.";

  const checks: Check[] = [
    {
      group: "Data",
      name: "Published results",
      state: "ok",
      detail: `${currentElection.state.name} State, ${currentElection.election}: ${n(trail.coverage.total)} polling units, ${n(trail.coverage.read)} result sheets read`,
    },
    {
      group: "Data",
      name: "Sealed log",
      state: log.ok ? "ok" : "missing",
      detail: log.ok ? `${n(log.length)} entries match the seal` : "The data no longer matches its seal",
      fix: log.ok ? undefined : "Restore data/rivers-2023, or reseal with npx tsx scripts/seal-log.ts.",
    },
    { group: "Data", name: "Recorded notes", state: "ok", detail: `${notes.length} notes from earlier research runs, used when live research is off or fails` },
    {
      group: "Data",
      name: "Voters and live reports",
      state: "ok",
      detail: deps.store.kind === "memory" ? "Kept in memory, with demo data. Resets when Tallie restarts" : "Stored in Postgres",
    },
    {
      group: "Research agent",
      name: "Claude Code",
      state: claude ? "ok" : "missing",
      detail: claude ? (claudeVersion ?? "Found") : "Not found on this computer",
      fix: claude ? undefined : "Install Claude Code from claude.com/claude-code and sign in.",
    },
    {
      group: "Research agent",
      name: "Live research",
      state: switched && claude ? "ok" : "off",
      detail: switched ? (claude ? "On: questions are researched now" : "Switched on, but Claude Code is missing") : "Off: Rumours replays recorded notes",
      fix: switched ? undefined : "Start Tallie with npm run demo, which turns it on when Claude Code is found.",
    },
    { group: "Where the agent reads", name: "Web search and pages", state: claude ? "ok" : "missing", detail: claude ? "Built into Claude Code" : "Needs Claude Code" },
    {
      group: "Where the agent reads",
      name: "Web search through Agent Reach",
      state: tool("mcporter") ? "ok" : "missing",
      detail: tool("mcporter") ? "mcporter found" : "mcporter not found",
      fix: tool("mcporter") ? undefined : reach,
    },
    { group: "Where the agent reads", name: "X", state: tool("twitter") ? "ok" : "missing", detail: tool("twitter") ? "twitter-cli found" : "twitter-cli not found", fix: tool("twitter") ? undefined : reach },
    {
      group: "Where the agent reads",
      name: "Reddit, Facebook, Instagram",
      state: tool("opencli") ? "ok" : "missing",
      detail: tool("opencli") ? "OpenCLI found. It also needs Chrome running with its extension" : "OpenCLI not found",
      fix: tool("opencli") ? undefined : reach,
    },
  ];

  const live = switched && Boolean(claude);
  return {
    live,
    summary: live
      ? "Everything is connected. Questions in Rumours are researched live on this computer."
      : "The app is ready. Results run on the real data, and Rumours replays recorded notes until live research is on.",
    checks,
  };
}
