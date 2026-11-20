#!/usr/bin/env node
// npm run demo
//
// One command to run Tallie on your own computer: it checks what is installed, turns on live
// research when Claude Code is found, starts the app, prints what is connected, and opens the
// browser on the page that shows the same thing.
//
//   npm run demo                 start and open the browser
//   npm run demo -- --no-open    start without opening the browser
//   PORT=4000 npm run demo       use another port

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

const win = process.platform === "win32";
const port = Number(process.env.PORT) || 3000;
const base = `http://localhost:${port}`;
const say = (line = "") => process.stdout.write(`${line}\n`);

function onPath(name) {
  const exts = win ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (!dir) continue;
    for (const ext of exts) if (existsSync(join(dir, name + ext)) || existsSync(join(dir, name + ext.toLowerCase()))) return true;
  }
  return false;
}

say();
say("  Tallie");
say("  ------");

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  say(`  Node ${process.versions.node} is too old. Tallie needs Node 20 or newer.`);
  process.exit(1);
}

if (!existsSync("node_modules")) {
  say("  Installing packages (first run only)...");
  const r = spawnSync("npm install", { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Live research needs Claude Code. Turn it on when it is there, unless the caller already chose.
const claude = process.env.TALLY_CLAUDE_BIN ? existsSync(process.env.TALLY_CLAUDE_BIN) || onPath(process.env.TALLY_CLAUDE_BIN) : onPath("claude");
const env = { ...process.env };
if (claude && env.TALLY_RESEARCH === undefined) env.TALLY_RESEARCH = "live";

say(`  Starting on ${base} ...`);
const server = spawn(`npx next dev -p ${port}`, { env, shell: true, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
server.on("exit", (code) => {
  if (code) say(log.trim().split("\n").slice(-12).join("\n"));
  process.exit(code ?? 0);
});
const stop = () => {
  if (win) spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill("SIGINT");
};
process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("SIGTERM", stop);

async function status() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${base}/api/status`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

const st = await status();
if (!st) {
  say("  Tallie did not start within two minutes. Last output:");
  say(log.trim().split("\n").slice(-12).join("\n"));
  stop();
  process.exit(1);
}

const sign = { ok: "[ok]", off: "[off]", missing: "[--]" };
let group = "";
for (const c of st.checks) {
  if (c.group !== group) {
    group = c.group;
    say();
    say(`  ${group}`);
  }
  say(`    ${sign[c.state].padEnd(6)}${c.name}: ${c.detail}`);
  if (c.fix) say(`          ${c.fix}`);
}
say();
say(`  ${st.summary}`);
say();
say(`  Connections   ${base}/status`);
say(`  The app       ${base}/unit`);
say(`  Landing page  ${base}/`);
say();
say("  Press Ctrl+C to stop.");

if (!process.argv.includes("--no-open")) {
  const url = `${base}/status`;
  if (win) spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
  else spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { stdio: "ignore", detached: true }).unref();
}
