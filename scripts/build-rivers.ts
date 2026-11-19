/**
 * Builds data/rivers-2023/published.json and announced.json from the raw CCIJ extracts in the same folder.
 * Run with: npx tsx scripts/build-rivers.ts
 * See data/rivers-2023/SOURCE.md for where the raw files come from.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "data", "rivers-2023");

/** Minimal CSV reader: handles quoted fields with commas and doubled quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** The extract is line-based, so a name that spanned two lines in the source arrives cut off with an open quote. */
function closeOpenQuotes(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const quotes = line.split('"').length - 1;
      return quotes % 2 === 1 ? line.slice(0, line.lastIndexOf('"')) + line.slice(line.lastIndexOf('"') + 1) : line;
    })
    .join("\n");
}

const read = (name: string) => parseCsv(closeOpenQuotes(readFileSync(join(dir, name), "utf8")));
const int = (s: string | undefined) => (!s || s.trim() === "" ? null : Math.round(Number(s)));
const title = (s: string | undefined) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/\-(.])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

// voter_info: Accredit_mark,registered_use,Registered_num,Accredited_num,polling_unit_code,status,APC,PDP,LP,NNPP,total_use
const votes = new Map<string, string[]>();
for (const r of read("rivers_voter_info.csv").slice(1)) votes.set(r[4], r);

// AllPollingUnitsInfo (no header): polling_unit_code,status,state_code,lga_code,ward_code,pu_code,lat,lng,
// state_name,lga_name,ward_name,unit_name,Document Name,id,URL
const units = read("rivers_apu.csv")
  .filter((r) => r[0].startsWith("32/"))
  .map((r) => {
    const v = votes.get(r[0]);
    if (!v) throw new Error(`No voter_info row for ${r[0]}`);
    const apc = int(v[6]);
    const figures = apc === null ? null : { APC: apc, LP: int(v[8]) ?? 0, PDP: int(v[7]) ?? 0, NNPP: int(v[9]) ?? 0 };
    const sheet = figures ? "read" : r[1] === "not uploaded" ? "not_uploaded" : "unreadable";
    return {
      code: r[0],
      name: title(r[11]) || `Polling unit ${r[0].slice(-3)}`,
      ward: title(r[10]),
      lga: title(r[9]),
      registered: int(v[1]) ?? 0,
      accredited: figures ? int(v[3]) : null,
      sheet,
      figures,
      sheetUrl: r[14]?.startsWith("http") ? r[14] : null,
    };
  })
  .sort((a, b) => a.code.localeCompare(b.code));

// LGALevelResult: State,S/N,LGA,APC,LP,PDP,NNPP. S/N is the local government's number within the state.
const lgaNames = new Map(units.map((u) => [u.code.slice(0, 5), u.lga]));
const announced = read("lga.csv")
  .filter((r) => r[0].trim().toLowerCase() === "rivers")
  .map((r) => {
    const code = `32/${r[1].trim().padStart(2, "0")}`;
    const name = lgaNames.get(code);
    if (!name) throw new Error(`No polling units for local government ${code} (${r[2]})`);
    return { code, name, figures: { APC: int(r[3]) ?? 0, LP: int(r[4]) ?? 0, PDP: int(r[5]) ?? 0, NNPP: int(r[6]) ?? 0 } };
  });

if (units.length !== 6866) throw new Error(`Expected 6866 Rivers polling units, got ${units.length}`);
if (announced.length !== 23) throw new Error(`Expected 23 Rivers local governments, got ${announced.length}`);

writeFileSync(join(dir, "published.json"), JSON.stringify(units) + "\n");
writeFileSync(join(dir, "announced.json"), JSON.stringify(announced, null, 1) + "\n");
console.log(`published.json: ${units.length} polling units, ${units.filter((u) => u.figures).length} with figures`);
console.log(`announced.json: ${announced.length} local governments`);
