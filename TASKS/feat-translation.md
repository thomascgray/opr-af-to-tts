# feat-translation

**Status**: Ready for review

## Overview

Implement a working translation (i18n) layer using **react-i18next** with **YAML** locale files, completing the abandoned first attempt left by a previous developer. Ship with English + French, enable the existing (commented-out) language picker next to the dark-mode toggle, and extract every hardcoded user-facing English string across the app into locale files.

Full spec at [SPECS/feat-translation.md](../SPECS/feat-translation.md).

## Task Context

### Starting point (partial i18n, abandoned)
- `src/i18n.ts` — hand-written JS object with EN strings, empty `de` stub. **Deleted.**
- `src/usei18n.tsx` — custom `t(key)` hook using `_.get` for dot paths; returned `"[[MISSING TRANSLATION]]"` on miss. **Deleted.**
- [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx) — was a flag-button picker for `en/de/pl/pt-br/tr`, commented out in App.tsx. Rewritten and re-enabled.
- Only two callsites of `t()` existed: Tutorial.tsx (summary only) and OutputOptions.tsx (18 keys — rule names/labels).

### Key decisions from spec
- **Library:** react-i18next@^14 + i18next@^23 + i18next-browser-languagedetector@^7 + `@modyfi/vite-plugin-yaml`. `react-i18next` pinned to v14 because v15+ requires TypeScript ≥ 5 and the project is on 4.9.5.
- **Languages shipped:** `en` (complete) and `fr` (populated, first-pass machine translation — flagged for native-speaker review).
- **Locale files:** `src/locales/<lang>.yaml` — YAML, nested keys, comments OK.
- **Rich text:** `<Trans>` with indexed `<0>` / `<1>` placeholders for strings with inline `<a>` tags (bug-report line, tl;dr paragraph, tutorial item 7).
- **Missing-key fallback:** fall back to `en`, then to the key itself. Dev-only `console.warn` via `missingKeyHandler`.
- **localStorage key:** preserved existing `tombolaopraftotts_currentLanguage` via `i18next-browser-languagedetector` config.
- **First-visit default:** detect from `navigator.language`, fallback `en`.
- **Picker UX:** rewritten with a modern look — white/dark-slate popover, rounded, drop shadow, rotating chevron, teal check on the active option, click-outside-to-close. Same concept, nicer execution.
- **Flags:** kept `GermanyFlag` / `PolandFlag` / `BrazilFlag` / `TürkiyeFlag` / `ItalyFlag` in [icons.tsx](../src/components/icons.tsx) per explicit user instruction (may re-enable those languages later). Added new `FranceFlag`.
- **Dead code removed:** [VersionHistory.tsx](../src/components/VersionHistory.tsx) was unreferenced.

### Deviations from spec
- **Strict key typing via `CustomTypeOptions` was NOT enabled** (spec R8 / Q7). Reason: `@modyfi/vite-plugin-yaml` declares `declare module "*.yaml" { const value: Record<string, any> }`, so TypeScript can't infer the shape of imported YAML. Delivering strict keys with YAML + TS 4.9 would require either a YAML→TS codegen step or a duplicate TS schema file mirroring every key. Neither felt worth the maintenance burden for ~60 keys when the dev-mode `console.warn` already surfaces missing keys at runtime. Flagged to user mid-task and accepted. Deferred as a follow-up if/when the project upgrades to TS 5.

## Blockers/Issues

None. Build passes (`tsc && vite build`), dev server runs clean, manual visual pass completed with user.

## TODO

### Setup / infra
- [X] Install deps: `react-i18next@^14`, `i18next@^23`, `i18next-browser-languagedetector@^7`, `@modyfi/vite-plugin-yaml`.
- [X] Register YAML plugin in [vite.config.ts](../vite.config.ts).
- [X] Add `declare module "*.yaml"` to [src/vite-env.d.ts](../src/vite-env.d.ts).
- [X] Create [src/locales/en.yaml](../src/locales/en.yaml) with all keys.
- [X] Create [src/locales/fr.yaml](../src/locales/fr.yaml) with French translations.
- [X] Create [src/i18n/index.ts](../src/i18n/index.ts) — init with LanguageDetector, `fallbackLng: "en"`, detector config pinned to existing localStorage key, dev-only `missingKeyHandler`.
- [~] ~~Create `src/i18n/react-i18next.d.ts` — `CustomTypeOptions` module augmentation for strict key typing.~~ **Deferred** (see Deviations above).
- [X] Wire i18n init in [src/main.tsx](../src/main.tsx) above both Maintenance and App branches.

