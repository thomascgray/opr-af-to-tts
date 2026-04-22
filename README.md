# OPR Army Forge → TTS Web Tool

> A tool for taking One Page Rule's armies from OPR's [Army Forge](https://army-forge.onepagerules.com/), and importing them into [Table Top Simulator](https://store.steampowered.com/app/286160/Tabletop_Simulator/)

> Used in conjunction with the [OPR AF to TTS Importer](https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810) TTS mod

[![Netlify Status](https://api.netlify.com/api/v1/badges/66365931-6097-45bb-81c7-0c9abd04994f/deploy-status)](https://app.netlify.com/sites/opr-af-to-tts/deploys)

## https://opr-af-to-tts.netlify.app/ <- Use the app right here!

# What is this?

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/O7ERtMcB8NQ/0.jpg)](https://www.youtube.com/watch?v=O7ERtMcB8NQ)

_5 min walkthrough of the app_

This is a web tool which allows you to take armies from OPR's Army Forge, and assign model loadouts and equipment definitions.

From there, your loadout can be exported and then imported into Tabletop Simulator, providing you with an easy interface to assign stats and rules to your models.

# Doing local development

### Prerequisites

- Node 20 or 22 (repo is known-good on Node 22.14).

### Setup

1. `npm install`.
2. Copy `.env.example` to `.env`.
3. (Optional) Add Turso libSQL credentials to `.env` if you want saved lists to hit the real database:

   ```
   TURSO_DB_URL=libsql://<your-db>-<org>.<region>.turso.io
   TURSO_AUTH_STRING=<token>
   ```

   Without these, the app still works end-to-end using an in-memory fallback — see below.

### Running

- `npm run netlify:dev` — full local stack on `http://localhost:8888`. Use this for any feature that exercises the `/.netlify/functions/*` endpoints (Army Forge import, `save-list`).
- `npm run dev` — frontend only via Vite. Calls to `/.netlify/functions/*` will fail, so this is only useful for pure UI work.
- `npm run build` — typechecks with `tsc` and produces a production bundle in `dist/`.

### Running without Turso env vars (fallback mode)

If `TURSO_DB_URL` / `TURSO_AUTH_STRING` aren't set, `save-list` stores generated lists in a module-scoped in-memory map instead of the DB. The share URL you get back (`http://localhost:8888/.netlify/functions/save-list?listId=…`) is hittable in the browser and returns the same JSON shape the real DB path would return, so you can eyeball the output.

Caveats:

- Entries are lost when `netlify dev` restarts.
- The URL points at `localhost`, so it is **not** usable from the TTS Lua mod — round-tripping through Tabletop Simulator needs a real Turso database.

# Contributing translations

The app is translated via [react-i18next](https://react.i18next.com/). Each supported language has its own YAML file under [`src/locales/`](src/locales/):

- [`en.yaml`](src/locales/en.yaml) — English. This is the **source of truth**. New keys are added here first; every other language falls back to English for anything missing.
- [`fr.yaml`](src/locales/fr.yaml) — French.

### Fixing or improving an existing translation

1. Fork the repo.
2. Edit the relevant `.yaml` file in [`src/locales/`](src/locales/). Keep the key structure identical to `en.yaml` — only change the string values on the right-hand side.
3. Preserve any `<0>`, `<1>`, … placeholders and `{{variable}}` interpolations exactly as they appear in English. They are how inline links and dynamic values are rendered.
4. If you can, run `npm run dev`, switch to your language via the picker in the top-right, and eyeball the app. At minimum, `npm run build` must pass.
5. Open a PR against `main` describing what you changed. Please cite a source for anything non-obvious (e.g. wargaming terminology).

### Adding a new language

Please **open an issue first** before starting work on a new language. This is so we can:

- Agree on the language code (e.g. `de`, `pt-br`, `es`) and flag icon.
- Check that nobody else is already mid-way through the same translation.
- Wire up the language picker on our side — adding a language involves a couple of small code changes beyond just the YAML file, so it's not purely content work.

Once an issue is agreed, the PR itself should:

1. Add `src/locales/<code>.yaml`, mirroring the full key structure of `en.yaml`.
2. Register the new language in [`src/i18n/index.ts`](src/i18n/index.ts) (`SUPPORTED_LANGUAGES` + `resources`) and in [`src/components/LanguagePicker.tsx`](src/components/LanguagePicker.tsx) (`LANGUAGES`, with its flag icon).
3. Add the flag icon to [`src/components/icons.tsx`](src/components/icons.tsx) if one doesn't already exist.

---

Thanks to Army Forge and its developers for support in making this tool possible, and to users over on the OPR Discord for their valuable feedback.
