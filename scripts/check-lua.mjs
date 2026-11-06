// Syntax-checks tts_lua_code/mod.lua with luaparse. Parse errors only: it catches
// typos and unbalanced blocks, not undefined globals or wrong TTS API calls.
//
// perModelCode is a [[ ... ]] string that gets injected into each model as its own
// script, so a parse of mod.lua treats it as one opaque string. The script pulls
// it out and parses it separately, with line numbers mapped back to mod.lua.
//
// TTS runs MoonSharp, which is close to Lua 5.2.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import luaparse from "luaparse";

const MOD_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "tts_lua_code",
  "mod.lua"
);
const OPTIONS = { luaVersion: "5.2", locations: true };

const check = (label, source, lineOffset) => {
  try {
    luaparse.parse(source, OPTIONS);
    console.log(`ok    ${label}`);
    return true;
  } catch (e) {
    const line = e.line != null ? e.line + lineOffset : "?";
    // luaparse prefixes "[line:col]" relative to the parsed string; drop it
    const message = e.message.replace(/^\[\d+:\d+\]\s*/, "");
    console.error(`FAIL  ${label}: mod.lua:${line}: ${message}`);
    return false;
  }
};

const source = await readFile(MOD_PATH, "utf8");
let ok = check("mod.lua", source, 0);

if (ok) {
  const ast = luaparse.parse(source, OPTIONS);
  const decl = ast.body.find(
    (s) =>
      s.type === "LocalStatement" &&
      s.variables.some((v) => v.name === "perModelCode")
  );
  const literal = decl?.init?.[0];
  const open = literal?.raw && /^\[=*\[/.exec(literal.raw);
  if (!open) {
    console.error("FAIL  could not find the perModelCode [[ ]] string");
    ok = false;
  } else {
    let inner = literal.raw.slice(open[0].length, -open[0].length);
    // Lua drops a newline straight after the opening bracket
    let offset = literal.loc.start.line - 1;
    if (inner.startsWith("\r\n")) inner = inner.slice(2), offset++;
    else if (inner.startsWith("\n")) inner = inner.slice(1), offset++;
    ok = check("perModelCode", inner, offset) && ok;
  }
}

process.exit(ok ? 0 : 1);
