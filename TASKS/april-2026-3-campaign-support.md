# april-2026-3-campaign-support

**Status**: In Progress

## Overview

Implement campaign trait support for units imported from Army Forge, per [SPECS/april-2026-3-campaign-support.md](../SPECS/april-2026-3-campaign-support.md).

Unit endpoint returns `traits: string[]` only; common-rules endpoint returns a full `traits: ICommonRuleTrait[]` array with `id`, `name`, `description`, `type` (1=Injury, 2=Talent, 3=Skill Set, other=Trait), `skillSet`, `campaign`. Enrich unit traits client-side by name match, render each in the model's TTS description field grouped by category, add per-trait toggles in the editor UI and per-category master toggles in Output Options. Also wire up the already-existing-but-unused `includeCampaignXp`, emitting a `Campaign XP: <n>` line after the trait blocks when the model has xp.

## Task Context

### Spec

Authoritative: [SPECS/april-2026-3-campaign-support.md](../SPECS/april-2026-3-campaign-support.md). Read it before starting. Key sections: R1–R6, Technical Considerations (types + type-number mapping), Resolved Decisions.

### Codebase conventions (from CLAUDE.md and prior-spec investigation)

- `generateUnitOutput` at [src/utils.tsx:397](../src/utils.tsx#L397) is deliberately dense — preserve the existing `@ts-ignore` comments and fallback history comments.
- Data flow: pasted URL → `extractIdFromUrl` → `/.netlify/functions/get-army` → map into `iUnitProfile[]` in `state.unitProfiles` → `generateUnitOutput` produces BBCode per model.
- State: single valtio proxy at [src/state.ts](../src/state.ts). Mutations go through named helpers; follow the `updateWeaponIncludeInName` pattern.
- Build/typecheck: `npm run build` (there is no separate lint / no tests). Full local stack: `npm run netlify:dev`.
- Common-rules endpoint already returns `traits` — `get-army.ts` proxies the full response, so no Netlify function change needed.
- `ttsOutputConfig.includeCampaignTraits`, `includeCampaignTraitsFullText`, `includeCampaignXp`, `modelCampaignStuffOutputColour` all already exist in state ([src/state.ts:18-26](../src/state.ts#L18-L26)) but are currently unused. `model.traits: string[]` is populated but never read.
- i18n: every user-visible string uses `useTranslation()` / `t("…")` / `<Trans>`. New strings must be added to all five files in [src/locales/](../src/locales/) (en, de, es, fr, it). English authoritative.

### Key files touched (from spec § Implementation Notes)

- [src/army-forge-types.ts](../src/army-forge-types.ts) — add `ICommonRule`, `ICommonRuleTrait`
- [src/types.ts](../src/types.ts) — add `eCampaignTraitCategory`, `iCampaignTraitOnModel`; replace `iUnitProfileModel.traits` with `campaignTraits`; add `campaignTraitsDict` + 4 new per-category flags to `iAppState`
- [src/state.ts](../src/state.ts) — init the 4 new flags to `true`; init `campaignTraitsDict: []`; add `updateCampaignTraitIncludeInOutput` helper
- [src/utils.tsx](../src/utils.tsx) — `onGenerateDefinitions` populates dict + enriches traits; `generateUnitOutput` emits the new blocks + XP line; new `getCampaignTraitCategory` helper
- [src/App.tsx](../src/App.tsx) — per-trait checkbox UI above "Duplicate this model definition" button
- [src/components/OutputOptions.tsx](../src/components/OutputOptions.tsx) — 3 existing-but-unwired toggles + 4 new per-category master toggles + 1 colour picker
- [src/locales/*.yaml](../src/locales/) — new translation keys

### Do NOT change

- [netlify/functions/get-army/get-army.ts](../netlify/functions/get-army/get-army.ts)
- [netlify/functions/save-list/](../netlify/functions/save-list/) — `iTotalShareableOutput` shape unchanged; XP and trait text ride along inside `ttsDescriptionOutput`
- [tts_lua_code/mod.lua](../tts_lua_code/mod.lua) — deferred to a future spec

## Blockers/Issues

None currently.

## TODO

- [X] **Types** — `ICommonRule`, `ICommonRuleTrait` in `army-forge-types.ts`; `eCampaignTraitCategory`, `iCampaignTraitOnModel` in `types.ts`; `iUnitProfileModel.campaignTraits` replaces `traits`; `iAppState.campaignTraitsDict` + 4 new flags on `ttsOutputConfig`.
- [X] **State init** — `campaignTraitsDict: []` + the 4 new flags default `true` in `initialTtsOutputConfig`. Also flipped the existing-but-unwired `includeCampaignXp`, `includeCampaignTraits`, `includeCampaignTraitsFullText` to default `true` so campaign-mode lists show the new output by default.
- [X] **Mutator** — `updateCampaignTraitIncludeInOutput` in `state.ts`.
- [X] **Category helper** — `getCampaignTraitCategory` in `utils.tsx`: 1=Injury, 2=Talent, 3=Skill Set, else/undefined=Trait.
- [X] **Import flow** — `onGenerateDefinitions` now populates `state.campaignTraitsDict` from `commonRulesData.traits` and enriches each unit's `unit.traits: string[]` into `model.campaignTraits: iCampaignTraitOnModel[]` by name-match against the dict.
- [X] **Dup-handling** — `duplicateModel` reassigns fresh nanoid ids on every cloned `campaignTraits` entry.
- [X] **Output rendering** — `generateUnitOutput` emits 4 ordered category blocks with global + per-category + per-trait gating; `insertLineBreaksIntoString` applied to descriptions; `disableSmallText` strip applies; uses `modelCampaignStuffOutputColour`.
- [X] **XP output** — `Campaign XP: <n>` line appended when `includeCampaignXp && model.xp > 0`.
- [X] **Editor UI** — trait-toggle section in `App.tsx` above the duplicate button; grouped by category; empty groups omitted; whole section hidden when model has no traits; short-form label with full phrase in `title`.
- [X] **Output Options UI** — 3 existing-but-unwired toggles + 4 new per-category master toggles + colour picker added.
- [X] **i18n** — all new keys added across en, de, fr, es, it.
- [X] **Typecheck** — `npm run build` clean.
- [ ] **Manual smoke test** — `npm run netlify:dev`, import a campaign-mode list, verify: traits render in preview; per-trait toggles work; per-category master toggles work; XP line appears when >0; no regressions on non-campaign lists.
- [ ] **Follow-up** — empirically confirm the `type` value for a regular "Trait" (e.g. `Agile`) and add an explicit mapping entry. Not a blocker; catch-all handles it.

## Work Log

[2026-04-24] End-to-end implementation of campaign trait support per the spec.

- Types: [src/army-forge-types.ts](../src/army-forge-types.ts) (added `ICommonRule`, `ICommonRuleTrait`); [src/types.ts](../src/types.ts) (added `eCampaignTraitCategory`, `iCampaignTraitOnModel`; replaced `iUnitProfileModel.traits` with `campaignTraits`; added `campaignTraitsDict` + 4 config flags on `iAppState`).
- State: [src/state.ts](../src/state.ts) (init `campaignTraitsDict: []`; defaulted `includeCampaignXp`/`Traits`/`TraitsFullText`/`SkillSets`/`TraitsCategory`/`Injuries`/`Talents` to `true`; `updateCampaignTraitIncludeInOutput` mutator; `duplicateModel` re-nanoids cloned traits).
- Logic: [src/utils.tsx](../src/utils.tsx) (`getCampaignTraitCategory` helper; `onGenerateDefinitions` writes `state.campaignTraitsDict = commonRulesData.traits` and builds `model.campaignTraits`; `generateUnitOutput` emits per-category campaign trait blocks and the XP line; promoted local `iCommonRule` to imported `ArmyForgeTypes.ICommonRule`).
- UI: [src/App.tsx](../src/App.tsx) (per-trait toggle section above duplicate button, grouped by category); [src/components/OutputOptions.tsx](../src/components/OutputOptions.tsx) (3 existing-but-unwired toggles, 4 new per-category toggles, 1 colour picker).
- i18n: new `app.model.campaignTraits.*`, `outputOptions.rules.includeCampaign*`, and `outputOptions.colours.campaign.*` keys added to all five locales ([en](../src/locales/en.yaml), [de](../src/locales/de.yaml), [fr](../src/locales/fr.yaml), [es](../src/locales/es.yaml), [it](../src/locales/it.yaml)).
- `npm run build` passes clean.
- Manual browser test deferred to next session.
