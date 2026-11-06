# 07-quest-support: Star Quest (and Quest) list import

**Source**: https://github.com/thomascgray/opr-af-to-tts/issues/72

## What and why

Importing an Army Forge list built for Grimdark Future: Star Quest fails with "Failed to fetch common rules". On `main`, `src/utils.tsx` looks the list's `gameSystem` up in a map that only has the five core systems, gets `undefined`, and calls `get-army?commonRulesId=undefined`, which Army Forge answers with a 500. The 05 refactor on this branch replaced that with a clear "unsupported game system" alert, but the list still can't be imported.

Star Quest has two parts in Army Forge today. Lists (an army book loaded under game system `gfsq`) use the same data shape as Firefight and can go through the existing pipeline with a mapping change. The newer mission flow ("Start New Mission", campaigns) is a hero RPG with skills, injuries, gold and stress, stored per account. It has no TTS export and is out of scope.

This spec adds the four Quest game systems to the mapping and gives them their own handling in the TTS mod. Nobody has tested a real Quest list end to end yet, so the app shows an "experimental" notice after a Quest import. The notice links to issue #74, the long-running Quest feedback issue.

## Requirements from the source

> **Star Quest list building #72**
>
> When attempting to import the link to my enemy force for a star quest game, I am greeted with an error that the app failed to fetch common rules.
>
> (comment, Jul 16) The same for me today

## Endpoint investigation (2026-11-06)

Checked against live `army-forge.onepagerules.com`:

| Check | Result |
|---|---|
| `GET /api/rules/common/{7,8,9,10}` | All 200. Same `{ rules, traits }` shape as 2 to 6. 39 rules each, `traits` empty. |
| Rule names, common 3 vs 9 vs 10 | Identical set of 39 names. Descriptions differ for 9 (Ambush, Blast, Caster, Fear, Indirect, Scout, Transport) and 10 (AI wording: "random AI Goal", "Villain"). |
| Army Forge JS bundle, game system table | `aofq` id 7 "Age of Fantasy: Quest", `aofqai` id 8 "Age of Fantasy: Quest AI", `gfsq` id 9 "Grimdark Future: Star Quest", `gfsqai` id 10 "Grimdark Future: Star Quest AI". All four have `afLoadDisabled: true`. |
| `GET /api/army-books?gameSystemSlug=grimdark-future-star-quest` | 56 official books, same uids as GF/GFF (`enabledGameSystems: [2,3,9,10]`). |
| `GET /api/army-books/78qp9l5alslt6yj8?gameSystem=9` (Battle Brothers) | Same unit/weapon/upgrade shape as `gameSystem=3`. Units are single-model heroes, Q6+/D6+, `Tough(9)`/`Tough(18)`, plus `tough` and `costs[].questCost` fields. |
| Quest hero mode | Uses `/api/account/heroes`, `/api/quest/rules/<n>` and `/api/quest/hero-book-data`. Nothing under `/api/tts`. |
| `GET /api/tts?id=6FZHY-L1jwGW` (Battle Brothers, Star Quest collection, checked during /task) | 200, same top-level and unit shape as other lists. `gameSystem: "gfsqai"`, 4 single-model units, `Tough(18)`/`Tough(9)`/`Tough(3)`. Kept as fixture `tts-6FZHY-L1jwGW.json` with `common-rules-10.json`. |

`afLoadDisabled` stops the normal builder loading a book under a Quest system, so new Quest lists may be rare. Lists that already exist still have share links.

## Requirements