### Picker
- [X] Add `FranceFlag` component to [src/components/icons.tsx](../src/components/icons.tsx).
- [X] Rewrite [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx): trim `LANGUAGES` to `en` + `fr`, use `useTranslation()` + `i18n.changeLanguage()`. Other flag component definitions left in place.
- [X] Redesign picker UI: modern popover, rounded, shadow, rotating chevron, check-mark active indicator, click-outside-to-close.
- [X] Uncomment `<LanguagePicker />` in [src/App.tsx](../src/App.tsx).

### String extraction (per file)
- [X] [src/components/Tutorial.tsx](../src/components/Tutorial.tsx) — all 10 items + hint. Item 7 uses `<Trans>`.
- [X] [src/App.tsx](../src/App.tsx) — all strings. Bug-report line + tl;dr paragraph use `<Trans>`.
- [X] [src/components/OutputOptions.tsx](../src/components/OutputOptions.tsx) — colour labels, save/load header + description + buttons, empty state.
- [X] [src/components/OutputFAQ.tsx](../src/components/OutputFAQ.tsx) — summary + bullet.
- [X] [src/Maintenance.tsx](../src/Maintenance.tsx) — heading + body.
- [X] [src/utils.tsx](../src/utils.tsx) — three `alert()` messages via `i18n.t()` direct.

### Migration / cleanup
- [X] Swap `usei18n()` callsites in Tutorial.tsx and OutputOptions.tsx over to `useTranslation()`.
- [X] Delete `src/i18n.ts`.
- [X] Delete `src/usei18n.tsx`.
- [X] Delete [src/components/VersionHistory.tsx](../src/components/VersionHistory.tsx) (dead code).

### Docs
- [X] Add "Contributing translations" section to [README.md](../README.md) covering (a) how to fix/improve an existing translation via PR, and (b) how to propose a new language (issue first, then PR touching en.yaml / i18n index / LanguagePicker / icons).

### Verification
- [X] `npm run build` passes (`tsc && vite build`).
- [X] Manual: language picker visible next to dark-mode toggle, opens, switches language live, persists across reload. Confirmed by user.
- [X] Manual: tl;dr paragraph's `<a>` tags work and point to correct URLs in both languages. Confirmed by user.
- [X] Grep sanity check: `usei18n`, `"[[MISSING TRANSLATION]]"`, and `VersionHistory` references all gone from `src/`.

## Work Log

### [2026-04-21] Spec complete; implementation kickoff
- Filed [SPECS/feat-translation.md](../SPECS/feat-translation.md) covering library choice (react-i18next), language scope (en + fr only), locale format (YAML), strict typing, fallback behaviour, localStorage key preservation, and string-extraction scope.
- All 13 open questions resolved via Q&A with user.

### [2026-04-21] Infra + locale files
- Installed `react-i18next@^14`, `i18next@^23`, `i18next-browser-languagedetector@^7`, `@modyfi/vite-plugin-yaml`. Pinned react-i18next to v14 to work around TS 4.9 peer-dep conflict with v15+.
- Registered YAML plugin in [vite.config.ts](../vite.config.ts).
- Added inline `declare module "*.yaml"` to [src/vite-env.d.ts](../src/vite-env.d.ts) (the plugin's shipped `modules.d.ts` wasn't being picked up via `/// <reference types=…/>` because of how the package exports are structured; inline declaration is simpler and works identically).
- Wrote [src/locales/en.yaml](../src/locales/en.yaml) and [src/locales/fr.yaml](../src/locales/fr.yaml) covering all app / tutorial / outputOptions / outputFaq / maintenance / errors keys.
- Wrote [src/i18n/index.ts](../src/i18n/index.ts) with LanguageDetector order `["localStorage", "navigator"]`, localStorage lookup/cache pinned to `tombolaopraftotts_currentLanguage`, dev-only `missingKeyHandler` console.warn, and `nonExplicitSupportedLngs: true` so `fr-FR` resolves to `fr`.
- Files: `src/locales/en.yaml` (new), `src/locales/fr.yaml` (new), `src/i18n/index.ts` (new), `src/vite-env.d.ts`, `vite.config.ts`, `package.json`, `package-lock.json`.

