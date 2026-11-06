# 05-refactor-1: Test and untangle the import flow, and triage the v3.6 bugs

**Source**: user brief in session (2026-11-05), plus a Discord exchange screenshot (30/10/2026)

## What and why

The import flow (paste Army Forge link, Generate, fetch, map to `iUnitProfile[]`, render BBCode) lives mostly in `src/utils.tsx` and has grown by accretion. Nobody can change it with confidence because no tests exist. This spec adds a test harness, pins the current behaviour with fixture-driven tests, then restructures the flow without changing its output. It also records what OPR v3.6 changed and which user-reported bugs that explains, so they can be fixed against a safety net.

## Requirements from the source

User brief, verbatim:

> - identify areas of the main flow (user inputs an army link, hits generate, we fetch it, parse it, turn it into local data) that can be improved, because right now i think its pretty mental
> - write tests to verify existing functions: the entire point of this spec is NOT to add or amend features, we're making the code easier to work with going forwards
> - i'm now out of the loop with whats going on In the world of one-page rules, however, still want to make sure this app works as best as possible. I've seen a bunch of people on the Discord saying that the app never works when there's a new beta out and that there is that actually does seem to be a new Vada right now - 3.6? Can we find out anything about that? Is it maybe a number we can append to one of the URLs to get different stats or something
> - See this exchange from the Discord between a couple of users: [screenshot] Where there obviously is a bunch of bugs, we should try and look into these

Discord exchange (screenshot), verbatim:

> ToadBrews: Has the Tombola's app updated for 3.6 already
> Steven: When I tried it during the Beta recently it had not. And I haven't seem Tombola posting, so my guess is no.
> ToadBrews: It never works during betas / So that's expected
> Steven: I just did a little testing and it was working fine for the units I tried. I didn't try too many different things, though.
> ToadBrews: lemme make an army with several new rules and see what happens, I'll report back in a bit / Assault, scourge, and spell amplifier are all correct and it has the new 9 inch scout distance so I think we should be good barring one-off bugs
> Steven: Hmm, it did for me. The toughness of the units was messed up, though.
> ToadBrews: actually let me see if they fixed the bug that made it impossible to have a caster 5 frog mage / nope that's still bugged

## Findings

### OPR v3.6 and the beta