1. `eGameSystemInitials` (`src/army-forge-types.ts`) gains `AOFQ = "aofq"`, `AOFQAI = "aofqai"`, `GFSQ = "gfsq"`, `GFSQAI = "gfsqai"`.
2. `COMMON_RULES_ID_BY_GAME_SYSTEM` (`src/army-forge/client.ts`) maps `aofq` to 7, `aofqai` to 8, `gfsq` to 9, `gfsqai` to 10.
3. A list with any of the four keys imports through the existing flow with no alert, and produces BBCode output and a share link.
4. Rule descriptions come from the matching common rules id: a `gfsq` list shows the common rules 9 wording of Ambush, not the common rules 3 wording.
5. `gameSystem` in the saved shareable output is the raw Army Forge key (`gfsq` etc.), unchanged.
6. `mod.lua` perModelCode gets `isQuestSystem(gameSystem)`, true for `aofq`, `aofqai`, `gfsq`, `gfsqai`. `isTraditionalSystem` and `isSkirmishSystem` stay as they are.
7. For a Quest model, the context menu (`rebuildContext`) shows "Shaken", and does not show "Stunned".
8. For a Quest model, the action panel unit column shows the "Shaken" button, and not "Stunned".
9. For a Quest model with `originalToughValue ~= 0`, `rebuildName` appends `"\r\nTough: " .. originalToughValue`, the same as skirmish.
10. Quest models never get the legacy +5 wounds: `usesLegacySkirmishWounds` and the assign-time `startingHP` check stay skirmish-only.
11. Any other unmapped game system still shows `errors.unsupportedGameSystem` (spec 05 R22).
12. The comments saying the app doesn't map systems 7 to 10 (`src/army-forge/client.ts:93`, `src/army-forge-types.ts:30`) are removed or rewritten.
13. `src/army-forge/client.ts` exports `isQuestGameSystem(gameSystem: string | undefined): boolean`, true only for `aofq`, `aofqai`, `gfsq`, `gfsqai`.
14. Experimental notice: when `stateView.unitProfiles.length >= 1` and `isQuestGameSystem(stateView.gameSystem)`, `App.tsx` shows an inline notice directly after the `<hr className="my-5" />` that opens the unit section, before the Inline Options fieldset. It is not an `alert()` and does not block the import.
15. Notice text is i18n key `app.questExperimental.text`. English, verbatim: `Quest and Star Quest lists are experimental and may not work 100%. Please report any problems on <0>this GitHub issue</0>.` `<0>` renders through `<Trans>` as a link to `https://github.com/thomascgray/opr-af-to-tts/issues/74`, `target="_blank"`, same link classes as the `app.bugReport.text` link.
16. The key is added to all five locales (`en`, `de`, `es`, `fr`, `it`), translated, keeping the `<0>…</0>` placeholder. Same practice as `errors.unsupportedGameSystem` in spec 05.
17. Notice styling: an amber box readable in light and dark mode, for example `p-3 mb-4 text-sm border border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-600`. No icon, no dismiss button.
18. The notice goes away when a non-Quest list is imported, because `onGenerateDefinitions` overwrites `state.gameSystem`. State isn't persisted, so a page refresh clears it too.
19. The TTS mod shows no experimental warning.

## Out of scope

- Quest hero mode (heroes, skills, injuries, missions, campaigns). Army Forge has no export endpoint for it.
- Showing `questCost` instead of `cost`. The app doesn't output points.
- Grimdark Future: Warfleets (`gfwf`), which uses its own `/api/gfwf` endpoint.
- A game-system picker or any UI beyond the experimental notice. The system still comes from the list.
- An experimental warning inside the TTS mod.
- Changes to `netlify/functions/get-army/get-army.ts`. It already passes any `commonRulesId` through.

## Technical notes

Types:
- `eGameSystemInitials`, `ListState.gameSystem`: `src/army-forge-types.ts:1`, `:32`.
- `iUnitProfile.gameSystem`, `iTotalShareableOutput.gameSystem`: `src/types.ts:11`, `:90`. Both use the enum, so they pick up the new keys.

Files:
- `src/army-forge-types.ts`: enum, comment at `:30`.
- `src/army-forge/client.ts`: id map at `:8`, comment at `:93`.
- `src/test-helpers.ts:25`: `COMMON_RULES_FIXTURE_BY_GAME_SYSTEM`, the test-only map from key to fixture file.
- `src/utils.test.ts:205`: "doesn't request common rules for a game system it can't map" uses `gfsq` as its unmapped example. It breaks once `gfsq` is mapped.
- `src/__fixtures__/common-rules-9.json`: new, filled by `npm run fixtures:refresh` (create an empty file, run the script; `scripts/refresh-fixtures.mjs` explains).
- `tts_lua_code/mod.lua`, all inside the `perModelCode` string:
  - `:84` `isTraditionalSystem`, `:88` `isSkirmishSystem`: add `isQuestSystem` next to them.
  - `:540` `rebuildName`: Tough in name.
  - `:587` `rebuildContext`: Shaken/Stunned menu items.
  - `:700` action panel unit column buttons.
  - `:95` `usesLegacySkirmishWounds` and global `:1027` `startingHP`: no change (R10).

- `src/App.tsx:64`: existing `<Trans i18nKey="app.bugReport.text">` with a link component. Copy it for the notice. Unit section starts at `:146` (`stateView.unitProfiles.length >= 1 && (<> <hr className="my-5" /> ...`).
- `src/locales/{en,de,es,fr,it}.yaml`: `app.bugReport` at `en.yaml:10` is the nearest key; add `app.questExperimental.text` after it, with a `# <0> = link to GitHub issue #74` comment like the one on `bugReport`.

Pattern: the five existing entries in the same map. Nothing else in `src/` branches on game system. There are no component tests (only `state.test.ts`, `utils.test.ts`, the contract test), so the notice is covered by a unit test of `isQuestGameSystem` plus a hand check.

## Open questions

None.

## Implementation guide

