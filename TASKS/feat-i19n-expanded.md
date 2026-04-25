# feat-i19n-expanded

**Status**: In Progress

## Overview

Extend the i18n work from [feat-translation.md](./✅%20feat-translation.md) (or `feat-translation.md` if not yet renamed) by:

1. Adding **German (`de`)**, **Spanish (`es`)**, and **Italian (`it`)** locale files and wiring them into the language picker — same first-pass machine-translation approach as French, flagged for native-speaker review.
2. Clarifying the **language code format** displayed in the picker. The current setup uses ISO 639-1 2-letter codes (`en`, `fr`) rendered uppercase as "EN"/"FR", which is correct — but the user flagged this as looking wrong. Needs user decision on whether to switch to BCP 47 locale tags (`en-GB`, `fr-FR`, etc.) or keep the standard 2-letter form.

## Task Context

### Existing i18n setup (from feat-translation)
- **Library:** react-i18next@^14 + i18next@^23 + i18next-browser-languagedetector@^7 + `@modyfi/vite-plugin-yaml`.
- **Locale files:** `src/locales/<lang>.yaml`. Only `en.yaml` + `fr.yaml` exist today.
- **i18n init:** [src/i18n/index.ts](../src/i18n/index.ts) — imports each YAML, declares `SUPPORTED_LANGUAGES` array, resources object, `fallbackLng: "en"`, `nonExplicitSupportedLngs: true`.
- **Picker:** [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx) — hardcoded `LANGUAGES` array `[{ id, flag }]`, currently just `en` + `fr`.
- **Flags available in [src/components/icons.tsx](../src/components/icons.tsx):** UnitedKingdomFlag (139), GermanyFlag (209), PolandFlag (242), TürkiyeFlag (276), ItalyFlag (319), BrazilFlag (355), FranceFlag (399). **No SpainFlag yet — must be added.**
- **Docs:** README "Contributing translations" section should not need changes (it already describes the generic "add a new language" workflow), but double-check.

### Open questions / decisions needed

- **Language code format in picker UI:** User said *"the language codes - i dont think they should be just 'EN' for example right? dont language codes have 2 sets of letters?"*
  - Current: displays the `id` (e.g. `en`, `fr`) via CSS `uppercase` → renders as "EN"/"FR". This IS the standard ISO 639-1 2-letter code, one group of two letters. Not malformed.
  - User may be thinking of **BCP 47 locale tags** (`en-GB`, `en-US`, `fr-FR`) which have two groups separated by `-`.
  - Options:
    1. Keep current (standard, correct).
    2. Switch to full BCP 47 locale tags — needs a region choice per language (e.g. `en-GB`? `en-US`? `de-DE`? `es-ES` vs `es-MX`? `it-IT`? `fr-FR`?). More involved: need to decide whether `resources` keys and `supportedLngs` also change, or whether only the picker display changes.
    3. Display the language's native name instead of the code ("English", "Français", "Deutsch", "Español", "Italiano") — sometimes nicer UX than codes.
  - **Awaiting user decision before touching picker.**

### Translation source
- First-pass machine translation (matches the approach used for French), flagged in a header comment for native-speaker review. Preserve all `<0>`/`<1>` placeholders and `{{var}}` interpolations exactly from `en.yaml`.

## Blockers/Issues

None. Language code format resolved: **keeping current 2-letter ISO 639-1 codes** (`EN`, `FR`, `DE`, `ES`, `IT`). User confirmed they're technically correct and preferred the compact form over locale tags / native names.

## TODO

### Translation files
- [X] Create [src/locales/de.yaml](../src/locales/de.yaml) — German, mirror `en.yaml` structure.
- [X] Create [src/locales/es.yaml](../src/locales/es.yaml) — Spanish, mirror `en.yaml` structure.
- [X] Create [src/locales/it.yaml](../src/locales/it.yaml) — Italian, mirror `en.yaml` structure.
- [X] Verify every `<0>` / `<1>` placeholder and `{{var}}` interpolation is preserved verbatim from `en.yaml`.

### Wiring
- [X] Import de/es/it in [src/i18n/index.ts](../src/i18n/index.ts); add to `SUPPORTED_LANGUAGES` and `resources`.
- [X] Add `SpainFlag` component to [src/components/icons.tsx](../src/components/icons.tsx).
- [X] Add de/es/it entries to the `LANGUAGES` array in [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx).

### Picker UX
- [X] Decide language code display: **kept current 2-letter ISO 639-1 codes**. No picker display change needed beyond adding the 3 new entries.

### Verification
- [X] `npm run build` passes.
- [ ] Manual: picker shows all 5 languages, each switch flips the UI, selection persists across reload. **(awaiting user verification)**
- [ ] Manual: tl;dr paragraph, bug-report line, tutorial item 7 keep their `<a>` links working in every new language. **(awaiting user verification)**
- [ ] Grep: no missing-key console warnings while clicking through Tutorial / OutputOptions / OutputFAQ / error alerts in each language. **(awaiting user verification)**

## Work Log

### [2026-04-22] Language-code format decision
- User asked whether the picker's `EN`/`FR` display looked wrong (expected "two sets of letters"). Clarified that the current codes are ISO 639-1 (2 letters, one group, standard) vs. BCP 47 locale tags (`en-US`, etc. — two groups, used for regional variants). User confirmed to keep the existing 2-letter form.

### [2026-04-22] Added German, Spanish, Italian locales + wiring
- Created [src/locales/de.yaml](../src/locales/de.yaml), [src/locales/es.yaml](../src/locales/es.yaml), [src/locales/it.yaml](../src/locales/it.yaml). First-pass machine translation flagged at the top of each file, mirroring the `fr.yaml` convention. All `<0>`/`<1>`/`<em>` placeholders and `{{count}}`/`{{n}}`/`{{loadout}}` interpolations preserved verbatim.
- Added `SpainFlag` component to [src/components/icons.tsx](../src/components/icons.tsx) — horizontal red/yellow/red stripes (rojo gualda), matching the existing flags' 32×32 viewBox with the standard rounded-corner shadow + highlight overlays.
- Wired de/es/it into [src/i18n/index.ts](../src/i18n/index.ts): imports, `SUPPORTED_LANGUAGES` array, `resources` object.
- Extended the `LANGUAGES` array in [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx) to include de (GermanyFlag), es (SpainFlag), it (ItalyFlag). Germany + Italy flag components were already present from the original commented-out picker.
- Files modified: `src/i18n/index.ts`, `src/components/icons.tsx`, `src/components/LanguagePicker.tsx`. New: `src/locales/de.yaml`, `src/locales/es.yaml`, `src/locales/it.yaml`.
- `npm run build` passes clean.

### [2026-04-22] Fix: `<em>` rendering as literal text in tl;dr
- User reported the tl;dr paragraph was displaying `<em>that</em>` as raw text in all locales. Root cause: the `<Trans>` component in [src/App.tsx](../src/App.tsx) only maps `<0>` / `<1>` to the two `<a>` elements; `<em>` isn't in its `components` prop. By default react-i18next only passes through `['br', 'strong', 'i', 'p']` as-is (`transKeepBasicHtmlNodesFor`) — `em` isn't on that list, so it got escaped.
- Fix: added `transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p", "em"]` to the `react` config block in [src/i18n/index.ts](../src/i18n/index.ts). One-liner, no string edits needed, covers every locale.
- Note: this was actually a latent bug from the original feat-translation work — French had the same issue. Now fixed for all 5 languages.
- Files modified: `src/i18n/index.ts`.