- v3.6 went live on **29 Oct 2026** after three beta rounds (closed beta, closed beta #2, open beta that ran to 27 Sep). Source: https://www.onepagerules.com/news/v3-6-is-now-available. The Discord exchange is the day after release, so those users are on the **live** site, not the beta.
- No version number goes in a URL. `army-forge.onepagerules.com/api/tts?id=…` and `/api/rules/common/<n>` already serve 3.6 data (army books report `versionString: "3.6.0"`, Scout text says 9"). The app picks up new rules text with no code change. Rules text is not the problem.
- `army-forge-beta.onepagerules.com` currently returns HTTP 503 with an HTML "This service has been suspended by its owner." page. `get-army` calls `got(...).json()`, which throws, so beta users see "Army Forge failed to export list. Sorry!". The beta host goes up and down between beta rounds, which is one reason "it never works during betas".
- 3.6 changed data shapes the code depends on (checked against live `/api/tts` and `/api/rules/common/2` on 2026-11-05):
  - Unit rules no longer have a `key` field: `{"id":"a0YtInGiUDd6","name":"Tough","rating":6,"label":"Tough(6)"}`. `ISpecialRule.key` is typed as required.
  - `rating` is a number (`6`), typed as `string`.
  - Neither common rules nor army `specialRules` carry `shortDescription` (0 of 29 army rules on the sample list). The `useShorterVersionOfCoreSpecialRules` toggle has no effect.
  - Common rules no longer return `hasRating` (keys: `id, name, description, enabledGameSystems, coreType, displayCoreRuleForSystem`). `ICommonRule.hasRating` is typed as required.
  - Army books now list game system ids 7, 8, 9 and 10 (`enabledGameSystems: [4,5,6,7,8]`, `[2,3,9,10]`). The app maps only gf/gff/aof/aofs/aofr. A list in any other system sends `commonRulesId=undefined`. The query string is the truthy string `"undefined"`, so the function returns 500 "Failed to fetch common rules".

### Where the Army Forge types come from

There is no published schema for `/api/tts`, `/api/rules/common/<n>` or `/api/army-books`. Searched GitHub and the web on 2026-11-05:
- `src/army-forge-types.ts` was written by hand in April 2023 (commit `2565340`) and last touched in October 2024. It describes pre-3.6 data.
- Adam Lay (Army Forge's author) has a consumer-side type file in [AdamLay/opr-skirmish-custom `src/services/interfaces.ts`](https://github.com/AdamLay/opr-skirmish-custom/blob/main/src/services/interfaces.ts). It was last changed Feb 2025 and is 60 lines long, with `rating?: any`. It confirms that loadout entries carry `content: LoadoutEntry[]` and that `type` is `"ArmyBookWeapon" | "ArmyBookItem" | "ArmyBookRule"`. It predates 3.6 and adds nothing the live data doesn't show.
- [ydirson/opr-rs](https://github.com/ydirson/opr-rs) (Rust, updated Sep 2026) parses `rating` as "number or numeric string". That supports typing it `string | number`.
- [Majawat/battlesync `docs/opr-api-reference.md`](https://github.com/Majawat/battlesync/blob/main/docs/opr-api-reference.md) lists game system ids 7 to 10: AoF Quest, AoF Quest AI, GF Star Quest and GF Star Quest AI.
- [jokfang/Johammer.github.io](https://github.com/jokfang/Johammer.github.io) is a French fork of this app that reuses our `army-forge-types.ts`, so it isn't an independent source.

Conclusion: the live responses are the only reliable source. The fixtures saved in Phase 1 are the reference for R17.

### The Discord bugs, traced

- **B1: "impossible to have a caster 5 frog mage" (app, confirmed by reading code against live army book data).** The Saurians (AoF) Frog-Mage is `Caster(3)`. Two upgrades each grant `Caster(1)`: "Ancient Palanquin" and "Enlightened Mage" (both `ArmyBookItem`, `content: [{name: "Caster", rating: 1}]`, no `key`). In `generateUnitOutput` (`src/utils.tsx:503`), `_.uniqBy(..., x => x.key || x.name)` collapses rules from different items that share a name. One `Caster(1)` survives and joins the unit's `Caster(3)`, so the output shows Caster 4 and `originalCasterValue` is 4. The same collapse hits any rule two items grant (Tough, Fear, …).
- **B2: "The toughness of the units was messed up" (mod, probable).** In 3.6 the skirmish games went through "Triplification": every Firefight/Skirmish model now has a Tough value (Firefight Saurian Warrior is `Tough(3)`, Frog-Mage `Tough(18)`), and the Firefight Tough rule now reads "Once a model has taken as many wounds as its Tough value, it is killed". `tts_lua_code/mod.lua:1010` and `:722` still give skirmish models `Tough + 5` HP, so a basic Firefight model gets 8 HP instead of 3. Steven didn't name a game system, so this is the likeliest match, not a confirmed one.
- **B3: Hero detection broken (app, confirmed).** `isUnitHero` (`src/utils.tsx:971`) checks `sr.key === "hero"`. 3.6 rules have no `key`, so it always returns false. Joined heroes read "combined with" instead of "joined to" in the saved unit name and in the App.tsx label at line 231.
- **B4: Short rule descriptions gone (upstream data).** See the `shortDescription` finding above. The toggle silently does nothing.
- **B5: Beta host down (upstream).** See above. The app can't fix that, but it can report it accurately.

### Problems in the main flow (refactor targets)

`src/utils.tsx`:
- `extractIdFromUrl` (`:65`) returns `(string | boolean | null)[]`, so `id` and `isBeta` lose their types at the call site.
- `generateLoadoutItemDefinition` (`:72`) repeats the same Weapon, Rule and Defense branch three times.
- `onGenerateDefinitions` (`:142`) does everything in one function: URL parsing, two fetches, `alert()` calls, game-system-to-common-rules-id mapping through an intermediate slug (`getUrlSlugForGameSystem`, used nowhere else), state writes, and the mapping to `iUnitProfile`. It sets `SUCCESS` before mapping runs, and the mapping sits outside the `try`, so a mapping exception leaves the UI stuck on "success" with no units. It clears `state.unitProfiles` before validating the URL. It runs a dead `data.error` check after the success path.
- The selected-upgrades merge (`:299`–`:334`) builds a fake `originalLoadout: { content }` object with `@ts-ignore`.
- `generateUnitOutput` (`:429`) resolves rule definitions twice with different lookup logic: the loadout path matches on key then name, case-insensitive, and the unit path matches exact name only. It builds `fallbackDefinitionData` as a side effect inside a `.map`, mutates `sr.rating = parseInt(...)` on objects it just created, computes `isCoreSpecialRule` before its `w === null` check, and types everything as `any`. `modelSpecialRules` (the name-line list) comes from a third, separate derivation. `totalExtraDefense` is always 0. `TTS_TOUGH_COLOUR` is computed and never used.
- `getUnitNameForSavedShareableOutput` (`:916`–`:921`) has a dead expression block. `parseString` has a duplicate `return`.
- `onGenerateShareableId` builds the share URL from `window.location.href`, which breaks if the page has a path or query string.

`src/types.ts` / `src/army-forge-types.ts`:
- `iUnitProfileModel.originalSpecialRules` is `any[]`. `ListState` lacks `specialRules`, which causes an `@ts-ignore`. `IUpgradeGains` lacks `content`, which causes about six `@ts-ignore`s.
- `armySpecialRulesDictNames` and `includeToughSpecialRuleRatingInName` are declared and initialised but never read.

`netlify/functions/get-army/get-army.ts`:
- Interpolates `armyId` into the upstream URL unencoded. Treats every upstream failure (503, non-JSON, 404) as the same 500 message.

## Requirements

### Phase 1: test harness (no app behaviour change)
1. `package.json` has a `"test": "vitest run"` script. `npm test` exits 0.
2. Tests live next to their source as `*.test.ts` (for example `src/utils.test.ts`). Fixtures live in `src/__fixtures__/`.
3. Fixtures are raw Army Forge responses saved verbatim: `/api/tts?id=eozLqVsXDZCi` (Battle Brothers, gf), `/api/tts?id=JNKuWOyvWSxi` (gf), `/api/tts?id=D4P2sovK` (Alien Hives, gf), `/api/rules/common/2`, plus the lists from open question 2.
4. Tests import from source modules only. They make no network calls (stub `fetch` where a function fetches).
5. Snapshot tests cover `generateUnitOutput` for every model in every fixture with `initialTtsOutputConfig`, plus one run per boolean toggle in `ttsOutputConfig` flipped from its default. Skip `includeToughSpecialRuleRatingInName`: nothing reads it and R18 deletes it, so a snapshot for it would vanish in Phase 2 and break R9.
6. Unit tests cover: `extractIdFromUrl` (live link, beta link, link with `&name=`, no `id`), `removeQuantityStringFromStartOfString`, `generateLoadoutItemDefinition` (each `type`, item with null `label`), `getModelNameForOutput` (all four branches), `getUnitNameForSavedShareableOutput` (plain, custom name, joined), `insertLineBreaksIntoString`, `getCampaignTraitCategory`, `generateOriginalLoadoutCsvHelperString`, and the `state.ts` mutators.
7. A test covers `onGenerateDefinitions` end to end with a stubbed `fetch`: the fixture in, `state.unitProfiles` out (snapshot with nanoid ids masked), plus the error paths (no id, upstream error JSON, non-200). Snapshots take `unitProfiles`, `armySpecialRulesDict`, `coreSpecialRulesDict`, `campaignTraitsDict`, `listName` and `gameSystem` only, never the whole `state` or `ttsOutputConfig`, because R18 removes `armySpecialRulesDictNames` and a config key.
8. Tests for B1 and B3 assert the **current, wrong** output and carry a `// BUG B1` / `// BUG B3` comment. Phase 3 flips them.
8a. `npm run fixtures:refresh` runs `scripts/refresh-fixtures.mjs` (plain Node 18+, built-in `fetch`, no new dependencies). It re-downloads every `tts-<id>.json` and `common-rules-<n>.json` in `src/__fixtures__/`, taking the ids from the existing file names, and writes each response verbatim, pretty-printed with 2-space indent. It skips `*.synthetic.json`. It logs one line per file, and a failed download logs the HTTP status, leaves the old file in place and exits 1. The script is the only way fixtures get written. Phase 1 step 2 runs it after creating empty placeholder files, or seeds the files with the same curl calls.
8b. `src/__fixtures__/army-forge-contract.test.ts` checks every non-synthetic fixture against the shapes the code reads, as runtime assertions with plain `expect`, not snapshots. List: `gameSystem` is a string; `units` and `specialRules` are arrays; each unit has string `name`, `selectionId`, `id`, numeric `size`, `quality`, `defense`, `xp`, a `joinToUnit` that is a string or null, a boolean `combined`, a `customName` that is absent or a string, and `traits` that is absent or an array of strings. Each unit rule and each rule inside a loadout entry's `specialRules` or `content` has a string `name` and an optional `key`, and its `rating` is absent, null, a number or a numeric string. Each loadout entry has a `type` in `ArmyBookWeapon | ArmyBookItem | ArmyBookRule | ArmyBookDefense`, a string `name`, a numeric `count`, and an optional `content` array. Each selected upgrade has `option.gains` as an array. Common rules: `rules` and `traits` are arrays; each trait has a string `name` and a `type` of 0, 1, 2 or 3. A failure message names the fixture file and the JSON path, for example `tts-rzS5YWEN4vHF.json units[4].loadout[1].content[0].rating`.

### Phase 2: refactor (snapshots unchanged)
9. Every Phase 1 snapshot passes unchanged after the refactor. Any snapshot diff means a behaviour change and gets reverted or moved to Phase 3.
10. `npm run build` passes.
11. Split `src/utils.tsx` by responsibility (see Implementation guide for the file layout). Keep every currently exported name importable from `src/utils.tsx` through re-exports, so `App.tsx` and components need no change beyond imports.
12. Separate fetching from mapping: a pure `mapArmyForgeListToUnitProfiles(list, commonRules)` returns `{ unitProfiles, armySpecialRulesDict, coreSpecialRulesDict, campaignTraitsDict, listName, gameSystem }`. `onGenerateDefinitions` only fetches, calls the mapper, writes state, and sets network state.
13. Map game system to common rules id directly (`gf: 2, gff: 3, aof: 4, aofs: 5, aofr: 6`). Delete `getUrlSlugForGameSystem` if nothing else uses it.
14. `extractIdFromUrl` returns `{ id: string | null; isBeta: boolean }`.
15. Collapse the three identical branches of `generateLoadoutItemDefinition` into one.
16. In `generateUnitOutput`, extract one rule-definition resolver used by both the loadout path and the unit path. Each call site keeps its current matching behaviour, passed as a parameter, until Phase 3 decides otherwise. Remove the in-place `rating` mutation and the side effect inside `.map`.
17. Add `content?: IUpgradeGains[]` to `IUpgradeGains` and `specialRules` to `ListState`, make `ISpecialRule.key` optional, and type `rating` as `string | number`. Remove the `@ts-ignore`s these make unnecessary.
17a. Rewrite `ListState`, `ISelectedUnit`, `IUpgradeGains*`, `ISpecialRule`, `ICommonRule` and `ICommonRuleTrait` in `src/army-forge-types.ts` so every field the R8b contract test checks has the same type (optional where the test allows absent, `| null` where it allows null). Fields the code never reads can stay as they are. R17 is the minimum; R17a is the full pass.
18. Delete dead code: `armySpecialRulesDictNames` and `includeToughSpecialRuleRatingInName` (type, initial state, and any reference in `OutputOptions.tsx`), the dead block in `getUnitNameForSavedShareableOutput`, the duplicate `return` in `parseString`, the dead `data.error` check, `totalExtraDefense`, the unused `TTS_TOUGH_COLOUR`. Old localStorage configs that still carry `includeToughSpecialRuleRatingInName` must load without error (extra keys are ignored).
19. Keep the dated history comments in `generateUnitOutput` and the selected-upgrades merge, moving them with the code.

### Phase 3: bug fixes and error messages (behaviour changes, each test-first)
Each item starts by flipping or adding a test that fails, then changes code until it passes. Snapshot diffs in this phase are expected and must be limited to the models the fix touches.

20. B1: rules granted by different loadout items with the same name all count toward the rating total. The same rule reached twice through one item (the item's `content` and the content's `specialRules`) still counts once. A Frog-Mage with Ancient Palanquin and Enlightened Mage outputs `Caster (5)`, `Tough (9)`, `originalCasterValue: 5`, `originalToughValue: 9`.
21. B3: `isUnitHero` returns true when any rule has `name === "Hero"` or `key === "hero"`. A joined hero's saved name reads `(joined to …)`, and the App.tsx label at line 231 shows the "joined to" text.
22. Unknown game system: when the list's `gameSystem` has no entry in the common rules id map, `onGenerateDefinitions` makes no common rules request, sets network state to `ERROR`, and alerts `i18n.t("errors.unsupportedGameSystem", { gameSystem })`. English text: `This list uses a game system the app doesn't support yet ({{gameSystem}}).`
23. Upstream unavailable: when Army Forge answers 502, 503 or 504, or a non-JSON body, `get-army` returns status `502` (a plain 500 stays on the old path: Army Forge answers 500 for an unknown list id, decided 2026-11-06) with `{ "error": "<same English text as below>", "code": "UPSTREAM_UNAVAILABLE" }`. Other failures keep today's 500 and messages. The client checks `code === "UPSTREAM_UNAVAILABLE"` before falling back to `data.error`, and alerts:
    - beta link: `i18n.t("errors.armyForgeBetaUnavailable")`, English `The Army Forge beta site isn't responding. Beta lists can't be imported until it's back.`
    - live link: `i18n.t("errors.armyForgeUnavailable")`, English `Army Forge isn't responding right now. Try again in a few minutes.`
24. The three new keys go under `errors:` in all five locale files (`en`, `de`, `es`, `fr`, `it`), translated.
25. `get-army` URL-encodes `armyId` and `commonRulesId` with `encodeURIComponent`.

### Deferred to a later spec
- B2 (skirmish `Tough + 5` HP in `mod.lua`). Record only.
- B4 (`shortDescription` missing upstream). The toggle stays as is.

## Out of scope

- New features and UI changes.
- Tests for `tts_lua_code/mod.lua` (no Lua test runner in the repo).
- Support for game systems 7–10 beyond a clear error (R22).
- B2 and B4 fixes.
- Changes to `save-list.ts` beyond what the tests need.
- Component tests for `App.tsx` / `OutputOptions.tsx`.

## Technical notes

- Repo: `C:\Programming\opr-af-to-tts` (single repo, session starts in it).
- Test runner: `vitest@0.30.1` is installed with Vite 4. Vitest reads `vite.config.ts`, so it inherits the YAML plugin that `src/i18n/index.ts` needs. Use the default `node` environment. `src/utils.tsx` imports React for JSX in `getUnitNameForLegend`; that is fine under vitest. `onGenerateDefinitions` calls `alert` and `i18n.t`, so stub `globalThis.alert` with `vi.fn()`.
- Make snapshots deterministic with `vi.mock("nanoid", () => ({ nanoid: () => "id" }))` or a counter.
- Types to know: `iAppState`, `iUnitProfile`, `iUnitProfileModel`, `iUnitProfileModelTTSOutput`, `iTotalShareableOutput` in `src/types.ts`; `ListState`, `ISelectedUnit`, `IUpgradeGains`, `ISpecialRule`, `ICommonRule`, `ICommonRuleTrait`, `eGameSystemInitials` in `src/army-forge-types.ts`.
- Live 3.6 unit rule shape: `{ id: string; name: string; rating?: number; label: string }`.
- Live 3.6 item shape (Frog-Mage upgrade): `{ name, type: "ArmyBookItem", content: [{ id, name: "Caster", type: "ArmyBookRule", rating: 1 }], label, count }`, with no `id` and no `key` on the item.
- `mod.lua` consumes `originalToughValue` / `originalCasterValue` from the saved JSON (`mod.lua:968`). Phase 2 must not change those values.
- Saurians army book: AoF uid `BubhE1kUpgYbqZvW` (Frog-Mage upgrades `A1`, `GvaZUqcA`), GF Starhosts `U6hwlur14RpnInZr`.

## Fixture lists to build

The user builds these in Army Forge (live site, v3.6), shares them, and pastes the share links into this section. Each one exercises a code path the three historical lists don't reach.

What the three historical lists cover (checked against live `/api/tts` on 2026-11-05): all gf, campaign mode off, standalone heroes, multi-model units, weapon-swap upgrades (`ArmyBookWeapon`) only. None has a combined unit, a joined hero, a custom name, XP, traits, or a rule/item upgrade. D4P2sovK has two separate Assault Grunts units, but `combined` is false on both.

| # | System and army | What to build | Code path it covers |
| - | - | - | - |
| F1 | Age of Fantasy, Saurians | Frog-Mage with **Ancient Palanquin** (first "Upgrade with one" section) **and Enlightened Mage** (second section), plus a weapon swap from "Replace Great Magic Pulse". | B1 stacking (expect Caster 5, Tough 9), items with `content`, an item weapon with no `quantity` (Palanquin's Magic Pulse, which hits the `fallbackDefinitionData` path), aof common rules (id 4) |
| F2 | Any GF army, **campaign mode on** | (a) Two copies of the same multi-model unit **combined**. (b) A Tough(6)-or-lower hero (no Tough-raising upgrade) **joined** to a unit. (c) One unit with a **custom name**. (d) A unit that takes an upgrade that is a single special rule (for example a banner or drones). (e) One unit with XP above 0 and traits, ideally one each of Skill Set, Trait, Injury, Talent. Leave the other units at 0 XP. | B3 "joined to", "combined with", custom-name branches in `getModelNameForOutput`, selected-upgrades merge, `generateOriginalLoadoutCsvHelperString` rule chunk, campaign traits mapping and output |
| F3 | Grimdark Future Firefight (any army) | Three or four models including a hero. | gff common rules (id 3), evidence for B2 |

F2 used to be two lists (F2 and F4). They merged because campaign mode only changes output for units with `xp > 0` or traits, so one list covers both without the campaign block leaking into the other units' snapshots. Skirmish and Regiments AoF (ids 5, 6) stay uncovered: they reach the same code as aof with a different id, and R13's map test covers the id.

Links:
- F1: https://army-forge.onepagerules.com/share?id=xAhPsZKN9hXd&name=Saurians (aof, 2 units). Checked against `/api/tts` on 2026-11-05: the Frog-Mage has `Caster(3)`, `Tough(6)`, and loadout items "Ancient Palanquin" `[Magic Pulse, Caster(1), Tough(3)]` and "Enlightened Mage" `[Caster(1)]`. Neither item nor its content rules has a `key`, and both Caster entries carry the same `id` `47CAqf7ySlfc`, which confirms the B1 collapse. The second unit is Saurian Warriors (10, `Hand Weapon`).
  - **The Frog-Mage can't be joined to a unit** (user, 2026-11-05). The 3.6 AoF Hero rule only lets heroes "with up to Tough(6)" deploy as part of a unit, and the Palanquin takes it to Tough(9). So F1 can't cover B3. A joined hero comes from F2 instead.
- F2: https://army-forge.onepagerules.com/share?id=rzS5YWEN4vHF&name=Battle_Brothers (gf, Battle Brothers book `78qp9l5alslt6yj8`, 7 units, `campaignMode: true`). Checked against `/api/tts` on 2026-11-05, and re-checked after the user edited the list (the share id stayed the same):
  - (a) combined: two Battle Brothers [5], `selectionId` `i6EqE` and `1ExGD`. Both have `combined: true`, and `1ExGD` has `joinToUnit: "i6EqE"`.
  - (b) joined hero: Master Destroyer (`_bRm3`, `Tough(6)`, `combined: false`, `joinToUnit: "iq-qg"`) joined to Assault Brothers [5]. Its Hero rule is `{"id":"T08VkBuVmNZ_","name":"Hero","label":"Hero"}` with no `key`, so B3 reproduces: today the saved name reads "combined with".
  - (c) custom name: Assault Brothers (`iq-qg`) has `customName: "This is a custom name for some assault brothers"`. The Master Destroyer is joined to this unit, so the joined-name path runs with a custom name on the target.
  - (d) upgrade: Veteran Assault Brothers [3] took "Jetpack (Flying)". The gain is an `ArmyBookItem` with `content: [Flying]`. The loadout also has a "Combat Shield" item with `content: [Armor(2)]` (rating 2). This covers items with `content` reached through an upgrade.
  - (d) does **not** reach the push branch of the selected-upgrades merge (`src/utils.tsx:311`). That branch only adds a gain whose id/key/name isn't already in the loadout. In 3.6, the Battle Brothers book has only `ArmyBookWeapon` (288) and `ArmyBookItem` (55) gains, with no bare `ArmyBookRule` gain. Banners such as "Medical Training" are items too, and every item gain shows up in `loadout` under the same name, so the branch skips it. No live 3.6 list can reach the branch. Cover it with a unit test that passes a hand-built gain (`type: "ArmyBookRule"`, a name not in the loadout).
  - (e) campaign: two units. Traits arrive as plain name strings, and every one resolves in `/api/rules/common/2`.
    - Pathfinder Snipers [3] (`o5mHF`), `xp: 10`: Fast Learner, Resilient, Elite, Headstrong, Specialist, Agile. All `type: 0` (Trait).
    - Veteran Master Brother [1] (`wMRtY`, Hero, `Tough(3)`, not joined), `xp: 20`: Mastermind, Berserker, Suppressor, Explorer, Leader, Herbalist (`type: 3`, Skill Set); Fast Learner (`0`, Trait); Dead, Lucky Break (`1`, Injury); Toughened, Crazed (`2`, Talent). This covers all four categories and the campaign block's category ordering.
    - The other five units have `xp: 0` and no traits.
- F3: https://army-forge.onepagerules.com/share?id=4IycTvl_idGU&name=Battle_Brothers (gff, 4 single-model units, campaign off). Checked against `/api/tts` and `/api/rules/common/3` on 2026-11-05: Master Destroyer (Hero, `Tough(18)`), Pathfinder, Battle Brother and Pathfinder Sniper (each `Tough(3)`). `/api/rules/common/3` returns `{ rules, traits }` like id 2. B2 evidence: under `mod.lua`'s `Tough + 5` rule, the Battle Brother gets 8 HP and the Master Destroyer 23, where 3.6 Firefight rules give 3 and 18.

If a link doesn't cover a case, the implementer hand-builds that case from the army book data (Saurians AoF uid `BubhE1kUpgYbqZvW`, Battle Brothers GF `78qp9l5alslt6yj8`) and names the file `*.synthetic.json`.

## Open questions

None.

## Implementation guide

All paths are relative to `C:\Programming\opr-af-to-tts`. Run commands from the repo root. Finish and verify each phase before starting the next.

### Phase 1: harness and characterisation tests
1. `package.json`: add `"test": "vitest run"`. If vitest 0.30 fails to start under the current Node version (`.nvmrc`), bump `vitest` to the newest version that supports Vite 4 (0.34.x). Do not upgrade Vite.
2. Save fixtures with `curl -s https://army-forge.onepagerules.com/api/tts?id=<id> > src/__fixtures__/tts-<id>.json` for the three historical ids and the F1–F3 ids (`xAhPsZKN9hXd`, `rzS5YWEN4vHF`, `4IycTvl_idGU`). Save `common-rules-2.json` from `/api/rules/common/2`, and `common-rules-3.json` (F3) and `common-rules-4.json` (F1). Don't hand-edit them. Then add `scripts/refresh-fixtures.mjs` and the `"fixtures:refresh"` script (R8a), run it, and check that `git diff` shows only the pretty-printing change from the curl copies.
3. `src/test-helpers.ts`: `buildStateView(list, commonRules, configOverrides?)` runs the real `onGenerateDefinitions` against stubbed `fetch` and returns a plain snapshot of `state` (copy with `JSON.parse(JSON.stringify(state))`). Reset `state` between tests: export a `resetState()` from `state.ts` that reassigns every top-level field to its initial value (test-only use, no behaviour change).
4. Mock `nanoid` with a counter in `vitest.setup.ts` (registered in `vite.config.ts` under `test.setupFiles`), and reset the counter in `beforeEach`. Stub `globalThis.alert` there too.
5. Write `src/utils.test.ts` covering R5–R8. Generate snapshots with `npx vitest run -u` once, read them, and check a few by eye against what the app renders for the same list (`npm run netlify:dev`, paste the link). Commit-ready snapshots must match the running app.
6. Write `src/state.test.ts` for the mutators. Add a test for the selected-upgrades merge push branch with a hand-built `ArmyBookRule` gain (see the F2 notes; no live list reaches it).
7. Add the `// BUG B1` test (F1 Frog-Mage, fixture `tts-xAhPsZKN9hXd.json`: assert today's `originalCasterValue` of 4) and the `// BUG B3` test (assert `isUnitHero` returns false for the F1 Frog-Mage, a 3.6 hero; the joined-name assertion uses the F2 Master Destroyer, `selectionId` `_bRm3`, and asserts today's "combined with").
8. Write the contract test (R8b). It must pass on all the fixtures as saved. If it fails, the data disagrees with this spec's list of shapes: record the difference in the Findings section and loosen the check. Don't edit the fixture.

### Phase 2: refactor
Target layout (all under `src/`):
- `army-forge/client.ts`: `extractIdFromUrl`, `fetchArmyList(id, isBeta)`, `fetchCommonRules(gameSystem, isBeta)`, and the `COMMON_RULES_ID_BY_GAME_SYSTEM` map. Returns typed results or throws a typed error. No state, no `alert`.
- `army-forge/map-list.ts`: `mapArmyForgeListToUnitProfiles`, `generateLoadoutItemDefinition`, `generateOriginalLoadoutCsvHelperString`, `getCampaignTraitCategory`, `removeQuantityStringFromStartOfString`, and the selected-upgrades merge as a named function `mergeSelectedUpgradesIntoLoadout(unit, loadout)`.
- `tts-output/generate-unit-output.ts`: `generateUnitOutput`, split internally into `collectLoadoutRules`, `collectUnitRules`, `resolveRuleDefinition`, `sumRatings`, `buildWeaponsBlock`, `buildRulesBlock`, `buildCampaignBlock`, `buildNameLines`. Private helpers stay unexported unless a test needs them.
- `tts-output/names.ts`: `getModelNameForOutput`, `getUnitNameForSavedShareableOutput`, `getUnitIndexForSelectionId`, `isUnitHero`, `insertLineBreaksIntoString`.
- `utils.tsx`: `onGenerateDefinitions`, `onGenerateShareableId`, `getUnitNameForLegend` (JSX), plus re-exports of everything above so existing imports keep working.

Steps:
1. Fix the types first (R17), run `npm run build`, and remove each `@ts-ignore` the new types cover. Do the full R17a pass in the same step.
2. Move functions file by file. Run `npm test` after every move. Snapshots must not change.
3. Rewrite `onGenerateDefinitions` as: parse URL, return early on no id (same alert, same state), fetch list, fetch common rules, call the mapper, write state, set `SUCCESS` last. Wrap the whole thing, mapping included, in the `try`. Keep the existing alert strings and the `data.error || i18n.t(...)` precedence. This is the one intended Phase 2 behaviour change: a mapping exception now ends in `ERROR` instead of a stuck `SUCCESS`. No snapshot covers it. Add a test that forces a mapper throw and asserts `ERROR`.
4. Collapse `generateLoadoutItemDefinition` (R15) and extract the rule resolver (R16). Pass `matchMode: "keyThenName" | "exactName"` so each caller keeps its current lookup.
5. Delete the dead code (R18).
6. `npm run build` and `npm test` both pass, and the snapshot files show no diff in `git diff`.

### Phase 3: fixes
1. B1: in `collectLoadoutRules`, dedupe per loadout item instead of across all items. Build each item's rule list (its own `specialRules`, its `content` rules, and its content's `specialRules`), `uniqBy` within that item by `key || name`, then concatenate across items so `sumRatings` adds same-named rules from different items. Flip the BUG B1 test to expect 5. Update snapshots and check the diff touches only models with two items granting the same rule.
2. B3: change `isUnitHero` to `rules.some(sr => sr.name === "Hero" || sr.key === "hero")`. Flip the BUG B3 test. Expect snapshot diffs only in saved unit names of joined heroes.
3. R22: in `fetchCommonRules`, look up the id. If it's missing, throw `UnsupportedGameSystemError`. `onGenerateDefinitions` catches it and alerts the new key.
4. R23/R25: in `get-army.ts`, wrap both upstream calls in one helper. Catch `got` `HTTPError` with `response.statusCode` 502, 503 or 504 and `ParseError` (non-JSON), and return 502 with `code: "UPSTREAM_UNAVAILABLE"`. Leave other errors on the current 500 path. Encode the params. Test the helper with `got` mocked (`vi.mock("got")`).
5. R24: add the keys to `src/locales/{en,de,es,fr,it}.yaml` under `errors:`, after `fetchCommonRulesFailed`.
6. Record B2 and B4 in a new `SPECS/` stub or the user's backlog. Don't fix them.

## Acceptance criteria

1. `npm test` runs and passes with no network access.
2. `npm run build` passes.
3. After Phase 2, `git diff` shows no change to any `__snapshots__` file compared with the end of Phase 1.
4. `src/utils.tsx` contains only the two `onGenerate*` handlers, `getUnitNameForLegend`, and re-exports.
5. No `@ts-ignore` remains in the moved code whose only reason was a missing `content`, `specialRules` or `key` type.
6. A Frog-Mage with Ancient Palanquin and Enlightened Mage produces `Caster (5)` in the description and `originalCasterValue: 5` in the saved JSON.
7. A joined hero from a 3.6 list shows "joined to" in the app and in the saved unit name.
8. A list with an unmapped game system shows the `errors.unsupportedGameSystem` alert, and the network tab shows no `commonRulesId=undefined` request.
9. With the beta host returning 503, importing a beta link shows the `errors.armyForgeBetaUnavailable` alert.
10. All five locale files contain the three new error keys.
11. `npm run fixtures:refresh` re-downloads every non-synthetic fixture, and `npm test` then runs the contract test against the fresh data.

---
*Ready for implementation: `/task 05-refactor-1`*
