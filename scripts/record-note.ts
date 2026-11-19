/**
 * Runs live research once and saves the result as a recorded note in data/notes/recorded.json.
 * Needs Claude Code logged in and Agent Reach installed (see docs/SETUP.md).
 *
 *   npx tsx scripts/record-note.ts "Was voting extended in Rivers State in 2023?"
 *   npx tsx scripts/record-note.ts --about 32/15
 *   npx tsx scripts/record-note.ts --about 32/15 --langs pcm,ha,yo,ig
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LocalAgentResearcher } from "@/lib/notes/localAgent";
import type { Note } from "@/lib/notes/types";
import { LANGS, type Lang } from "@/lib/types";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};
const about = flag("about");
const langs = (flag("langs") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter((s): s is Lang => (LANGS as string[]).includes(s) && s !== "en");
const question = args.join(" ").trim();
if (!question && !about) {
  console.error('Give a question, or --about <area code>. Example: npx tsx scripts/record-note.ts "Is it true that ...?"');
  process.exit(1);
}

const file = join(process.cwd(), "data", "notes", "recorded.json");
const save = (note: Note) => {
  const all = (JSON.parse(readFileSync(file, "utf8")) as Note[]).filter((n) => n.id !== note.id);
  all.push({ ...note, recorded: true });
  writeFileSync(file, JSON.stringify(all, null, 2) + "\n");
  console.log(`saved ${note.id}: ${note.strength}, ${note.sources.length} sources`);
};

async function main() {
  const researcher = new LocalAgentResearcher();
  console.log("Researching (this takes a few minutes)...");
  const note = await researcher.research({ question, lang: "en", about });
  if (!note) throw new Error("No note came back");
  save(note);
  for (const lang of langs) {
    console.log(`Translating into ${lang}...`);
    save(await researcher.translate(note, lang));
  }
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
