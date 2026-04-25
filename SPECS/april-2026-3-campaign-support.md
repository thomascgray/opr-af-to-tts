# april-2026-3-campaign-support

## Overview

Army Forge supports a "Campaign Mode" that lets users pin **Campaign Traits** onto their units (Skill Sets, Traits, Injuries, Talents). These surface in the Army Forge API response as a bare `traits: string[]` on each unit — no IDs, no categorisation, no descriptions. The rule text for each trait lives in a separate endpoint (`/api/rules/common/<gameSystemId>`) under a top-level `traits` array that does carry ids, types, skill-set groupings, and descriptions.

This spec covers:

1. Fetching the trait definitions alongside common rules and enriching each unit's string-array traits into a structured, per-model object.
2. Rendering a section in each model's TTS description output (below the existing special rules block) for each of the four trait categories (Skill Sets / Traits / Injuries / Talents).
3. Adding per-trait "include in output" checkboxes above the "Duplicate this model definition" button in the editor UI, defaulting to on.
4. Rendering the unit's campaign XP in the TTS output when `ttsOutputConfig.includeCampaignXp` is on.

The existing `includeCampaignTraits` / `includeCampaignTraitsFullText` / `includeCampaignXp` / `modelCampaignStuffOutputColour` flags in `ttsOutputConfig` are present but currently unused — this feature finally wires them all up.

Out of scope for this spec (captured as follow-ups): downstream mod.lua changes to surface campaign trait data in a TTS info panel.

## Requirements

### R1 — Fetch and store campaign trait definitions

