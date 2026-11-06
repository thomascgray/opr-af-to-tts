# 06-v36-followups: Skirmish Tough HP in the mod, and dead short-description code

**Source**: deferred from `SPECS/05-refactor-1.md` (bugs B2 and B4), 2026-11-06. Steam workshop comment, 2026-10-30. User decisions in session, 2026-11-06.

## What and why

OPR v3.6 gives every Firefight and Skirmish model its own Tough value and drops the skirmish wound roll. The TTS mod still adds 5 HP to every skirmish model, so new lists start with too many wounds. This spec makes the app stamp each saved list with the rules version it was built from, and makes the mod drop the `+ 5` only for lists that carry that stamp. Lists saved before this change keep their current behaviour, because many users have them saved and the saved JSON has pre-3.6 Tough values.

It also deletes the `useShorterVersionOfCoreSpecialRules` code path, which has no UI and no data behind it since 3.6.

## Requirements from the source

User decisions, verbatim (2026-11-06):

> 1. nah, lets do mod versions. we have too many users to play fast and loose with breaking old lists
> 2. yep, again, take into account a mod version tho
> 3. yep, i'll test the lua myself before publishing the new version on steam
> 4. yep, delete dead code

Steam workshop comment, verbatim (MisterAssassin, 30 Oct):

> Hey Tombola, with the 3.6 edition out, the wound roll for skirmish is gone and the 5 extra HP that the interface adds are now redundant. Would you be willing to change that?

## Findings

### B2: skirmish models get Tough + 5 HP (mod)

- 3.6 "Triplification" gives every Firefight/Skirmish model a Tough value. The Firefight Tough rule reads "Once a model has taken as many wounds as its Tough value, it is killed".
- Every skirmish special case for Tough in `tts_lua_code/mod.lua`:
  - `:1006`–`:1011` starting HP when a model is assigned: `+ 5` when `gameSystemToAssign` is `aofs` or `gff`.
  - `:721`–`:722` HP bar max: `isSkirmishSystem(gameSystem) and (originalTough + 5)`.
  - `:173` and `:620` `hasTough` is true for any skirmish model, even with `originalToughValue == 0`. This gates the HP bar and the HP +/- buttons.
  - `:532` `rebuildName` appends `Tough: N` to skirmish names when Tough is non-zero. Correct for both versions, no change.
- Example (fixture `src/__fixtures__/tts-4IycTvl_idGU.json`, gff): Battle Brother `Tough(3)` gets 8 HP, Master Destroyer `Tough(18)` gets 23. Under 3.6 they should get 3 and 18.
- The Steam comment confirms B2 on the skirmish side.
- Version data: `/api/tts` carries no rules version (top-level keys: `id, name, isCloud, forceOrg, modified, gameSystem, modelCount, simpleMode, description, pointsLimit, campaignMode, cloudModified, narrativeMode, activationCount, includeVehicles, removeOvercosted, listPoints, units, specialRules, forceOrgErrors`). Army Forge serves only 3.6 data since 29 Oct 2026, so the app writes the version as a constant.
- `save-list.ts` stores `list_json` as an opaque string, so a new field needs no backend change.
- Already-placed models: HP state lives in each model's `memo`, and `:722` reads it there. The version has to go into the memo too, or the HP bar on a reloaded table can't tell old from new. The mod already handles missing memo fields from older versions with `nil` defaults (`CLAUDE/mod-context.md`, "Pre-upgrade models").

### B4: short rule descriptions (dead code)

- In 3.6 neither `/api/rules/common/<n>` nor the list's `specialRules` carry `shortDescription`.
- No toggle exists in the UI. `OutputOptions.tsx` never renders `useShorterVersionOfCoreSpecialRules`, and no locale has a label for it. It is set `false` in `src/state.ts:13` and read in `src/tts-output/generate-unit-output.ts:64`. Every fixture's flipped-toggle snapshot is `"[same as default config]"`.