### [2026-04-21] Picker + string extraction
- Added `FranceFlag` to [src/components/icons.tsx](../src/components/icons.tsx) — vertical tricolour (blue/white/red) matching the SVG pattern of the existing `ItalyFlag`.
- Rewrote [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx) on top of `useTranslation()` + `i18n.changeLanguage()`; trimmed `LANGUAGES` array to `en` + `fr`.
- Wired i18n init into [src/main.tsx](../src/main.tsx) above the Maintenance/App branches so Maintenance.tsx also translates.
- Extracted every hardcoded user-facing string across:
  - [src/App.tsx](../src/App.tsx) — title, bug-report line (`<Trans>`), tl;dr paragraph (`<Trans>` with 2 links), share-link label + placeholder, import button, inline-options legend + checkbox, per-unit legend + model-count (plural via `count`), joined-to / combined-with, original-loadout line, per-model labels, tooltips, TTS preview label, generate-link button, copy-paste hint. Uncommented `<LanguagePicker />`.
  - [src/components/Tutorial.tsx](../src/components/Tutorial.tsx) — all 10 ordered/nested items + hint. Item 7 uses `<Trans>` for the TTS-mod link.
  - [src/components/OutputOptions.tsx](../src/components/OutputOptions.tsx) — swapped `usei18n()` → `useTranslation()`; existing rule name/label keys migrated to new nested structure; extracted all remaining hardcoded copy (5 colour-picker blocks, save/load header + description, 4 buttons, "Load Custom Configs" header, empty state).
  - [src/components/OutputFAQ.tsx](../src/components/OutputFAQ.tsx) — header + note.
  - [src/Maintenance.tsx](../src/Maintenance.tsx) — heading + body.
  - [src/utils.tsx](../src/utils.tsx) — three `alert()` prefixes replaced with `i18n.t("errors.*")`; raw API error payloads (`data?.error`, `commonRulesData?.error`) left untranslated as they come from Army Forge.
- Files modified: App.tsx, Maintenance.tsx, main.tsx, utils.tsx, components/LanguagePicker.tsx, components/Tutorial.tsx, components/OutputOptions.tsx, components/OutputFAQ.tsx, components/icons.tsx.

### [2026-04-21] Cleanup + build
- Deleted `src/i18n.ts`, `src/usei18n.tsx`, `src/components/VersionHistory.tsx`.
- Fixed module-resolution issue: the new `src/i18n/index.ts` was shadowed by the old `src/i18n.ts` on imports from `utils.tsx`; deleting the old file resolved it.
- `npm run build` passes clean.
- Grep verified: no surviving references to `usei18n`, `[[MISSING TRANSLATION]]`, or `VersionHistory` anywhere in `src/`.
- User performed manual test pass against the running dev server; confirmed picker + persistence + rich-text links + alert translations all working.

### [2026-04-22] Picker UI redesign
- User flagged the initial picker as "ugly brown" and asked for a modernised look keeping the same concept.
- Rewrote [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx):
  - Trigger button: white bg (light) / slate bg (dark), rounded-md, subtle border + `shadow-sm`, hover tint, flag + uppercase code + small rotating chevron.
  - Popover: absolutely-positioned below trigger, right-aligned, `shadow-lg`, rounded, hover states on rows.
  - Active language: soft bg tint + teal checkmark on the right (replaced the previous heavy teal outline).
  - Added click-outside-to-close via mousedown listener on `document`.
- Removed the old fixed-width `min-w-[120px] h-[32px]` space-reserving wrapper since the popover now floats over subsequent content.

