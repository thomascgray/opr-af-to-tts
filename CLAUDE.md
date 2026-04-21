# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server for the frontend only (Netlify functions won't run; `/.netlify/functions/*` calls will fail).
- `npm run netlify:dev` — Full local stack via `netlify dev`; required whenever you exercise the Army Forge import or the save-list flow.
- `npm run build` — `tsc` typecheck followed by `vite build`. Treat this as the lint/typecheck gate; there is no separate lint script.
- `npm run preview` — Serve the production `dist/` locally.

`vitest` is installed but no test script is wired up and there are no test files in the tree — do not assume a test harness exists.

## Architecture

This is a Vite + React 18 + TypeScript SPA (Tailwind for styling) with two Netlify Functions as the backend. The whole app is a single-page flow that transforms an OPR Army Forge army list into BBCode-tagged name/description strings the companion Tabletop Simulator mod (`tts_lua_code/mod.lua`) can consume.

### Data flow (end-to-end)

1. User pastes an Army Forge share link into `App.tsx`.
2. `onGenerateDefinitions` (`src/utils.tsx`) extracts the army id + beta flag from the URL (`extractIdFromUrl`) and calls `/.netlify/functions/get-army?armyId=…&isBeta=…`.
3. That function (`netlify/functions/get-army/get-army.ts`) proxies to either `army-forge.onepagerules.com/api/tts` or `army-forge-beta.onepagerules.com/api/tts` — it exists purely to sidestep CORS. The same endpoint also fetches core/common special rules when called with `commonRulesId` instead of `armyId`.
4. The response is mapped into the app's own domain types (`iUnitProfile[]` in `src/types.ts`) and written to the valtio proxy `state` in `src/state.ts`. Each unit starts with one "generated" model; users duplicate/edit to produce distinct model definitions.
5. `generateUnitOutput` (in `src/utils.tsx`) produces the BBCode name + description preview per model, using colours/toggles from `state.ttsOutputConfig`.
6. `onGenerateShareableId` POSTs the aggregated `iTotalShareableOutput` to `/.netlify/functions/save-list`, which stores it in Turso (libSQL). The `shareableLinkForTTS` points at the **GET** of the same function; the TTS Lua mod fetches it by id.

### State

- Single valtio proxy in `src/state.ts` (`state`). Components read via `useSnapshot(state, { sync: true })`. Mutations go through named helpers (`updateWeaponQuantity`, `duplicateModel`, `deleteModel`, …) or direct assignment inside the utility functions. There is no Redux/context layer.
- `iAppState` in `src/types.ts` is the source of truth for state shape; `src/army-forge-types.ts` mirrors the upstream Army Forge API shapes and is intentionally separate.

### Army Forge beta

The beta switch is derived from the URL string itself (`url.includes("army-forge-beta.onepagerules.com")`) and threaded through as a query param to `get-army`. Both code paths (list + common rules) must honour it — see the two branches in `get-army.ts`.

### save-list / persistence fallback

`save-list.ts` uses Turso via `@libsql/client`, reading `TURSO_DB_URL` and `TURSO_AUTH_STRING` from env. If either is missing it falls back to a **module-scoped in-memory `Map`** so POST/GET still round-trip during `netlify dev`. The share URL the client produces (`localhost:8888/.netlify/functions/save-list?listId=…`) is hittable in a browser and returns the same `{ listId, listJson }` shape as the real DB path — use it to sanity-check the generated JSON locally. Entries are lost when the `netlify dev` process restarts, and the URL isn't reachable by the TTS Lua mod, so this is strictly a dev aid, not a production share mechanism.

### TTS output (`generateUnitOutput`)

This single function in `src/utils.tsx` is the bulk of the logic and is deliberately dense. It merges special rules from three sources (unit-level, loadout items' own rules, and nested `content[]` from `ArmyBookItem` upgrades), dedupes by `key || name`, sums Tough/Caster ratings, and emits `[colour]...[-]` BBCode using the colour hexes from `ttsOutputConfig`. The Army Forge type definitions lie about some shapes (items can have `content`, loadouts sometimes have no `id` or `key`) — the existing `@ts-ignore` comments and inline history comments (dated) explain *why* specific fallbacks exist. Preserve those fallbacks unless you've verified against live Army Forge data.

### Environment variables

- `VITE_IS_MAINTENANCE_MODE` (frontend, checked in `src/main.tsx`) — when `'true'`, renders `Maintenance.tsx` instead of the app.
- `TURSO_DB_URL`, `TURSO_AUTH_STRING` (Netlify Function, `save-list`) — libSQL credentials; absence triggers the localStorage fallback described above.

### Deployment

Deploys to Netlify (`opr-af-to-tts.netlify.app`). There is no `netlify.toml` checked in — Netlify auto-detects Vite + the `netlify/functions/` directory.