- The common rules endpoint `get-army?commonRulesId=<n>&isBeta=<bool>` already returns both a `rules: ICommonRule[]` array and a `traits: ICommonRuleTrait[]` array. The app currently reads only `rules`.
- After the common rules fetch in `onGenerateDefinitions` ([utils.tsx:168](src/utils.tsx#L168)), persist the `traits` array into a new state field (working name: `state.campaignTraitsDict`).
- `traits` from the endpoint does not vary per army within a given game system, so a single dict per list is sufficient.

### R2 — Enrich each unit's traits into a structured per-model shape

- On list import, for each unit's bare `unit.traits: string[]`, look each name up in `state.campaignTraitsDict` and build a richer structure on each model: `model.campaignTraits: iCampaignTraitOnModel[]` (see types below).
- Each dict entry carries a `type: number` that maps deterministically to a category (see Technical Considerations) — use that to assign `iCampaignTraitOnModel.category`. Do not rely on string matching against the name.
- Fallback behaviour when a trait name isn't found in the dict: still include an entry, with a placeholder description (same pattern as `"[[Rule description missing in Army Forge data!]]"` — see [utils.tsx:549](src/utils.tsx#L549)), and `category: eCampaignTraitCategory.TRAIT` (the catch-all; regular Traits are the default bucket if we can't infer better).
- Each enriched entry defaults `includeInOutput: true`.
- Replace the existing `model.traits: string[]` field entirely. It is currently only **written** (one place, [utils.tsx:224](src/utils.tsx#L224)) and never read elsewhere, so there is no consumer that breaks.
- When a model is duplicated via `duplicateModel` ([state.ts:97](src/state.ts#L97)), `_.cloneDeep` will already carry the enriched structure across — but each duplicated trait must get a fresh nanoid `id` to keep React keys unique. Add that post-clone.

### R3 — Render campaign trait sections in the TTS model description

- In `generateUnitOutput` ([utils.tsx:397](src/utils.tsx#L397)), after `allApplicableSpecialRulesBBCode` is built and before the `descriptionFieldLines` assembly, produce a new block per category (one block each for Skill Sets, Traits, Injuries, Talents).
- Output order in the description field: weapons list → special rules list → **campaign trait blocks (Skill Sets, Traits, Injuries, Talents, in that order)** → campaign XP line (R6).
- Within a block, only include traits with `includeInOutput === true` **and** with the per-category master toggle on (see R5).
- If a block ends up empty after filtering, omit it entirely (no empty heading).
- Per-trait formatting, using `TTS_CAMPAIGN_COLOUR` (already defined at [utils.tsx:417](src/utils.tsx#L417)):
  ```
  [<campaign_colour>]Campaign Trait - <trait name>[-]
  [sup]<trait description>[/sup]
  ```
  Prefix literal is `Campaign Trait -` for all four categories — uniform, per the original ask.
- Gated by the existing `ttsOutputConfig.includeCampaignTraits` — if `false`, the entire campaign traits block is skipped (all four categories).
- When `ttsOutputConfig.includeCampaignTraitsFullText === false`, emit only the `[colour]...[-]` name line, no `[sup]...[/sup]` body — matching the existing short-form pattern used for special rules at [utils.tsx:711](src/utils.tsx#L711).
- `disableSmallText` ([utils.tsx:761](src/utils.tsx#L761)) stripping of `[sup]` tags must also apply to the new block.
- The `insertLineBreaksIntoString` helper ([utils.tsx:908](src/utils.tsx#L908)) must be applied to trait descriptions for the same length-wrapping reason rules get it.

### R4 — Per-trait "include in output" checkbox UI

- In [App.tsx](src/App.tsx), inside the model editor column (`editor-panel`, around [App.tsx:273-355](src/App.tsx#L273-L355)), **above** the "Duplicate this model definition" button, add a new section listing each campaign trait on that model with a checkbox bound to `includeInOutput`.
- Checkboxes are **grouped by category**, with a small category header (Skill Sets / Traits / Injuries / Talents). A category group is rendered only if the model has at least one trait in it.
- Row label is just the trait name (short form). The full sentence "Include Campaign Trait > `<category>` > `<name>` in model description" goes into the row's `title` attribute for accessibility / hover reveal.
- All checkboxes default checked (from `includeInOutput: true`).
- The entire section is hidden if the model has zero campaign traits (so non-campaign-mode lists or non-hero units without traits get no empty section).
- Add a state mutator in [state.ts](src/state.ts) alongside `updateWeaponIncludeInName` (e.g. `updateCampaignTraitIncludeInOutput(upId, mId, traitId, include)`) to match the existing pattern. Do not reach into the valtio proxy directly from the component.

### R5 — Output Options: global toggles, per-category master toggles, colour

- `ttsOutputConfig.includeCampaignTraits` and `includeCampaignTraitsFullText` already exist in state but have no checkbox in [OutputOptions.tsx](src/components/OutputOptions.tsx). Add them.
- Add **four new per-category master toggles** to `ttsOutputConfig` and to `OutputOptions.tsx`:
  - `includeCampaignSkillSets: boolean` (default `true`)
  - `includeCampaignTraitsCategory: boolean` (default `true`) — named to avoid clashing with the existing global `includeCampaignTraits` umbrella flag
  - `includeCampaignInjuries: boolean` (default `true`)
  - `includeCampaignTalents: boolean` (default `true`)
  These toggles gate the corresponding R3 category blocks. They do **not** override the per-trait `includeInOutput` (still evaluated as AND).
- `modelCampaignStuffOutputColour` already exists in state with no colour picker; add one alongside the other `colours.*` pickers (see [OutputOptions.tsx:206-325](src/components/OutputOptions.tsx#L206-L325)).
- Add the existing-but-unused `includeCampaignXp` checkbox to Output Options (wires R6).
- i18n keys follow the existing `outputOptions.rules.<thing>.name` / `.label` / `outputOptions.colours.<thing>.name` / `.label` pattern and must be added to every file in [src/locales/](src/locales/) (en, de, es, fr, it). English authoritative; other locales can mirror English initially if no translation is immediately available (same convention used elsewhere in the codebase).

### R6 — Campaign XP output

- `iUnitProfileModel.xp: number` is already populated from `unit.xp || 0` at [utils.tsx:223](src/utils.tsx#L223). Consume it.
- When `ttsOutputConfig.includeCampaignXp === true` **and** the model's `xp > 0`, append a single line to the description field **after** the campaign trait blocks:
  ```
  [<campaign_colour>]Campaign XP: <xp>[-]
  ```
- When `xp === 0`, render nothing (suppresses the line for non-campaign lists and for campaign lists where a unit has zero XP).
- `disableSmallText` does not apply here (no `[sup]` on this line) but follow whatever formatting matches the campaign trait block visually.

## Technical Considerations

### Common rules response shape (new types required)

The `traits` array on the `/api/rules/common/<n>` endpoint has a lot of fields, most of them `null` for campaign-mode traits. Based on the live response in the user's network screenshots, the fields we actually care about are:

```typescript
// src/army-forge-types.ts
export interface ICommonRuleTrait {
  id: string;
  name: string;
  description: string;
  type: number;          // categorisation — see eCampaignTraitType mapping below
  skillSet?: string | null;  // e.g. "Shooter", "Fighter", "Pathfinder", …; only meaningful when type maps to SKILL_SET
  campaign: boolean;     // true for all campaign-mode traits; false/undefined otherwise
  // Everything else on the wire object (aliasedRuleId, archived, category, coreType, costFormula,
  // defaultRating, enabledGameSystems, generation, hasRating, params, rangedWoundFormula,
  // ratingValues, replaceWith, ruleGenEnabled, ruleType, tags, targetType, variants,
  // weaponWeight, weight, woundFormula) is observed but unused by this feature — leave it
  // off the interface to keep the type tight. If we ever need it, add as optional.
}
```

The existing `iCommonRule` interface at [utils.tsx:23](src/utils.tsx#L23) is function-local. Consider promoting it to `src/army-forge-types.ts` as `ICommonRule` alongside the new `ICommonRuleTrait`, since both come from the same endpoint.

### `type` → category enum mapping

From the observed data in the user's network inspector (`get-army?commonRulesId=3`):

| `type` | Category       | Evidence                                             |
|--------|----------------|------------------------------------------------------|
| `1`    | Injury         | `Blinded Eye`: `type: 1`                             |
| `2`    | Talent         | `Natural Talent`: `type: 2`                          |
| `3`    | Skill Set      | `Suppressor`: `type: 3, skillSet: "Shooter"`         |
| `?`    | Trait (plain)  | Not directly confirmed in screenshots; see below     |

**Regular "Traits" type value** (Agile, Fast Learner, Resilient, Specialist, Headstrong, Elite): not visible in the provided screenshots. Plan:

- During implementation, log the `type` values of any trait name that matches the user's visible UI Traits list (e.g. `Agile`) and confirm the numeric value (likely `4`).
- Until confirmed, the implementation must treat **any `type` value not in {1, 2, 3}** (including `null`, `undefined`, unknowns) as `eCampaignTraitCategory.TRAIT`. This is the safe default because (a) regular Traits are the catch-all "non-hero-restricted" category, (b) if we're wrong about a specific injury/talent/skill set, it just renders under the "Traits" heading instead of being hidden — no data loss.
- Once the numeric value is confirmed, add the explicit mapping entry; keep the catch-all in place as a guard against new Army Forge categories.

Proposed internal enum:

```typescript
export enum eCampaignTraitCategory {
  SKILL_SET = "SKILL_SET",
  TRAIT = "TRAIT",      // also the fallback / "unknown" bucket
  INJURY = "INJURY",
  TALENT = "TALENT",
}
```

Mapping function lives alongside other helpers in `src/utils.tsx` (e.g. `getCampaignTraitCategory(trait: ICommonRuleTrait | undefined): eCampaignTraitCategory`). Accepts `undefined` so missing-from-dict entries (fallback case in R2) can share the same code path and resolve to `TRAIT`.

### Internal per-model shape

```typescript
// src/types.ts — new
export interface iCampaignTraitOnModel {
  id: string;                        // nanoid, UI key
  name: string;                      // e.g. "Suppressor"
  category: eCampaignTraitCategory;
  skillSet?: string;                 // only populated for SKILL_SET
  description: string;               // text from ICommonRuleTrait.description, or fallback placeholder
  includeInOutput: boolean;          // defaults to true
  originalTrait?: ICommonRuleTrait;  // keep the raw source for potential future use (mod integration)
}

// iUnitProfileModel — change
export interface iUnitProfileModel {
  // …existing fields…
  // remove: traits: string[];
  campaignTraits: iCampaignTraitOnModel[];
  xp: number;                        // unchanged; still unused in this spec
}

// iAppState — add
campaignTraitsDict: ICommonRuleTrait[];

// iAppState.ttsOutputConfig — add (all default true)
includeCampaignSkillSets: boolean;
includeCampaignTraitsCategory: boolean;
includeCampaignInjuries: boolean;
includeCampaignTalents: boolean;
```

### iTotalShareableOutput (DB payload) — no change this spec

`iUnitProfileModelTTSOutput` ([types.ts:21](src/types.ts#L21)) only carries the already-formatted `ttsNameOutput` / `ttsDescriptionOutput` strings — campaign trait text ends up embedded in `ttsDescriptionOutput` and is thus automatically included in the save-list payload and the TTS mod's GET fetch. No schema change to the Turso row or to `save-list.ts` is required.

The mod-side "data panel" idea the user mentioned is a future enhancement and would need a structured trait list on the shareable output, but that's deferred.

### Valtio mutations

Direct valtio proxy assignments from components work (existing code does this in a few places), but this feature should follow the named-helper pattern to match `updateWeaponIncludeInName` et al. Add:

```typescript
export const updateCampaignTraitIncludeInOutput = (
  upId: string, mId: string, traitId: string, include: boolean
) => { /* mirror updateWeaponIncludeInName */ }
```

in [state.ts](src/state.ts).

### `onGenerateDefinitions` ordering

The existing flow:
1. Fetch army list → `data`
2. Fetch common rules → `commonRulesData`
3. Write `state.coreSpecialRulesDict`, `state.gameSystem`, `state.armySpecialRulesDict`
4. Map `data.units` → `unitProfiles`

The new campaign traits dict must be written **between step 3 and step 4**, because the unit mapping (step 4) needs to look up each unit's trait names against it when constructing `model.campaignTraits`.

### i18n

Every user-visible string in R4/R5 must use `useTranslation()` / `t("…")` / `<Trans>` (see [App.tsx:3](src/App.tsx#L3) and every existing component). Do not hardcode English. Add keys to all five locale files.

## Related Systems and Tasks

- `CLAUDE.md` — Data-flow section, especially the note about `generateUnitOutput` merging special rules from three sources. Campaign traits are a **fourth source** but rendered in a separate block, not merged into the existing rules list.
- `CLAUDE/mod-context.md` — Describes the mod side; relevant only for the deferred "data panel" follow-up. No changes required in this spec.
- [SPECS/feat-i19n-expanded.md](SPECS/feat-i19n-expanded.md) and [TASKS/feat-i19n-expanded.md](TASKS/feat-i19n-expanded.md) — ongoing i18n work; any new strings this feature introduces must respect that system.
- Previous additions to `iAppState.ttsOutputConfig` (`includeCampaignXp`, `includeCampaignTraits`, `includeCampaignTraitsFullText`, `modelCampaignStuffOutputColour`) — landed in state but never wired to UI or output. This spec finally consumes them.
- [src/utils.tsx:397](src/utils.tsx#L397) `generateUnitOutput` — the single fat function that does all BBCode formatting. Campaign traits get their own block here; do not try to squeeze them into the existing `allApplicableSpecialRules*` merging.

## Resolved Decisions

These were Open Questions that have since been answered and are captured here for the implementer:

1. **`unit.traits` shape** — confirmed: plain `string[]` on the army endpoint, no ids. All enrichment happens client-side by name-matching against `state.campaignTraitsDict`.
2. **Category inference** — do derive from the `type` field on each dict entry. Confirmed mappings: 1=Injury, 2=Talent, 3=Skill Set. Anything else falls into `TRAIT` (safe catch-all).
3. **Output prefix** — uniform `Campaign Trait - <name>` for all four categories. No nesting like "Skill Set > Shooter > Suppressor" in the output text (the grouping is communicated visually by the block order and by the category headers in the editor UI only).
4. **Checkbox labels** — short form: trait name on the row, full "Include Campaign Trait > `<category>` > `<name>` in model description" on the `title` attribute.
5. **Per-category master toggles** — yes, add them (see R5). Four new flags in `ttsOutputConfig`.
6. **XP rendering** — in scope (R6). Append a `Campaign XP: <n>` line after the trait blocks when `includeCampaignXp` is on and `xp > 0`.
7. **Mod-side data panel** — deferred. No changes to `iTotalShareableOutput` in this spec.

## Open Questions

1. **Exact numeric `type` for regular "Traits"** (Agile, Fast Learner, Resilient, Specialist, Headstrong, Elite). Not unblocking — the implementation's default for unrecognised `type` is `TRAIT`, so the first pass will behave correctly for these even without the number being confirmed. Still: during implementation, log the `type` value for one of these names and add the explicit mapping so future categories don't silently fall through the catch-all.

## Acceptance Criteria

- Importing a campaign-mode list populates `state.campaignTraitsDict` with the trait definitions from the common rules endpoint.
- Every model in an imported list carries a `campaignTraits` array matching its Army Forge `unit.traits` strings, each entry enriched with `category`, `description`, and `includeInOutput: true`.
- Each trait's `category` is derived from the dict entry's `type` field: 1→Injury, 2→Talent, 3→Skill Set, anything else→Trait.
- For a model with traits, each trait appears in the model's TTS description preview as a category-grouped `[colour]Campaign Trait - <name>[-]` line with its `[sup]description[/sup]` below it (when full text is enabled), using the existing `modelCampaignStuffOutputColour`.
- The four categories (Skill Sets, Traits, Injuries, Talents) appear in that order; empty categories are omitted.
- Checkboxes above the "Duplicate this model definition" button let the user toggle each trait's inclusion individually. Unchecking a trait immediately removes it from the TTS preview.
- Checkbox rows display only the trait name; the full "Include Campaign Trait > `<category>` > `<name>` in model description" text is accessible via the row's `title` attribute.
- The new checkboxes default **on** for every trait on every model.
- `includeCampaignTraits: false` at the config level hides all campaign trait output globally (regardless of per-trait toggles and per-category master toggles).
- Each per-category master toggle (`includeCampaignSkillSets` / `includeCampaignTraitsCategory` / `includeCampaignInjuries` / `includeCampaignTalents`) independently hides its category block when off; per-trait toggles still gate individual items within the block when on.
- `includeCampaignTraitsFullText: false` hides only the `[sup]description[/sup]` lines, leaving the name lines visible.
- `disableSmallText: true` strips `[sup]` / `[/sup]` from campaign trait output (same as existing behaviour for rules).
- When `includeCampaignXp: true` and `model.xp > 0`, the description ends with a `[colour]Campaign XP: <n>[-]` line. When either condition is false, the line is absent.
- Output Options panel exposes checkboxes for `includeCampaignTraits`, `includeCampaignTraitsFullText`, `includeCampaignXp`, all four per-category master toggles, and a colour input for `modelCampaignStuffOutputColour`.
- All new user-visible strings are translatable and present in all five locale files.
- A list with no campaign-mode units (and thus no `traits` on units) renders identically to today — no empty blocks, no errors, no checkbox section.
- `npm run build` passes (typecheck clean).
- The shareable link / Turso-stored payload contains the campaign trait text and XP line embedded within each model's `ttsDescriptionOutput` and can be fetched by the TTS mod without any mod changes.

## Implementation Notes

Files expected to change:

- [src/army-forge-types.ts](src/army-forge-types.ts) — add `ICommonRule` (promoted from `utils.tsx`), `ICommonRuleTrait`.
- [src/types.ts](src/types.ts) — add `eCampaignTraitCategory`, `iCampaignTraitOnModel`; replace `iUnitProfileModel.traits` with `campaignTraits`; add `campaignTraitsDict` to `iAppState`.
- [src/state.ts](src/state.ts) — initialise `campaignTraitsDict: []`; set the four new per-category master toggles to `true` in `initialTtsOutputConfig`; add `updateCampaignTraitIncludeInOutput` helper.
- [src/utils.tsx](src/utils.tsx):
  - Extend `onGenerateDefinitions` to populate `campaignTraitsDict` from the common rules response and to map `unit.traits` into `model.campaignTraits`. Remove the now-stale `traits: unit.traits || []` assignment at [utils.tsx:224](src/utils.tsx#L224).
  - Extend `generateUnitOutput` with a new campaign-traits BBCode block (per category), respecting `includeCampaignTraits`, the four per-category master toggles, per-trait `includeInOutput`, `includeCampaignTraitsFullText`, `disableSmallText`, `modelCampaignStuffOutputColour`.
  - Append the `Campaign XP: <n>` line when `includeCampaignXp && model.xp > 0`.
  - Add `getCampaignTraitCategory(trait): eCampaignTraitCategory` helper.
- [src/App.tsx](src/App.tsx) — inject the trait-toggle section into the model editor column above the "Duplicate this model definition" button (around [App.tsx:346](src/App.tsx#L346)). Render category headers + per-trait rows; omit groups with no traits; hide the whole section when the model has zero campaign traits.
- [src/components/OutputOptions.tsx](src/components/OutputOptions.tsx) — add controls:
  - 2 existing-but-unwired toggles: `includeCampaignTraits`, `includeCampaignTraitsFullText`
  - 1 existing-but-unwired toggle: `includeCampaignXp`
  - 4 new per-category toggles: `includeCampaignSkillSets`, `includeCampaignTraitsCategory`, `includeCampaignInjuries`, `includeCampaignTalents`
  - 1 colour picker: `modelCampaignStuffOutputColour`
- [src/locales/en.yaml](src/locales/en.yaml), [de.yaml](src/locales/de.yaml), [es.yaml](src/locales/es.yaml), [fr.yaml](src/locales/fr.yaml), [it.yaml](src/locales/it.yaml) — new translation keys for all strings above.

Files expected **not** to change:

- [netlify/functions/get-army/get-army.ts](netlify/functions/get-army/get-army.ts) — already returns `traits` from the common rules endpoint alongside `rules`; the current handler forwards the full response.
- [netlify/functions/save-list/](netlify/functions/save-list/) — `iTotalShareableOutput` shape is unchanged.
- [tts_lua_code/mod.lua](tts_lua_code/mod.lua) — deferred follow-up.

Existing patterns to preserve:

- Use the named state-mutator pattern (like `updateWeaponIncludeInName`) rather than mutating the valtio proxy from the component.
- Follow the dedupe-by-`key || name` pattern when processing rule-ish data — but note that campaign traits don't need dedupe in practice (Army Forge enforces uniqueness in its picker UI); a safety pass on `_.uniqBy(..., "name")` is cheap and worth keeping.
- Fallback placeholder descriptions for missing dict entries ("[[Campaign trait description missing in Army Forge data!]]") mirror the existing "[[Rule description missing in Army Forge data!]]" pattern.

Before wrapping up implementation:

- Confirm the `type` value for regular "Traits" entries (e.g. `Agile`) by inspecting the response from `get-army?commonRulesId=3&isBeta=false`, and add the explicit mapping in `getCampaignTraitCategory`. Not a blocker for getting first-pass output working (the catch-all defaults unrecognised types to `TRAIT`), but worth tightening up before merge.

---

*This specification is ready for implementation. Use `/task april-2026-3-campaign-support` to begin development.*