## Requirements

### App
1. `iTotalShareableOutput` (`src/types.ts`) gets `rulesVersion: string`.
2. `onGenerateShareableId` (`src/utils.tsx`) sets `rulesVersion` to the exported constant `CURRENT_RULES_VERSION = "3.6"`. Every newly saved list carries it.
3. Delete `useShorterVersionOfCoreSpecialRules` from `iAppState.ttsOutputConfig` in `src/types.ts`, from the initial config in `src/state.ts`, and the `shortDescription` branch in `src/tts-output/generate-unit-output.ts`. Delete `shortDescription` from the types in `src/types.ts:87` and `src/army-forge-types.ts:39` if nothing else reads it.
4. A localStorage config that still has `useShorterVersionOfCoreSpecialRules` loads without error (extra keys are ignored).
5. Remove the `useShorterVersionOfCoreSpecialRules flipped` case from the toggle snapshot test, and delete its six obsolete snapshot entries. No other snapshot changes.

### Mod (`tts_lua_code/mod.lua`)
6. `handleResponse` reads `data['listJson']['rulesVersion']` into a new module global `rulesVersionToAssign` (nil when absent). It resets alongside the other `*ToAssign` globals.
7. The model memo written at assignment (`:1013` onward) includes `rulesVersion = rulesVersionToAssign`. A nil value leaves the key out of the memo, which reads back as nil. That is intended.
8. One helper in `perModelCode`, and the same logic at the assignment site: a model uses legacy skirmish wounds when `isSkirmishSystem(gameSystem)` and `rulesVersion == nil`.
9. Starting HP (`:1006`–`:1011`): `originalTough + 5` for legacy skirmish, `originalTough` otherwise.
10. HP bar max (`:722`): `originalTough + 5` for legacy skirmish, `originalTough` otherwise.
11. `hasTough` (`:173`, `:620`): `originalToughValue ~= 0`, or legacy skirmish. A versioned skirmish model with Tough 0 shows no HP bar and no HP +/- buttons, same as a traditional model.
12. Traditional systems (`gf`, `aof`, `aofr`) behave the same whatever `rulesVersion` says.
13. The mod treats any non-nil `rulesVersion` as 3.6 or later. It does not parse or compare the string. A later rules change that needs version comparison is a future spec.
14. Update the comments at `:721` and `:1006`, and `CLAUDE/mod-context.md` (memo shape near line 77, the skirmish section near lines 105–109, the action table at lines 196–197, line 291) to describe both cases.

### Compatibility matrix

| List saved | Mod | Skirmish HP |
| - | - | - |
| Before this change (no `rulesVersion`) | new | Tough + 5 (unchanged) |
| After this change | new | Tough |
| After this change | old (table saved with the old mod object) | Tough + 5. The old mod ignores the field. User updates the mod to fix. |
| Before this change | old | Tough + 5 (unchanged) |
| Models already on a table, reloaded with new mod | new | Unchanged: their memo has no `rulesVersion` |

## Out of scope

- Version comparison or any rules version other than "3.6".
- Re-saving or migrating lists already in Turso.
- Lua tests. The user tests the mod by hand in TTS before publishing to Steam.
- The second Steam comment (da bewmstick, 24 May, pasting the link in TTS). Unrelated to 3.6; not investigated here.

## Technical notes

- Repo: `C:\Programming\opr-af-to-tts`, single repo.
- `iTotalShareableOutput` today (`src/types.ts:10`):
  ```ts
  export interface iTotalShareableOutput {
    gameSystem: ArmyForgeTypes.eGameSystemInitials;
    listName: string;
    units: { name: string; modelDefinitions: iUnitProfileModelTTSOutput[]; unitId: string; selectionId: string }[];
  }
  ```
