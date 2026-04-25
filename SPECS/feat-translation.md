## Overview

Add a working translation (i18n) layer to the app so UI copy can be shown in multiple languages. The app already contains a **half-finished first attempt** at this (started by a previous developer, abandoned partway):

- `src/i18n.ts` — a hand-written JS object with English strings under flat/nested keys, plus an empty `de: {}` stub.
- `src/usei18n.tsx` — a custom `usei18n()` hook that reads `tombolaopraftotts_currentLanguage` from localStorage and exposes a `t(key)` helper that does `_.get(currentLanguage, key)` against that object. Returns the literal string `"[[MISSING TRANSLATION]]"` on a miss.
- `src/components/LanguagePicker.tsx` — a fully-built flag-based picker (en, de, pl, pt-br, tr) that writes to the same localStorage key. It is imported in `App.tsx` but **commented out** (line 55).
- Only two components actually call `t()` today: `Tutorial.tsx` (one key — the summary line) and `OutputOptions.tsx` (18 keys covering the boolean config rule names/labels). **Every other string in the app is still a hardcoded English literal in JSX.**

The goal of this ticket is to "catch up" that abandoned work: pick the right foundation going forward (custom vs. a mainstream React i18n library), adopt YAML-backed locale files per the ticket, migrate the two existing `t()` callsites, convert the remaining hardcoded copy, and turn the existing `LanguagePicker` back on next to the dark/light mode button.

## Requirements

### R1 — Locale file format
- Translation sources MUST be YAML files (one file per language), to support comments and structured data.
- Files live under a single directory (proposed: [src/locales/](src/locales/), see Open Questions Q6).
- Naming: `<lang-id>.yaml`, e.g. `en.yaml`, `de.yaml`, `pl.yaml`, `pt-br.yaml`, `tr.yaml`, `fr.yaml`.
- YAML may be nested; the existing key shape in [src/i18n.ts](src/i18n.ts) (e.g. `ttsOutputConfiguration1.name`) MUST be expressible unchanged.

### R2 — Framework choice
- **Decided: react-i18next** (+ `i18next`, `i18next-browser-languagedetector`, and a Vite YAML plugin). Rationale in **Technical Considerations → Library research** below. The existing custom `usei18n` hook and [src/i18n.ts](src/i18n.ts) will be removed.

### R3 — Markup API for translated strings
- Components consume translations via `const { t } = useTranslation()` from react-i18next — the library-idiomatic form.
- For strings containing embedded JSX (anchor tags mid-sentence in [Tutorial.tsx](src/components/Tutorial.tsx) and [App.tsx](src/App.tsx)), use the `<Trans>` component with indexed placeholders (e.g. `<0>Army Forge</0>`). Confirmed.
- Simple variable interpolation (e.g. `"Model Definition {{n}}"`) MUST work. No current string needs it, but adding i18n without interpolation is a footgun.
- Pluralisation is **not** a hard requirement (no current strings need it); react-i18next supports it natively if we need it later.

