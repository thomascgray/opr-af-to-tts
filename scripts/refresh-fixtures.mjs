// Re-downloads every Army Forge fixture in src/__fixtures__/, taking the ids from
// the existing file names. This is the only way fixtures get written: never hand-edit
// a non-synthetic fixture. Hand-built cases go in *.synthetic.json and are skipped.
//
//   tts-<id>.json            <- https://army-forge.onepagerules.com/api/tts?id=<id>
//   common-rules-<n>.json    <- https://army-forge.onepagerules.com/api/rules/common/<n>
//
// To add a fixture, create an empty file with the right name and run this script.

import { readdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "__fixtures__"
);
const BASE = "https://army-forge.onepagerules.com";

const urlForFile = (file) => {
  if (file.endsWith(".synthetic.json")) return null;
  const tts = /^tts-(.+)\.json$/.exec(file);
  if (tts) return `${BASE}/api/tts?id=${encodeURIComponent(tts[1])}`;
  const common = /^common-rules-(\d+)\.json$/.exec(file);
  if (common) return `${BASE}/api/rules/common/${common[1]}`;
  return null;
};

const files = (await readdir(FIXTURES_DIR)).sort();
let failed = false;

for (const file of files) {
  const url = urlForFile(file);
  if (!url) continue;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`FAIL ${file}: HTTP ${res.status} from ${url}`);
      failed = true;
      continue;
    }
    const json = await res.json();
    await writeFile(join(FIXTURES_DIR, file), JSON.stringify(json, null, 2) + "\n");
    console.log(`ok   ${file}`);
  } catch (e) {
    console.error(`FAIL ${file}: ${e.message} (${url})`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