- Mod globals live at `mod.lua:3`–`:19`. `originalToughValueToAssign` resets at `:902`. `gameSystemToAssign` is set at `:1129` in `handleResponse`.
- `isSkirmishSystem` / `isTraditionalSystem` are defined inside `perModelCode` (`:83`–`:88`). The assignment site at `:1009` uses an inline comparison instead; keep that pattern there.
- Read `CLAUDE/mod-context.md` and `CLAUDE/tts-lua-api-learnings.md` before editing `mod.lua`.
- Local check of the saved JSON: `npm run netlify:dev`, generate F3 (`https://army-forge.onepagerules.com/share?id=4IycTvl_idGU&name=Battle_Brothers`), save, and open the `localhost:8888/.netlify/functions/save-list?listId=…` URL. `listJson.rulesVersion` should be `"3.6"`.

## Open questions

None.

## Implementation guide

All paths relative to `C:\Programming\opr-af-to-tts`.

### App
1. `src/types.ts`: add `rulesVersion: string` to `iTotalShareableOutput`. Remove `useShorterVersionOfCoreSpecialRules` from the config type.
2. Add `export const CURRENT_RULES_VERSION = "3.6";` next to `onGenerateShareableId` (or in `src/types.ts` if a constants spot exists there), and set it in the `totalOutput` literal in `onGenerateShareableId`.
3. `src/state.ts`: remove `useShorterVersionOfCoreSpecialRules: false`.
4. `src/tts-output/generate-unit-output.ts:64`: remove the `shortDescription` branch so the function returns the full description path directly. Grep for `shortDescription`; delete the type fields if nothing else reads them.
5. `src/utils.test.ts`: drop the flipped case for that toggle. Run `npx vitest run -u` and check in `git diff` that the only snapshot change is the six removed `useShorterVersionOfCoreSpecialRules flipped` entries.
6. Add a test for `onGenerateShareableId` with stubbed `fetch` that asserts the POSTed `list_json` has `rulesVersion: "3.6"`.
7. `npm run build` and `npm test` pass.

### Mod
1. Add `local rulesVersionToAssign = nil;` with the other globals. Set it in `handleResponse` next to `gameSystemToAssign`.
2. In `perModelCode`, add `usesLegacySkirmishWounds(decodedMemo)` beside `isSkirmishSystem`: `isSkirmishSystem(decodedMemo['gameSystem']) and decodedMemo['rulesVersion'] == nil`.
3. `:173` and `:620`: `hasTough = decodedMemo['originalToughValue'] ~= 0 or usesLegacySkirmishWounds(decodedMemo)`.
4. `:722`: `maxWounds = usesLegacySkirmishWounds(decodedMemo) and (originalTough + 5) or originalTough`. Check what variable holds the memo in that scope.
5. `:1009`: add `and rulesVersionToAssign == nil` to the `+ 5` condition. Add `rulesVersion = rulesVersionToAssign` to the memo literal.
6. Update the comments and `CLAUDE/mod-context.md` (R14).
7. Hand test in TTS (user):
   - Load F3 saved with the new app: Battle Brother 3 HP, Master Destroyer 18 HP, bar max matches.
   - Load a gff list saved before this change: HP is still Tough + 5.
   - Reload a table with models assigned by the old mod: HP bars unchanged.
   - Load a gf list: HP equals Tough, no change.

## Acceptance criteria

1. A newly saved list's JSON has `"rulesVersion": "3.6"`.
2. With the new mod, a skirmish list saved after this change gives each model HP equal to its Tough, and the HP bar max equals Tough.
3. With the new mod, a skirmish list saved before this change still gives Tough + 5.
4. Models already on a table keep their HP and HP bar max after the mod updates.
5. Traditional-system HP is unchanged in every case.
6. `useShorterVersionOfCoreSpecialRules` and the `shortDescription` branch no longer exist in `src/`, and an old localStorage config still loads.
7. `npm run build` and `npm test` pass, and the only snapshot change is the removal of the six flipped-toggle entries.

---
*Ready for implementation: `/task 06-v36-followups`*
