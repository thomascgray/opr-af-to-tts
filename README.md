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

---

Thanks to Army Forge and its developers for support in making this tool possible, and to users over on the OPR Discord for their valuable feedback.
