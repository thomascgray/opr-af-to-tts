# 07-quest-support

**Status**: In Progress
**Spec**: ./SPECS/07-quest-support.md

## Overview
Map the four Quest game systems (aofq 7, aofqai 8, gfsq 9, gfsqai 10) to their common rules, give them Shaken + Tough-in-name handling in the TTS mod, and show an experimental notice after a Quest import. Also fix the stale "no test harness" line in CLAUDE.md.

## Repos
- `.` - `src/`, `src/locales/`, `src/__fixtures__/`, `tts_lua_code/mod.lua`, `CLAUDE.md`

## Context
- `src/army-forge/client.ts` - `COMMON_RULES_ID_BY_GAME_SYSTEM` is `Record<eGameSystemInitials, number>`, so new enum members force new map entries
- `src/test-helpers.ts` - fixture map for tests
- `src/__fixtures__/army-forge-contract.test.ts:170` - picks up every `common-rules-<n>.json` automatically
- Commands: `npm run build`, `npm test`, `npm run lua:check`, `npm run fixtures:refresh`

## Decisions
- 2026-11-06: Reverted the other nine fixtures after `fixtures:refresh`; only `common-rules-9.json` is new. The refresh pulled live data drift into four `tts-*.json` files, unrelated to Quest. Spec step 3 didn't anticipate the script rewriting everything.
- 2026-11-06: R4 assertion uses Scout, the only rule in the GFF fixture (`4IycTvl_idGU`) whose wording differs between common rules 3 and 9. Added `GFF` constant in `utils.test.ts`.
- 2026-11-06: Added an `it.each` for `getCommonRulesId` on all four Quest keys to cover AC2 (7, 8, 10), which the spec guide didn't list a test for.
- 2026-11-06: `isQuestGameSystem` imported in `App.tsx` straight from `./army-forge/client`, not via the `utils.tsx` re-exports. It's new and nothing else needs it through utils.
- 2026-11-06: CLAUDE.md (user request): replaced the "no test harness" line with `npm test` and `npm run fixtures:refresh` entries; also fixed `generateUnitOutput`'s path (moved by spec 05) and "localStorage fallback" (code uses an in-memory Map).

- 2026-11-06: User supplied a real Star Quest list (`6FZHY-L1jwGW`, `gfsqai`). Added it and `common-rules-10.json` as fixtures (same refresh-then-revert routine) and `gfsqai: 10` to the test map, so the per-fixture import and output snapshots cover a real Quest list. Output checked by eye: requests common rules 10, Hero shows the AI "Villain" wording, Tough 18/9/3/3. Spec endpoint table updated.

## Blockers
None. Hand checks still open: spec step 6a (notice in browser, light/dark, a non-English locale) and step 7 (TTS, R7 to R9). Step 8 (comment on #72) is after release.

## TODO
- [x] 1. `eGameSystemInitials` (`src/army-forge-types.ts`) gains `AOFQ = "aofq"`, `AOFQAI = "aofqai"`, `GFSQ = "gfsq"`, `GFSQAI = "gfsqai"`.
- [x] 2. `COMMON_RULES_ID_BY_GAME_SYSTEM` (`src/army-forge/client.ts`) maps `aofq` to 7, `aofqai` to 8, `gfsq` to 9, `gfsqai` to 10.
- [x] 3. A list with any of the four keys imports through the existing flow with no alert, and produces BBCode output and a share link.
- [x] 4. Rule descriptions come from the matching common rules id: a `gfsq` list shows the common rules 9 wording of Ambush, not the common rules 3 wording.
- [x] 5. `gameSystem` in the saved shareable output is the raw Army Forge key (`gfsq` etc.), unchanged.
- [x] 6. `mod.lua` perModelCode gets `isQuestSystem(gameSystem)`, true for `aofq`, `aofqai`, `gfsq`, `gfsqai`. `isTraditionalSystem` and `isSkirmishSystem` stay as they are.
- [x] 7. For a Quest model, the context menu (`rebuildContext`) shows "Shaken", and does not show "Stunned".
- [x] 8. For a Quest model, the action panel unit column shows the "Shaken" button, and not "Stunned".
- [x] 9. For a Quest model with `originalToughValue ~= 0`, `rebuildName` appends `"\r\nTough: " .. originalToughValue`, the same as skirmish.
- [x] 10. Quest models never get the legacy +5 wounds: `usesLegacySkirmishWounds` and the assign-time `startingHP` check stay skirmish-only.
- [x] 11. Any other unmapped game system still shows `errors.unsupportedGameSystem` (spec 05 R22).
- [x] 12. The comments saying the app doesn't map systems 7 to 10 (`src/army-forge/client.ts:93`, `src/army-forge-types.ts:30`) are removed or rewritten.
- [x] 13. `src/army-forge/client.ts` exports `isQuestGameSystem(gameSystem: string | undefined): boolean`, true only for `aofq`, `aofqai`, `gfsq`, `gfsqai`.
- [x] 14. Experimental notice: when `stateView.unitProfiles.length >= 1` and `isQuestGameSystem(stateView.gameSystem)`, `App.tsx` shows an inline notice directly after the `<hr className="my-5" />` that opens the unit section, before the Inline Options fieldset. It is not an `alert()` and does not block the import.
- [x] 15. Notice text is i18n key `app.questExperimental.text`. English, verbatim: `Quest and Star Quest lists are experimental and may not work 100%. Please report any problems on <0>this GitHub issue</0>.` `<0>` renders through `<Trans>` as a link to `https://github.com/thomascgray/opr-af-to-tts/issues/74`, `target="_blank"`, same link classes as the `app.bugReport.text` link.
- [x] 16. The key is added to all five locales (`en`, `de`, `es`, `fr`, `it`), translated, keeping the `<0>…</0>` placeholder. Same practice as `errors.unsupportedGameSystem` in spec 05.
- [x] 17. Notice styling: an amber box readable in light and dark mode, for example `p-3 mb-4 text-sm border border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-600`. No icon, no dismiss button.
- [x] 18. The notice goes away when a non-Quest list is imported, because `onGenerateDefinitions` overwrites `state.gameSystem`. State isn't persisted, so a page refresh clears it too.
- [x] 19. The TTS mod shows no experimental warning.
- [x] Extra (user request): fix CLAUDE.md's stale "no test harness" line.

## Work log
- 2026-11-06: `src/army-forge-types.ts` enum + comment; `src/army-forge/client.ts` map, `isQuestGameSystem`, comment
- 2026-11-06: `src/locales/{en,de,es,fr,it}.yaml` `app.questExperimental.text`; `src/App.tsx` notice
- 2026-11-06: `src/__fixtures__/common-rules-9.json` new; `src/test-helpers.ts` `gfsq: 9`; `src/utils.test.ts` zzz test, Star Quest import test, id map + `isQuestGameSystem` tests
- 2026-11-06: `tts_lua_code/mod.lua` `isQuestSystem`, rebuildName, rebuildContext, action panel
- 2026-11-06: `CLAUDE.md` commands + stale paths
- 2026-11-06: `npm run build`, `npm test` (188 pass), `npm run lua:check` all pass
- 2026-11-06: `src/__fixtures__/tts-6FZHY-L1jwGW.json`, `common-rules-10.json` new; `src/test-helpers.ts` `gfsqai: 10`; 19 new snapshots in `src/__snapshots__/utils.test.ts.snap`; `npm test` 208 pass