1. `src/army-forge-types.ts`: add the four enum members after `AOFR`. Rewrite the comment on `ListState.gameSystem` to say a string outside the enum is still possible (for example `gfwf`).
2. `src/army-forge/client.ts`: add the four entries to `COMMON_RULES_ID_BY_GAME_SYSTEM`. Update the comment in `fetchCommonRules` so it no longer names systems 7 to 10. Add `isQuestGameSystem` (R13), backed by a `const QUEST_GAME_SYSTEMS: string[]` of the four enum values.
2a. Locales: add `app.questExperimental.text` to all five yaml files (R15, R16).
2b. `src/App.tsx`: import `isQuestGameSystem`. Inside the `unitProfiles.length >= 1` fragment, after the `<hr>`, render `{isQuestGameSystem(stateView.gameSystem) && (<p className="...R17 classes..."><Trans i18nKey="app.questExperimental.text" components={[<a target="_blank" className="<bugReport link classes>" href="https://github.com/thomascgray/opr-af-to-tts/issues/74" />]} /></p>)}`.
3. Fixture: create empty `src/__fixtures__/common-rules-9.json`, run `npm run fixtures:refresh`, and check the file now holds `{ rules, traits }`. Add `gfsq: 9` to `COMMON_RULES_FIXTURE_BY_GAME_SYSTEM` in `src/test-helpers.ts`.
4. `src/utils.test.ts`:
   - Change the unmapped-system test (`:205`) from `"gfsq"` to `"zzz"`, including the expected alert text.
   - Add a test for `isQuestGameSystem`: true for the four Quest keys, false for `gf`, `gff`, `aof`, `aofs`, `aofr`, `undefined` and `"toString"`.
   - Add a test next to the unmapped one: take the GFF fixture (`loadList("4IycTvl_idGU")`) with `gameSystem: "gfsq"`, stub fetch with `common-rules-9.json`, run `onGenerateDefinitions`. Assert the fetch calls are the list request then `get-army?commonRulesId=9&isBeta=false`, no alert, network state not `ERROR`, and `state.gameSystem === "gfsq"`. If the fixture has a unit with a rule whose wording differs between 3 and 9 (Ambush, Scout, Caster, Fear, Indirect, Blast, Transport), also assert that rule's description equals the common rules 9 text. If none does, skip that assertion and say so in the task notes.
5. `tts_lua_code/mod.lua` (perModelCode):
   - Add `function isQuestSystem(gameSystem) return gameSystem == 'aofq' or gameSystem == 'aofqai' or gameSystem == 'gfsq' or gameSystem == 'gfsqai' end` after `isSkirmishSystem`.
   - `rebuildName`: condition becomes `(isSkirmishSystem(gs) or isQuestSystem(gs)) and decodedMemo['originalToughValue'] ~= 0`.
   - `rebuildContext`: Shaken item when `isTraditionalSystem(gameSystem) or isQuestSystem(gameSystem)`.
   - Action panel unit column: Shaken button on the same condition.
   - Leave `usesLegacySkirmishWounds` and the global `startingHP` check alone.
6. Run `npm run build`, `npm test`, `npm run lua:check`.
6a. Hand check the notice in `npm run netlify:dev`. There's no live Quest link, so temporarily set `state.gameSystem = "gfsq"` from the console after importing any list (valtio `state` isn't on `window`; add a throwaway `window.state = state` locally and remove it). Check light and dark mode, the link target, and one non-English locale. Then import a GF list and confirm the notice is gone.
7. Hand test in TTS: build a save-list payload for a `gfsq` list (save-list locally via `netlify dev` cannot reach the mod, so use a deployed preview or patch `gameSystem` in an existing saved list), assign a model, and check name, context menu and action panel per R7 to R9.
8. After release, comment on issue #72 asking the reporter to retry their link and to post further problems on #74.

## Acceptance criteria

1. A list with `gameSystem: "gfsq"` imports with no alert, and the only common rules request is `get-army?commonRulesId=9`.
2. `aofq`, `aofqai` and `gfsqai` request common rules 7, 8 and 10.
3. A list with `gameSystem: "zzz"` still shows "This list uses a game system the app doesn't support yet (zzz)." and makes no common rules request.
4. In TTS, a model assigned from a `gfsq` list shows "Tough: N" in its name, "Shaken" in its context menu and action panel, no "Stunned", and starts with HP equal to its Tough.
5. After a Quest list imports, an amber notice above Inline Options reads "Quest and Star Quest lists are experimental and may not work 100%. Please report any problems on this GitHub issue.", and the link opens issue #74 in a new tab.
6. The notice is translated in de, es, fr and it, and is readable in dark mode.
7. Importing a GF, GFF, AoF, AoFS or AoFR list shows no notice, including straight after a Quest list.
8. `npm run build`, `npm test` and `npm run lua:check` pass.

---
*Ready for implementation: `/task 07-quest-support`*