### R4 — Language picker UI
- The language picker UI MUST live next to the dark/light-mode switch in the app header ([src/App.tsx:53-56](src/App.tsx#L53-L56)).
- UX stays as-is: the existing "expanding stack of flag buttons" pattern in [src/components/LanguagePicker.tsx](src/components/LanguagePicker.tsx) is kept, just rewired to react-i18next.
- Selection MUST persist across reloads (localStorage).
- The picker's internal logic changes from `setCurrentLanguageId(id)` (writes to localStorage directly) to calling `i18n.changeLanguage(id)` and reading the active language from `i18n.language`. Persistence is delegated to `i18next-browser-languagedetector` configured to use the existing localStorage key (see Q10).

### R5 — Supported languages at ship time
- **Decided: `en` and `fr` only.** The previous developer's `de / pl / pt-br / tr` options in [LanguagePicker.tsx](src/components/LanguagePicker.tsx) are dropped — they were never populated anyway.
- English is the source/reference language and MUST be complete.
- `fr.yaml` MUST exist and be populated with French translations at ship time. (Translation source — machine translation is acceptable for a first pass; flag for native-speaker review later.)
- Implications for [LanguagePicker.tsx](src/components/LanguagePicker.tsx):
  - Trim the `LANGUAGES` array from 5 entries to 2 (`en`, `fr`).
  - Remove unused flag imports: `GermanyFlag`, `PolandFlag`, `BrazilFlag`, `TürkiyeFlag`.
  - **Add a new `FranceFlag` component** to [src/components/icons.tsx](src/components/icons.tsx) — no France flag icon exists today.
  - The four unused flag components in [icons.tsx](src/components/icons.tsx) may be left in place (they are harmless, and might be re-added later) OR deleted as dead code — confirm preference (see Q12).

### R6 — String extraction scope
- ALL user-facing English strings in the following files MUST be moved into locale files:
  - [src/App.tsx](src/App.tsx) — title, share-link label, tl;dr paragraph, button labels, inline-options legend + checkbox label, per-unit labels, per-model labels, tooltips, TTS preview label, "Generate shareable link for TTS", "Copy and paste the link below…".
  - [src/components/Tutorial.tsx](src/components/Tutorial.tsx) — body is currently 100% hardcoded despite keys (`tutorialInstruction1`..`tutorialInstruction7`, `hint`, `hintInstruction1`) already existing in [src/i18n.ts](src/i18n.ts). This file is the poster child for the abandoned migration.
  - [src/components/OutputOptions.tsx](src/components/OutputOptions.tsx) — colour picker labels, the five "Model … Output Colour" blocks, "Save & Load TTS Output Configs" header + descriptor, button labels, "Load Custom Configs", "You have no saved TTS output configs" empty state. (Boolean-rule names/labels already flow through `t()`.)
  - [src/components/OutputFAQ.tsx](src/components/OutputFAQ.tsx) — summary + bullet.
  - [src/Maintenance.tsx](src/Maintenance.tsx) — both strings.
  - [src/utils.tsx:137,149,171](src/utils.tsx#L137) — the three `alert()` error messages ("Could not find an Army Forge army ID…", "Army Forge failed to export list. Sorry!", "Failed to fetch common rules. Sorry!"). These are called from non-React code, so they use `i18next.t()` directly (no hook). The variable parts of the messages (`data?.error`, `commonRulesData?.error`) are raw API payloads and stay untranslated.
- Strings that MUST NOT be translated:
  - BBCode output from [src/utils.tsx → generateUnitOutput](src/utils.tsx) — feeds the TTS mod, which expects specific tokens.
  - Army Forge API payload content (unit names, special-rule names, weapon names) — not our content.
  - [src/components/VersionHistory.tsx](src/components/VersionHistory.tsx) — **explicitly out of scope.** Confirmed with user: this component is never imported/rendered anywhere (verified via grep). It is effectively dead code. Do not translate it, do not spend effort on it. Deletion of the file as dead code is a separate decision (see Q13) but not required by this ticket.

### R7 — Missing-translation behaviour
- **Decided.** When a key is missing in the selected language, fall back to English (react-i18next default `fallbackLng: "en"`).
- If a key is missing in *both*, render the key itself as the visible string (react-i18next default). Additionally wire `missingKeyHandler` / `saveMissing` so that in dev a `console.warn` fires. The `"[[MISSING TRANSLATION]]"` placeholder is gone.

### R8 — Type-safe keys
- **Decided: in scope.** TypeScript MUST error on `t("non.existent.key")` at compile time via react-i18next's `CustomTypeOptions` module augmentation (keys inferred from the structure of `en.yaml`). The current `t(key: string)` signature is fully untyped.

## Technical Considerations

### Library research (for R2)

| Option | YAML | Nested keys | Rich text / inline JSX | Interpolation / plurals | TS key safety | Bundle |
| --- | --- | --- | --- | --- | --- | --- |
| **Keep custom `usei18n`** | yes (via vite yaml plugin) | yes already | **no** — `t()` returns string only, can't embed `<a>` safely without `dangerouslySetInnerHTML` | would need to build it | possible via `as const` + template-literal types, but non-trivial | ~0 kB |
| **react-i18next** | yes (via vite yaml plugin or `i18next-resources-to-backend`) | yes | **yes** — `<Trans>` component preserves inline JSX | built in (ICU-lite interpolation + CLDR plurals) | first-class via module augmentation of `CustomTypeOptions.resources` | ~12–15 kB gz runtime |
| **react-intl / FormatJS** | needs conversion; ICU messages are flat | **no** (flat keys only — would be a bigger migration from the current nested shape) | yes (`<FormattedMessage>`) | yes (real ICU) | via babel/swc plugin | ~30 kB gz |
| **LinguiJS** | no native YAML | yes | yes (`<Trans>`) | yes (ICU) | strong, via macros + codegen | ~5–8 kB gz + build step |

**Recommendation: react-i18next.**
- It's the de-facto standard for React in 2026, widest plugin ecosystem, actively maintained.
- Its nested-key model is a 1-to-1 fit for the shape already in [src/i18n.ts](src/i18n.ts), so no key-rename migration.
- `<Trans i18nKey="...">` is the clean answer to the Tutorial/App.tsx problem of English sentences with embedded `<a>` tags — the custom `t()` can't solve that without abandoning type safety.
- YAML loading is one Vite plugin ([@rollup/plugin-yaml](https://www.npmjs.com/package/@rollup/plugin-yaml) or [vite-plugin-yaml](https://www.npmjs.com/package/@modyfi/vite-plugin-yaml)) — import `.yaml` as a JS object at build time, no runtime parsing cost.
- Type-safe keys via `declare module "react-i18next"` + `CustomTypeOptions` (see [react-i18next type-safety docs](https://react.i18next.com/latest/typescript)).

Trade-offs accepted:
- +~15 kB gz runtime (small vs. React itself at ~45 kB gz).
- One new bit of team knowledge. But this is a widely-known library, not a bespoke abstraction.

### Existing code to touch
- Delete / replace: [src/i18n.ts](src/i18n.ts), [src/usei18n.tsx](src/usei18n.tsx). The `t(key)` callsites in [src/components/Tutorial.tsx](src/components/Tutorial.tsx) and [src/components/OutputOptions.tsx](src/components/OutputOptions.tsx) would change from `usei18n()` to `useTranslation()` (assuming react-i18next); the keys themselves survive unchanged.
- Uncomment [src/App.tsx:55](src/App.tsx#L55) to re-enable `<LanguagePicker />`.
- Refactor [src/components/LanguagePicker.tsx](src/components/LanguagePicker.tsx) to drive `i18n.changeLanguage(id)` (react-i18next API) instead of only writing to localStorage. Keep the localStorage write (or let `i18next-browser-languagedetector` handle it — the localStorage key name would need to be preserved for existing users, see Open Questions Q10).
- Add a new init entry-point (e.g. `src/i18n/index.ts`) that calls `i18next.use(initReactI18next).init({...})` with YAML imports, referenced once from [src/main.tsx](src/main.tsx) before `ReactDOM.render`.

### Relevant types

None of the existing types describe translations — the object in `i18n.ts` is implicit shape. After migration:

```ts
// src/i18n/index.ts — drives type inference
import en from "./locales/en.yaml";

export const resources = {
  en: { translation: en },
  de: { translation: de },
  // ...
} as const;

// src/i18n/react-i18next.d.ts — module augmentation for key safety
declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
```

This makes `t("tutorialHeader")` compile and `t("xutorialHeader")` a type error, *if* we adopt the library recommendation and enable strict mode.

### Other considerations

- **Maintenance-mode path**: [src/main.tsx](src/main.tsx) renders `<Maintenance />` before the i18n provider would mount, so Maintenance.tsx either (a) stays English-only, or (b) the i18n init has to happen above both branches. Recommend (b).
- **Vite yaml plugin must be added to `vite.config.ts`** and types need to be declared (`declare module "*.yaml"` in `vite-env.d.ts`).
- **No test harness exists** in the project (vitest is installed but unwired per [CLAUDE.md](CLAUDE.md)), so "acceptance" will be manual / visual.
- **SSR / hydration**: N/A — Vite SPA, client-only.
- **RTL languages**: none of the proposed languages need RTL; can be ignored.

## Related Systems and Tasks

- [CLAUDE.md](CLAUDE.md) — data flow and deploy notes; no existing system doc for i18n.
- [src/i18n.ts](src/i18n.ts), [src/usei18n.tsx](src/usei18n.tsx), [src/components/LanguagePicker.tsx](src/components/LanguagePicker.tsx) — the abandoned first attempt, this ticket's starting point.
- `tts_lua_code/mod.lua` — consumer of the generated BBCode; NOT affected (see R6 exclusions).

## Open Questions

All resolved.

- ~~**Q1. Custom hook vs. react-i18next?**~~ → react-i18next.
- ~~**Q2. Which languages at launch?**~~ → `en` and `fr` only.
- ~~**Q3. Missing-key fallback.**~~ → Fall back to `en`, then to the key itself. Dev-only `console.warn` via `missingKeyHandler`.
- ~~**Q4. Rich-text strings.**~~ → `<Trans>` with indexed placeholders.
- ~~**Q5. Picker UX.**~~ → Keep existing expanding flag-stack, just rewire to react-i18next.
- ~~**Q6. Locale file directory.**~~ → `src/locales/`.
- ~~**Q7. Strict key typing?**~~ → Yes — enable `CustomTypeOptions`.
- ~~**Q8. Translate `alert()` messages?**~~ → Yes, all three (static prefix only; raw API error suffix untranslated).
- ~~**Q9. Translate VersionHistory?**~~ → No. Out of scope.
- ~~**Q10. localStorage key preservation.**~~ → Keep existing `tombolaopraftotts_currentLanguage` via `i18next-browser-languagedetector` config. Users with a stored value outside `en`/`fr` will be reset to detected default — acceptable.
- ~~**Q11. First-visit default language.**~~ → Detect from `navigator.language`, fall back to `en`.
- ~~**Q12. Dead flag icons in icons.tsx.**~~ → **Keep them.** User intends to re-introduce those languages eventually. Do NOT delete `GermanyFlag` / `PolandFlag` / `BrazilFlag` / `TürkiyeFlag`.
- ~~**Q13. Delete VersionHistory.tsx?**~~ → Yes. Confirmed unreferenced dead code. Deletion included in this ticket's scope.

## Acceptance Criteria

- **AC1** — Running `npm run dev`, the language picker is visible next to the dark-mode toggle in the header and is no longer commented out in [src/App.tsx](src/App.tsx).
- **AC2** — Clicking the picker opens a selection UI; choosing a language immediately re-renders the app's copy in that language without a full reload. Selection survives a page refresh.
- **AC3** — Every user-facing string listed in R6 is driven by the translation layer (grep for English literals in the R6 file list returns only (a) BBCode output, (b) identifiers, (c) allowed exclusions per R6).
- **AC4** — All locale source files are YAML (not JSON / not JS), and live in the agreed directory per Q6.
- **AC5** — With the selected language set to one whose YAML is missing a key, the UI shows the English string for that key (per R7). With the key missing in both, the UI shows the key itself and a `console.warn` fires in dev.
- **AC6** — A string with embedded JSX (e.g. the App.tsx tl;dr paragraph) renders correctly in the translated language with its anchor tags intact and clickable.
- **AC7** — `npm run build` passes (typecheck + vite build). If R8/Q7 is adopted, introducing a typo in a `t()` key fails the typecheck.
- **AC8** — No regression: every existing `t()` callsite in [Tutorial.tsx](src/components/Tutorial.tsx) and [OutputOptions.tsx](src/components/OutputOptions.tsx) still resolves to the same English strings.

## Implementation Notes

Rough order of work, assuming the react-i18next + YAML direction is approved:

1. Install deps: `react-i18next`, `i18next`, `i18next-browser-languagedetector`, `@modyfi/vite-plugin-yaml` (or `@rollup/plugin-yaml`). Register the YAML plugin in [vite.config.ts](vite.config.ts).
2. Create `src/locales/en.yaml` by porting every key from [src/i18n.ts](src/i18n.ts) and adding all the new strings needed for R6 extraction. Create empty/stub files for the other languages per Q2.
3. Create `src/i18n/index.ts` (init) and `src/i18n/react-i18next.d.ts` (type augmentation per Q7).
4. Mount i18n init in [src/main.tsx](src/main.tsx) above both Maintenance and App branches.
5. Delete [src/i18n.ts](src/i18n.ts) and [src/usei18n.tsx](src/usei18n.tsx). Migrate the two `t()` callsites to `useTranslation()`.
6. Rewrite [src/components/LanguagePicker.tsx](src/components/LanguagePicker.tsx) to use `i18n.changeLanguage()` and drive its label off `i18n.language`. Uncomment it in [App.tsx:55](src/App.tsx#L55).
7. File-by-file extraction pass for R6. `Tutorial.tsx` first (keys already defined), then `App.tsx`, then `OutputOptions.tsx`, then `Maintenance.tsx` / `OutputFAQ.tsx`. Each step: move literals to `en.yaml`, replace JSX with `t()` or `<Trans>`, verify visually.
8. Decide per-file whether rich text needs `<Trans>` vs. plain `t()`.
9. Final pass: grep remaining English literals in listed files, justify or extract.

Out of scope for this ticket (explicit):
- Translating BBCode / TTS output.
- Translating Army Forge API-sourced content.
- Building a translator tooling / CMS pipeline.
- Native-speaker review of machine-translated French copy (flag as a post-launch task).
- Adding languages beyond `en` and `fr`.

In scope that might look tangential but isn't:
- **Deletion of [VersionHistory.tsx](src/components/VersionHistory.tsx)** — per Q13, it's unreferenced dead code. Remove the file.
- **Keeping** the four flag icons (`GermanyFlag` / `PolandFlag` / `BrazilFlag` / `TürkiyeFlag`) in [icons.tsx](src/components/icons.tsx) — per Q12, they will be reused when those languages are added later.

---
*This specification is ready for implementation. Use `/task feat-translation` to begin development.*
