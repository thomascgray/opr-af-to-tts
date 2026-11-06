# 05-refactor-1

**Status**: In Progress
**Spec**: ./SPECS/05-refactor-1.md

## Overview
Add a vitest harness with fixture-driven characterisation tests for the import flow, refactor `src/utils.tsx` into modules without changing output, then fix B1 (Caster/Tough stacking), B3 (hero detection), and improve error messages for unsupported game systems and an unavailable Army Forge.

## Repos
- `.` - frontend `src/`, `netlify/functions/get-army`, `scripts/`, locales

## Context
- `src/utils.tsx` - whole import + output flow today; `App.tsx` imports from it
- `src/state.ts` - valtio `state`, `initialTtsOutputConfig`, mutators
- `src/types.ts`, `src/army-forge-types.ts` - app types and hand-written Army Forge types
- `netlify/functions/get-army/get-army.ts` - CORS proxy using `got`
- `src/components/OutputOptions.tsx` - config toggles, saved configs in localStorage
- Node 22 locally, `.nvmrc` says 20; vitest 0.30.1, Vite 4
- Commands: `npm test`, `npm run build`, `npm run fixtures:refresh`

## Decisions
- 2026-11-06: Kept vitest 0.30.1. It starts fine on Node 22, so no bump needed.
- 2026-11-06: nanoid mock returns `nanoid-<n>` (counter reset per test), and the state snapshots mask those to `[nanoid]` via `maskNanoids`. A refactor that changes the number or order of nanoid calls then can't churn snapshots. Spec allowed counter or constant; this is the counter plus masking.
- 2026-11-06: Toggle snapshot runs store `"[same as default config]"` when the flipped output equals the default. Cut the snap file from 1.27 MB to 1.0 MB with no loss of coverage: a toggle that starts or stops affecting a list still diffs. Remaining size is the R7 state snapshots (raw units + full common rules per fixture), which the spec asks for.
- 2026-11-06: Fixtures seeded with empty placeholder files + `npm run fixtures:refresh` (spec allows either), not curl.
- 2026-11-06: The selected-upgrades push-branch test lives in `src/utils.test.ts` (it runs `onGenerateDefinitions`), not `state.test.ts` as guide step 6 suggested. Hand-built gain added in code, no synthetic fixture file needed.
- 2026-11-06: `removeQuantityStringFromStartOfString("3x Warriors")` returns `" Warriors"` (leading space, caller trims). Test pins that.
- 2026-11-06: Snapshots not compared against a running `netlify:dev` in the browser. They come from the real `onGenerateDefinitions` + `generateUnitOutput` path with fixtures; I read the F1 output by eye.
- 2026-11-06: Noted, not fixed: `deleteModel` with an unknown model id splices index -1 and removes the last model. Out of scope (no behaviour change).
- 2026-11-06: Phase 2 layout follows the spec: `src/army-forge/{client,map-list}.ts`, `src/tts-output/{generate-unit-output,names}.ts`, `src/utils.tsx` keeps the two handlers, `getUnitNameForLegend` and re-exports. `getUrlSlugForGameSystem` deleted (no other user), so it is the one formerly exported name no longer importable.
- 2026-11-06: Client errors are a typed `ArmyForgeError { kind, upstreamMessage }`; `utils.tsx` turns them into alert text, keeping `data.error || i18n.t(...)` precedence. Non-ArmyForge exceptions (network, JSON parse, mapper) go to `console.error` + ERROR with no alert, as before.
- 2026-11-06: Tiny behaviour difference: the common-rules check now also treats a null JSON body as a failure (alerts `fetchCommonRulesFailed`); before, it threw a TypeError and ended in ERROR silently. Our own function never returns null, so no snapshot covers it.
- 2026-11-06: The R16 resolver also owns the core/army include filter (`toActiveRule`), since both paths duplicated it. Match mode is a `"keyThenName" | "exactName"` parameter. The redundant third list in `collectLoadoutRules` (subset of the fourth) stays in Phase 2 so `uniqBy` keeps the same first match; Phase 3 rewrites that function.
- 2026-11-06: Unit `quality`/`defense` typed `number` (live data); mapper keeps `parseInt(String(x))` so string values from older lists still parse the same. `ListState.gameSystem` stays typed as the enum with a comment, since 7 to 10 can arrive.
- 2026-11-06: Merge push-branch fake `originalLoadout: { content }` kept as is (it is in the state snapshot); the `@ts-ignore` became a commented `as IUpgradeGains` cast.
- 2026-11-06: `vitest.setup.ts` restores spies after each test.
- 2026-11-06: B1 fix: `collectRulesFromLoadoutItem` dedupes per item, `collectLoadoutRules` concatenates. Snapshot diff: only the F1 Frog-Mage Caster line/value (7 runs). B3 fix: only the joined Master Destroyer saved name changed.
- 2026-11-06: R22 uses `getCommonRulesId` with an own-property check, so a game system string like `toString` cannot hit `Object.prototype`. `UnsupportedGameSystemError` extends `ArmyForgeError`.
- 2026-11-06: **R23 scope changed (user decision).** Army Forge answers a plain 500 with an empty body for an unknown list id, and 503 HTML for the suspended beta host. Only 502/503/504 and `ParseError` map to 502 `UPSTREAM_UNAVAILABLE`; a 500 keeps `Army Forge failed to export list. Sorry!`. Spec R23 and guide step 4 updated. The function picks the beta or live English text for `error` by `isBeta`.
- 2026-11-06: get-army matches got errors by `name` (`HTTPError`, `ParseError`; checked in node_modules/got) so tests can throw plain errors with `vi.mock("got")`. Verified live: beta list and beta common rules give 502 with the beta text, live list 200, unknown id 500.
- 2026-11-06: AC11 run showed Army Forge regenerates `selectedUpgrades[].instanceId`, `.upgrade.id` and `dependencies[].upgradeInstanceId` per request. `maskNanoids` now masks those as `[volatile]` so a refresh doesn't churn the R7 state snapshots. Output snapshots were unaffected.
- 2026-11-06: B2/B4 recorded in `SPECS/06-v36-followups.md` (stub).

