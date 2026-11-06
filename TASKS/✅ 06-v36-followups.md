# 06-v36-followups

**Status**: Complete
**Spec**: ./SPECS/06-v36-followups.md

## Overview
Stamp saved lists with `rulesVersion: "3.6"` and make the TTS mod drop the skirmish `+ 5` HP only for stamped lists and models. Delete the dead `useShorterVersionOfCoreSpecialRules` / `shortDescription` path.

## Repos
- `.` - app (`src/`) and mod (`tts_lua_code/mod.lua`), plus `CLAUDE/mod-context.md`

## Context
- `src/utils.tsx` `onGenerateShareableId` builds `totalOutput` and POSTs via `ky`. Tests spy on `ky.post` (stubbing `fetch` fails under node, see Decisions).
- `npm run lua:check` syntax-checks `mod.lua` and the `perModelCode` string. Run it after every Lua edit.
- Hand test path for a list with `rulesVersion` before deploy: `npm run netlify:dev` with Turso env vars (in-memory fallback logs a `[save-list] ... using in-memory store` warning and won't reach TTS), save in the local app, paste `https://opr-af-to-tts.netlify.app/.netlify/functions/save-list?listId=<id>` into TTS.
- Outside the repo: the user's VS Code TTS Lua extension (`rolandostar.tabletopsimulator-lua-1.1.3`) failed to activate on VS Code 1.141 (`onig.wasm` moved to `node_modules.asar.unpacked`). Patched `dist/extension.js:9406` to try both paths; original at `extension.js.bak`. Reinstalling the extension undoes the patch.
- `src/utils.test.ts` `BOOLEAN_TOGGLES` derives from `initialTtsOutputConfig`, so removing the key from `src/state.ts` drops the flipped case automatically.
- Saved output configs: `src/components/OutputOptions.tsx` localStorage key `tombolaopraftotts_ttsOutputConfigs`, loaded with `state.ttsOutputConfig = { ...config.config }`.
- `npm test` = `vitest run`; `npm run build` = tsc + vite build.

## Decisions
- 2026-11-06: R4 needs no code. Loading a saved config spreads it into state; an extra key is never read. Matches spec.
- 2026-11-06: `onGenerateShareableId` test spies on `ky.post` instead of stubbing `fetch` (spec guide step 6). Under the node test env ky can't build a `Request` from the relative save-list URL, and `window` is undefined, so the test stubs `window` too. Same assertion as the spec asks for.
- 2026-11-06: R6 "resets alongside the other `*ToAssign` globals" read as: overwritten on every `handleResponse`, like `gameSystemToAssign` / `armyNameToAssign`. Not cleared in `cancelCurrentAssigning`, because that runs after every assignment (`mod.lua` `:1060`, `:1066`, `:1086`) and clearing there would give the second model from a 3.6 list Tough + 5. Interpretation, not a requirement change.
- 2026-11-06: Out of spec, at the user's request during the TTS hand test: the floating UI moved up and down on every HP change because `buildActionPanelXml` re-read `self.getBounds()` (world-space box, changes with tilt) each rebuild. Now measured once and stored as memo `uiBaseHeight`; older models measure on their next build. A rescaled model keeps its old height; Menu Up/Down still adjusts.
- 2026-11-06: Also documented `rulesVersion` in the army data format block and the Global variables list of `CLAUDE/mod-context.md`, beyond the four places R14 names.

## Blockers
None

## TODO
### App
- [x] 1. `iTotalShareableOutput` (`src/types.ts`) gets `rulesVersion: string`.
- [x] 2. `onGenerateShareableId` (`src/utils.tsx`) sets `rulesVersion` to the exported constant `CURRENT_RULES_VERSION = "3.6"`. Every newly saved list carries it.
- [x] 3. Delete `useShorterVersionOfCoreSpecialRules` from `iAppState.ttsOutputConfig` in `src/types.ts`, from the initial config in `src/state.ts`, and the `shortDescription` branch in `src/tts-output/generate-unit-output.ts`. Delete `shortDescription` from the types in `src/types.ts:87` and `src/army-forge-types.ts:39` if nothing else reads it.
- [x] 4. A localStorage config that still has `useShorterVersionOfCoreSpecialRules` loads without error (extra keys are ignored).
- [x] 5. Remove the `useShorterVersionOfCoreSpecialRules flipped` case from the toggle snapshot test, and delete its six obsolete snapshot entries. No other snapshot changes.
### Mod (`tts_lua_code/mod.lua`)
- [x] 6. `handleResponse` reads `data['listJson']['rulesVersion']` into a new module global `rulesVersionToAssign` (nil when absent). It resets alongside the other `*ToAssign` globals.
- [x] 7. The model memo written at assignment (`:1013` onward) includes `rulesVersion = rulesVersionToAssign`. A nil value leaves the key out of the memo, which reads back as nil. That is intended.
- [x] 8. One helper in `perModelCode`, and the same logic at the assignment site: a model uses legacy skirmish wounds when `isSkirmishSystem(gameSystem)` and `rulesVersion == nil`.
- [x] 9. Starting HP (`:1006`–`:1011`): `originalTough + 5` for legacy skirmish, `originalTough` otherwise.
- [x] 10. HP bar max (`:722`): `originalTough + 5` for legacy skirmish, `originalTough` otherwise.
- [x] 11. `hasTough` (`:173`, `:620`): `originalToughValue ~= 0`, or legacy skirmish. A versioned skirmish model with Tough 0 shows no HP bar and no HP +/- buttons, same as a traditional model.
- [x] 12. Traditional systems (`gf`, `aof`, `aofr`) behave the same whatever `rulesVersion` says.
- [x] 13. The mod treats any non-nil `rulesVersion` as 3.6 or later. It does not parse or compare the string. A later rules change that needs version comparison is a future spec.
- [x] 14. Update the comments at `:721` and `:1006`, and `CLAUDE/mod-context.md` (memo shape near line 77, the skirmish section near lines 105–109, the action table at lines 196–197, line 291) to describe both cases.

## TTS hand test (user)
Paste the current `tts_lua_code/mod.lua` into Global first. Models assigned before a paste keep their old per-model script until re-assigned.

Done (2026-11-06):
- [x] F3 saved with the new app, loaded in TTS: Master Destroyer shows `HP: 18/18` (was 23). HP +/- works.
- [x] Floating UI stays at the same height across HP changes (`uiBaseHeight` fix).

Not formally run. The user spot-checked some of these, saw no problems, released the mod, and closed the task (2026-11-06):
- [ ] 1. F3 (`https://army-forge.onepagerules.com/share?id=4IycTvl_idGU&name=Battle_Brothers`): Battle Brother shows `HP: 3/3`. Assign several models from the same unit in a row; every one gets Tough, not Tough + 5. HP+ stops at max. Any skirmish model with Tough 0 has no HP bar and no HP buttons.
- [ ] 2. A gff or aofs share link saved before 2026-11-06: Battle Brother `8/8`, Master Destroyer `23/23`; every model shows the HP bar.
- [ ] 3. Same session, no restart: load the new list, then the old one, assign from the old one (expect Tough + 5); load the new one again, assign (expect Tough).
- [ ] 4. Models assigned by the current Steam mod (saved table or library): HP and bar max unchanged after loading with the new mod. Save and reload a table with new-list models: still `3/3` and `18/18`, bar at the same height.
- [ ] 5. Any gf or aof list, old or new: HP equals Tough; Tough 0 models have no HP bar.
- [ ] 6. No Lua errors in the TTS console during load and assignment; open the action panel and toggle Stunned once.

When all pass: run the Finish step (re-check spec Requirements and Acceptance criteria, `npm run build`, `npm test`, `npm run lua:check`), then ask to mark complete.

## Work log
- 2026-11-06: task doc created
- 2026-11-06: `src/types.ts`, `src/army-forge-types.ts`, `src/state.ts`, `src/tts-output/generate-unit-output.ts`, `src/utils.tsx` - rulesVersion stamp, dead short-description code removed
- 2026-11-06: `src/utils.test.ts` - onGenerateShareableId test; `src/__snapshots__/utils.test.ts.snap` - six flipped entries removed, nothing else changed (diffed against a copy)
- 2026-11-06: `tts_lua_code/mod.lua` - `rulesVersionToAssign`, `usesLegacySkirmishWounds`, starting HP, bar max, hasTough x2, memo field
- 2026-11-06: `CLAUDE/mod-context.md` - both skirmish cases documented
- 2026-11-06: `npm run build` and `npm test` (181 passed) green. Lua not syntax-checked (no interpreter here); user hand-tests in TTS per spec
- 2026-11-06: added `luaparse` devDependency, `scripts/check-lua.mjs`, `npm run lua:check` (also parses the `perModelCode` string separately); noted in `CLAUDE.md`. `mod.lua` passes; a planted error in perModelCode was caught at the right line
- 2026-11-06: `tts_lua_code/mod.lua` `buildActionPanelXml` - floating UI height stored as memo `uiBaseHeight` instead of re-reading `getBounds()` each rebuild; `CLAUDE/mod-context.md` memo shape updated. `lua:check` passes; user confirmed in TTS
- 2026-11-06: hand test started; 2 checks done, 6 remaining (see TTS hand test section)
- 2026-11-06: user spot-checked, released the mod, closed the task. Remaining hand tests left unticked. `npm run build`, `npm test` (181 passed), `npm run lua:check` green