### [2026-04-22] Docs
- Added "Contributing translations" section to [README.md](../README.md):
  - Points contributors at `src/locales/` and explains that `en.yaml` is the source of truth.
  - "Fixing or improving" workflow: fork, edit YAML, preserve `<0>` / `{{var}}` placeholders, run build, open PR.
  - "Adding a new language" workflow: **open an issue first**, then PR that also updates [src/i18n/index.ts](../src/i18n/index.ts), [src/components/LanguagePicker.tsx](../src/components/LanguagePicker.tsx), and adds a flag to [src/components/icons.tsx](../src/components/icons.tsx) if needed.

---

## PR description

**Title:** `Add translations (i18n) with English + French`

```markdown
## Summary

- Completes the half-finished i18n attempt left in the repo: swaps the homegrown
  `usei18n` / `src/i18n.ts` pair for **react-i18next** backed by YAML locale files,
  and re-enables the `LanguagePicker` that was sitting commented out in `App.tsx`.
- Ships **English** (source of truth) and **French** (first-pass machine translation —
  flagged for native-speaker review). Languages live in `src/locales/*.yaml`, easy
  to contribute to via PR (see new README section).
- Extracts every user-facing hardcoded string across `App.tsx`, `Tutorial.tsx`,
  `OutputOptions.tsx`, `OutputFAQ.tsx`, `Maintenance.tsx`, and the three `alert()`
  error messages in `utils.tsx`. Uses `<Trans>` for strings with inline `<a>` tags
  (bug-report line, tl;dr paragraph, tutorial item 7).
- New **LanguagePicker UI**: modern popover next to the dark-mode toggle — flag +
  code trigger, click opens a dropdown of options with a teal check on the active
  language, click outside to close.
- Deletes dead code: `src/i18n.ts`, `src/usei18n.tsx`, and the unreferenced
  `src/components/VersionHistory.tsx`.
- Preserves the existing localStorage key `tombolaopraftotts_currentLanguage` so
  returning users keep their language selection. Users with a stored value of
  `de` / `pl` / `pt-br` / `tr` (the previous developer's never-populated options)
  will fall back to browser-detected language, then to English.

## Notable decisions / deviations from spec

- Pinned `react-i18next@^14` (latest is v17). v15+ requires TypeScript ≥ 5 and this
  project is on 4.9.5; upgrading TS was out of scope.
- **Strict `t()` key typing via `CustomTypeOptions` was deferred.** The YAML plugin
  exports `Record<string, any>`, so typing `t()` strictly would require either a
  YAML→TS codegen step or a duplicated schema .ts file. Not worth the maintenance
  cost right now; the dev-mode `missingKeyHandler` already warns on missing keys.
  Can be revisited if/when we upgrade to TS 5.
- Kept the currently-unused `GermanyFlag` / `PolandFlag` / `BrazilFlag` /
  `TürkiyeFlag` / `ItalyFlag` icon components in `icons.tsx` — they'll be reused
  when those languages are added later.

## Test plan

- [ ] `npm run build` passes (tsc + vite).
- [ ] Language picker visible top-right next to dark-mode toggle; opens/closes
      cleanly, click-outside closes it.
- [ ] Switching to FR flips every UI string; switching back to EN restores them.
- [ ] Selection persists across a page reload.
- [ ] Bug-report line, the tl;dr paragraph, and tutorial item 7 keep their
      clickable `<a>` links in both languages, pointing at the right URLs.
- [ ] Plural works: a single-model unit shows "1 model" / "1 modèle",
      multi-model shows "N models" / "N modèles".
- [ ] Pasting garbage into the share link and hitting Import surfaces the
      translated "Could not find an Army Forge army ID…" alert.
- [ ] No `[i18n] missing key` warnings in the console during the above.
- [ ] Dark mode still works and the picker styles correctly in dark mode.
- [ ] What's intentionally NOT translated: BBCode output in the TTS preview
      textarea, unit / weapon / special-rule names from the Army Forge API.

## Contributing translations

New README section documents how to submit a translation fix (PR against the
relevant `.yaml`) and how to propose a new language (open an issue first so we
can agree on the language code + flag and wire up the picker).
```