## Blockers
None

## TODO
### Phase 1
- [x] 1. `package.json` has a `"test": "vitest run"` script. `npm test` exits 0.
- [x] 2. Tests live next to their source as `*.test.ts` (for example `src/utils.test.ts`). Fixtures live in `src/__fixtures__/`.
- [x] 3. Fixtures are raw Army Forge responses saved verbatim: `/api/tts?id=eozLqVsXDZCi` (Battle Brothers, gf), `/api/tts?id=JNKuWOyvWSxi` (gf), `/api/tts?id=D4P2sovK` (Alien Hives, gf), `/api/rules/common/2`, plus the lists from open question 2.
- [x] 4. Tests import from source modules only. They make no network calls (stub `fetch` where a function fetches).
- [x] 5. Snapshot tests cover `generateUnitOutput` for every model in every fixture with `initialTtsOutputConfig`, plus one run per boolean toggle in `ttsOutputConfig` flipped from its default. Skip `includeToughSpecialRuleRatingInName`.
- [x] 6. Unit tests cover: `extractIdFromUrl` (live link, beta link, link with `&name=`, no `id`), `removeQuantityStringFromStartOfString`, `generateLoadoutItemDefinition` (each `type`, item with null `label`), `getModelNameForOutput` (all four branches), `getUnitNameForSavedShareableOutput` (plain, custom name, joined), `insertLineBreaksIntoString`, `getCampaignTraitCategory`, `generateOriginalLoadoutCsvHelperString`, and the `state.ts` mutators.
- [x] 7. A test covers `onGenerateDefinitions` end to end with a stubbed `fetch` (fixture in, masked snapshot of `unitProfiles`, `armySpecialRulesDict`, `coreSpecialRulesDict`, `campaignTraitsDict`, `listName`, `gameSystem`), plus the error paths (no id, upstream error JSON, non-200).
- [x] 8. Tests for B1 and B3 assert the **current, wrong** output and carry a `// BUG B1` / `// BUG B3` comment. Phase 3 flips them.
- [x] 8a. `npm run fixtures:refresh` runs `scripts/refresh-fixtures.mjs` (plain Node 18+, built-in `fetch`, no new dependencies), re-downloads every `tts-<id>.json` and `common-rules-<n>.json`, 2-space pretty-print, skips `*.synthetic.json`, one log line per file, failure logs status, keeps old file, exits 1.
- [x] 8b. `src/__fixtures__/army-forge-contract.test.ts` checks every non-synthetic fixture against the shapes the code reads, with failure messages naming fixture file and JSON path.
### Phase 2
- [x] 9. Every Phase 1 snapshot passes unchanged after the refactor.
- [x] 10. `npm run build` passes.
- [x] 11. Split `src/utils.tsx` by responsibility. Keep every currently exported name importable from `src/utils.tsx` through re-exports.
- [x] 12. Separate fetching from mapping: a pure `mapArmyForgeListToUnitProfiles(list, commonRules)` returns `{ unitProfiles, armySpecialRulesDict, coreSpecialRulesDict, campaignTraitsDict, listName, gameSystem }`. `onGenerateDefinitions` only fetches, calls the mapper, writes state, and sets network state.
- [x] 13. Map game system to common rules id directly (`gf: 2, gff: 3, aof: 4, aofs: 5, aofr: 6`). Delete `getUrlSlugForGameSystem` if nothing else uses it.
- [x] 14. `extractIdFromUrl` returns `{ id: string | null; isBeta: boolean }`.
- [x] 15. Collapse the three identical branches of `generateLoadoutItemDefinition` into one.
- [x] 16. In `generateUnitOutput`, extract one rule-definition resolver used by both paths, matching behaviour passed as a parameter. Remove the in-place `rating` mutation and the side effect inside `.map`.
- [x] 17. Add `content?: IUpgradeGains[]` to `IUpgradeGains` and `specialRules` to `ListState`, make `ISpecialRule.key` optional, and type `rating` as `string | number`. Remove the `@ts-ignore`s these make unnecessary.
- [x] 17a. Rewrite `ListState`, `ISelectedUnit`, `IUpgradeGains*`, `ISpecialRule`, `ICommonRule` and `ICommonRuleTrait` so every field the R8b contract test checks has the same type.
- [x] 18. Delete dead code: `armySpecialRulesDictNames`, `includeToughSpecialRuleRatingInName`, dead block in `getUnitNameForSavedShareableOutput`, duplicate `return` in `parseString`, dead `data.error` check, `totalExtraDefense`, unused `TTS_TOUGH_COLOUR`. Old localStorage configs with the removed key must still load.
- [x] 19. Keep the dated history comments in `generateUnitOutput` and the selected-upgrades merge, moving them with the code.
### Phase 3
- [x] 20. B1: rules granted by different loadout items with the same name all count toward the rating total; same rule twice through one item counts once. Frog-Mage outputs `Caster (5)`, `Tough (9)`, `originalCasterValue: 5`, `originalToughValue: 9`.
- [x] 21. B3: `isUnitHero` returns true when any rule has `name === "Hero"` or `key === "hero"`. Joined hero's saved name reads `(joined to …)`, App.tsx label shows "joined to".
- [x] 22. Unknown game system: no common rules request, network state `ERROR`, alert `i18n.t("errors.unsupportedGameSystem", { gameSystem })`. English: `This list uses a game system the app doesn't support yet ({{gameSystem}}).`
- [x] 23. Upstream unavailable: Army Forge 502/503/504 or non-JSON -> `get-army` returns `502` with `{ "error": "<English text>", "code": "UPSTREAM_UNAVAILABLE" }`. Client checks `code` first and alerts `errors.armyForgeBetaUnavailable` (`The Army Forge beta site isn't responding. Beta lists can't be imported until it's back.`) or `errors.armyForgeUnavailable` (`Army Forge isn't responding right now. Try again in a few minutes.`).
- [x] 24. The three new keys go under `errors:` in all five locale files (`en`, `de`, `es`, `fr`, `it`), translated.
- [x] 25. `get-army` URL-encodes `armyId` and `commonRulesId` with `encodeURIComponent`.
### Deferred
- [x] Record B2 and B4 in a SPECS stub (no fix)

## Work log
- 2026-11-06: Phase 1. package.json (test, fixtures:refresh), vite.config.ts (test block), vitest.setup.ts, scripts/refresh-fixtures.mjs, src/__fixtures__/ (9 fixtures + contract test), src/test-helpers.ts, src/utils.test.ts, src/state.test.ts, src/state.ts (resetState). 167 tests pass, build passes.
- 2026-11-06: Phase 2. army-forge-types.ts (R17/R17a), types.ts, state.ts (dead fields), new src/army-forge/client.ts, src/army-forge/map-list.ts, src/tts-output/generate-unit-output.ts, src/tts-output/names.ts; utils.tsx now handlers + re-exports. Snapshot file byte-identical to Phase 1. 168 tests, build passes, no @ts-ignore left in src.
- 2026-11-06: Phase 3. tts-output/generate-unit-output.ts (B1), tts-output/names.ts (B3), army-forge/client.ts + utils.tsx (R22, R23 client), netlify/functions/get-army/get-army.ts + get-army.test.ts (R23, R25), src/locales/*.yaml (R24), SPECS/06-v36-followups.md, test-helpers.ts (volatile id masking). 186 tests pass after a fresh fixtures:refresh; build passes.
