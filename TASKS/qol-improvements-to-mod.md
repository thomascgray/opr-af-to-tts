# qol-improvements-to-mod

**Status**: In Progress

## Overview

Implement four QoL improvements to the TTS mod per `SPECS/qol-improvements-to-mod.md`:

1. **R1** — Inline `[-]` / `[+]` buttons on each stat bar (HP / SP).
2. **R2** — Close the right-click context menu after "Toggle Menu" is clicked.
3. **R3** — New "UI Toggles" bottom-row section in the action panel (HP bar / SP bar visibility, conditional, unit-wide).
4. **R4** — New "UI Config" bottom-row section in the action panel (Menu ▲ / Menu ▼ buttons wired to existing `moveMenuUp` / `moveMenuDown`).

## Task Context

- Full spec: `SPECS/qol-improvements-to-mod.md`.
- Mod architecture reference: `CLAUDE/mod-context.md` (**note: stale** — describes removed `^` toggle bar and removed close-on-click for Activated/Stunned/Shaken; needs updating as part of this task).
- TTS Object UI patterns: `CLAUDE/tts-lua-api-learnings.md` (positioning math, `Wait.frames` pattern, `self.UI.show/hide/setAttribute`).
- Target file: `tts_lua_code/mod.lua`. Key line refs:
  - `buildActionPanelXml` at [mod.lua:598](tts_lua_code/mod.lua#L598) — the single site that builds all Object UI XML.
  - `rebuildContext` at [mod.lua:543](tts_lua_code/mod.lua#L543) — right-click menu builder; change arg to close menu.
  - `toggleUnitStatus` at [mod.lua:154](tts_lua_code/mod.lua#L154) — template for unit-wide fan-out; needs adapting because it doesn't call `rebuildActionPanelXml`.
  - `assignNameAndDescriptionToObjects` at [mod.lua:901](tts_lua_code/mod.lua#L901) — memo initialisation for newly assigned models.
  - `moveMenuUp`/`moveMenuDown` at [mod.lua:507](tts_lua_code/mod.lua#L507) — reused by R4 onClick.
- Lua, not TypeScript — no `npm run build` typecheck covers `mod.lua`. Validation is in-TTS only. Syntax-only validation possible via manual review.
- Memo read defensive pattern (required for pre-existing models):
  ```lua
  local show = decodedMemo['showHpBar']
  if show == nil then show = true end
  ```
  Not `val or true` (would coerce `false` → `true`).

## Blockers/Issues

None currently. (`selectAllUnit` bug fixed 2026-04-22 — see Work Log.)

## TODO

- [X] **R2 (simplest first):** flip `addContextMenuItem` third arg for "Toggle Menu" from `true` to `false` so the right-click menu closes on click.
- [X] **Memo init:** add `showHpBar = true`, `showSpBar = true` to the `JSON.encode` block in `assignNameAndDescriptionToObjects`.
- [X] **R1:** rewrite the HP stat bar Panel to wrap its Text in a HorizontalLayout with `[-]` / `[+]` buttons wired to `hpDown` / `hpUp`.
- [X] **R1:** same for the SP stat bar — `[-]` / `[+]` buttons wired to `spellTokensDown` / `spellTokensUp`.
- [X] **R1:** confirm stat-bars-panel width grows as needed without breaking layout. *(Bumped from 100 to 150.)*
- [X] **R3:** gate HP bar rendering on both `hasTough` AND `showHpBar` (with nil-safe default `true`).
- [X] **R3:** gate SP bar rendering on both `hasCaster` AND `showSpBar` (with nil-safe default `true`).
- [X] **R3:** add `toggleHpBar` / `toggleSpBar` per-model functions with unit-wide fan-out (update memo on every unit mate, call `rebuildActionPanelXml` on every mate). *(Extracted common helper `toggleUnitUiFlag`.)*
- [X] **R3:** append "UI Toggles" section to the action panel XML, with Toggle HP Bar / Toggle SP Bar buttons (each only rendered if the unit has that stat).
- [X] **R4:** append "UI Config" section to the action panel XML below UI Toggles, with Menu ▲ / Menu ▼ buttons wired to existing `moveMenuUp` / `moveMenuDown`.
- [X] **Panel height:** recalculate the action panel root Panel `height` attribute (`320` → `480`); shift `actionPanelZ` offset (`310` → `390`) to keep the panel's bottom edge anchored above the stat bars.
- [X] **Docs:** update `CLAUDE/mod-context.md` — remove references to the `^` toggle bar; correct close-on-click behaviour for Activated/Stunned/Shaken; add entries for `showHpBar` / `showSpBar` memo fields, inline HP/SP buttons, and the UI Toggles / UI Config rows.
- [ ] **Verification (user-side, in TTS):** confirm arrow glyphs (▲ ▼) render correctly; confirm all buttons are hit-targetable; confirm toggles persist across save-reload; confirm backward-compatibility with pre-existing (pre-upgrade) assigned models; confirm action panel doesn't clip into stat bars with the new height/offset.
- [X] **Right-click menu overhaul (post-spec, 2026-04-22):** remove `Menu Up` / `Menu Down` from the right-click menu (now only in the action panel's UI Config row). Add back the most-used in-game toggles as close-on-click entries: `Activated`, `Shaken` (traditional systems only), `Stunned` (skirmish systems only), `Measuring`.
- [X] **Fix `selectAllUnit` (new; out-of-scope for this task but captured here):** root cause was a TTS callback shape mismatch — context-menu callbacks pass a color string but Object UI Button `onClick` passes a Player object. `addToPlayerSelection` needs a color string, so the button path silently failed. Fixed by normalizing the arg inside the function.
- [X] **Measuring context-menu entry stays open (2026-04-22):** flipped `keep_open` back to `true` for the Measuring right-click item — cycling is inherently repeated, so keeping the menu open matches the Menu Up/Down pattern.
- [X] **Unit-wide measuring ring colour (2026-04-22):** added `measuringRingColor` memo field (defaults to `{1,1,1}` white), 5 preset colour buttons (white/red/green/blue/yellow) in a new "Measuring Ring Colour" row in the action panel, fan-out helper that updates every unit mate's memo and calls `rebuildStatusEffectThings`. Colour is read from memo at the top of `rebuildStatusEffectThings` so existing draw logic picks it up automatically.
- [X] ~~**(Potential follow-up) In-world text labels on measuring rings**~~: superseded — user chose the simpler "floating stat-bar line" approach instead (see work log 2026-04-22).
- [X] **Measuring radius stat-bar (2026-04-22):** render a third bar under HP/SP showing `Measuring X''` when `measuringCircle.radius > 0` and the new `showMeasuringBar` toggle is on. Text colour matches the ring colour. New "Measuring Bar" button in the UI Toggles row; UI Toggles row dropped its `hasTough or hasCaster` gate so it's always present. `cycleMeasuringRadius` and `measuringOff` now also call `rebuildActionPanelXml` so the number updates live.

## Work Log

### [2026-04-22] All spec requirements implemented

- Files modified: `tts_lua_code/mod.lua`, `CLAUDE/mod-context.md`.

**`tts_lua_code/mod.lua` changes:**

- **R2** ([mod.lua:542](tts_lua_code/mod.lua#L542)) — `addContextMenuItem("Toggle Menu", toggleActionPanel, true)` → `false`. Right-click menu now closes on click.
- **Memo init** ([mod.lua:919-920](tts_lua_code/mod.lua#L919-L920)) — added `showHpBar = true`, `showSpBar = true` to `assignNameAndDescriptionToObjects`' `JSON.encode` block.
- **New helper + toggle functions** ([mod.lua:275-300](tts_lua_code/mod.lua#L275-L300)) — `toggleUnitUiFlag` (fans out to unit mates and rebuilds the action panel on each), `toggleHpBar`, `toggleSpBar`. Nil-safe default-to-true logic built into the helper.
- **R1 stat bar rewrite** ([mod.lua:685-718](tts_lua_code/mod.lua#L685-L718)) — each bar Panel now wraps a HorizontalLayout with `[-]` button, Text, `[+]` button. `barBtnColors` constant added for the dark semi-transparent inline button style. Stat-bars-panel width `100` → `150`.
- **R3 gate** ([mod.lua:685](tts_lua_code/mod.lua#L685)) — introduced `showHp = hasTough and showHpBar` / `showSp = hasCaster and showSpBar`; used consistently for bar rendering and `barCount` height calc so a hidden bar contributes no space.
- **R3 UI Toggles row + R4 UI Config row** ([mod.lua:729-759](tts_lua_code/mod.lua#L729-L759)) — built as conditional `uiTogglesXml` and always-on `uiConfigXml`; injected into the action panel's outer VerticalLayout after the three-column panel ([mod.lua:783-784](tts_lua_code/mod.lua#L783-L784)).
- **Height adjustment** — action panel `height="320"` → `height="480"` ([mod.lua:765](tts_lua_code/mod.lua#L765)); `actionPanelZ` offset `310` → `390` ([mod.lua:641](tts_lua_code/mod.lua#L641)) to keep the bottom edge anchored.

**`CLAUDE/mod-context.md` changes:**

- Added `showHpBar` / `showSpBar` to the Model Memo State block with a callout on the nil-default-to-true pattern.
- Rewrote the "Action Panel UI System" section: removed the `^` toggle bar component; updated stat bar description to include inline `[-]/[+]` buttons and the visibility toggles; added UI Toggles row and UI Config row entries; corrected "close panel after action" to "none of the in-panel CTAs close the panel except X".
- Added Context Menu subsection describing the new `Toggle Menu` (closes) + `Menu Up`/`Menu Down` (stays open) behaviour.

Remaining work: user verification in-game (glyph rendering, clipping, save-reload persistence, pre-upgrade model compatibility).

### [2026-04-22] Right-click menu overhaul (post-spec tweak)

- File modified: `tts_lua_code/mod.lua` (`rebuildContext` at [mod.lua:567](tts_lua_code/mod.lua#L567)).

Rebalanced which actions live in the right-click menu vs the full action panel. Goal: keep the most-used in-game toggles one click away, move UI-adjustment controls into the action panel.

- **Removed from right-click:** `Menu Up`, `Menu Down`. These are now only in the action panel's UI Config row (added in this same task).
- **Added to right-click** (all close the right-click menu via `keep_open=false`):
  - `Activated` — `toggleActivated` (unit-wide).
  - `Shaken` — `toggleShaken` (traditional systems only — gated on `isTraditionalSystem(gameSystem)`).
  - `Stunned` — `toggleStunned` (skirmish systems only — gated on `isSkirmishSystem(gameSystem)`).
  - `Measuring` — `cycleMeasuringRadius` (cycles 3→6→9→12→18→24→30→off).
- `Toggle Menu` remains as the first entry.
- **Considered and dropped:** `Select All` was initially added but removed after confirming the in-menu Select All is itself broken. New TODO captured to fix `selectAllUnit` as a follow-up.

### [2026-04-22] Fix `selectAllUnit` in the action panel

- File modified: `tts_lua_code/mod.lua` ([mod.lua:314](tts_lua_code/mod.lua#L314)).

Root cause: TTS calls its callbacks with different first-argument shapes depending on where the callback is wired.

- **Context-menu callbacks** (`addContextMenuItem`): first arg is a color string (`"White"`, `"Red"`, …).
- **Object UI Button `onClick`**: first arg is a Player object (has `.color`, `.steam_name`, etc.).

The old `selectAllUnit` assumed string-only and passed the arg straight to `Object.addToPlayerSelection`, which requires a color string. The action-panel button path was silently broken because it was handing `addToPlayerSelection` a Player object. The right-click path (if it had been wired) would have worked, since that path actually does pass a string.

Fix: normalize the argument inside `selectAllUnit` — if it's not a string, treat it as a Player and read `.color`. Function now works from both callsites.

Not re-adding Select All to the right-click menu — user preference from earlier turn was to keep the right-click list short. The fix is scoped to the action panel button only.

### [2026-04-22] Measuring right-click stays open + unit-wide ring colour picker

- File modified: `tts_lua_code/mod.lua`.

**Right-click menu tweak** ([mod.lua:580](tts_lua_code/mod.lua#L580)): flipped `keep_open` back to `true` for the Measuring entry. The menu's a cycle — you want to click it multiple times without the menu dismissing after each.

**Unit-wide measuring ring colour** — added a colour picker to the action panel.

- **Memo field** ([mod.lua:949](tts_lua_code/mod.lua#L949)): `measuringRingColor = {1, 1, 1}` initialised on assignment. Defaults to white for pre-upgrade models via `or {1, 1, 1}` in the reader.
- **Reader** ([mod.lua:432-435](tts_lua_code/mod.lua#L432-L435)): `rebuildStatusEffectThings` now syncs `measuringCircle.color` from the memo field at the top of the function. Rest of the draw logic is unchanged — it reads `measuringCircle.color` as before.
- **Preset table + onClick handler** ([mod.lua:302-325](tts_lua_code/mod.lua#L302-L325)): `RING_COLOR_PRESETS` maps button `id` → `{r,g,b}` for 5 presets (white, red, green, blue, yellow). `setRingColor(player, value, id)` reads the id, fans out to all unit mates, and calls `rebuildStatusEffectThings` on each.
- **New "Measuring Ring Colour" row** in the action panel ([mod.lua:790-803](tts_lua_code/mod.lua#L790-L803)): placed between the three-column block and UI Toggles so gameplay-visual settings sit above UI-preference rows. 5 coloured 32x32 buttons using the same hex values as the `isShaken`/`isStunned`/SP/HP palette for consistency.
- **Height re-bump**: action panel `height="480"` → `height="560"` ([mod.lua:822](tts_lua_code/mod.lua#L822)); `actionPanelZ` offset `390` → `430` ([mod.lua:654](tts_lua_code/mod.lua#L654)) to keep the bottom edge anchored above the stat bars.

**Deferred**: in-world text labels on the measuring ring itself (render "9"" on the circle edge, as in the screenshot). Feasible via Object UI `Text` positioned at the ring's edge and repositioned on each radius cycle, but non-trivial. Captured as a follow-up TODO rather than scoped into this task.

### [2026-04-22] Measuring stat-bar line (replaces the in-world label idea)

- File modified: `tts_lua_code/mod.lua`.

Dropped the in-world label approach (complex Object UI positioning math on every radius change) in favour of a simpler third stat-bar line under HP/SP that reads `Measuring X''` — same floating-panel real estate the user's already looking at when they care about HP/SP.

**Memo** ([mod.lua:968](tts_lua_code/mod.lua#L968)): `showMeasuringBar = true` added to assignment memo. Nil-safe default handled in `buildActionPanelXml`.

**Toggle function** ([mod.lua:302-304](tts_lua_code/mod.lua#L302-L304)): `toggleMeasuringBar` reuses the existing `toggleUnitUiFlag` helper — flips unit-wide, rebuilds each mate's panel.

**Stat-bars panel** ([mod.lua:734-792](tts_lua_code/mod.lua#L734-L792)): extended to render a third bar when `measuringCircle.radius > 0` AND `showMeasuringBar`. Dark `rgba(0,0,0,0.85)` background; text colour set from `measuringRingColor` memo field (converted to hex in `ringColorHex` at the top of `buildActionPanelXml`). Panel width bumped `150` → `180` for the longer measuring text. Outer gate now `showHp or showSp or showMeasuring` — a model with no HP/SP still gets a stat-bars panel when it's actively measuring.

**UI Toggles row** ([mod.lua:794-813](tts_lua_code/mod.lua#L794-L813)): added a third button "Measuring Bar" (unconditional — any model can measure). Removed the `hasTough or hasCaster` gate from the row itself since there's now always at least one toggle to show. Button labels shortened: `"Toggle HP Bar"` → `"HP Bar"`, `"Toggle SP Bar"` → `"SP Bar"`, `"Measuring Bar"` — the row's own "UI Toggles" header already tells the user these are toggles, and the shorter labels fit in the 3-column `childForceExpandWidth="true"` layout.

**Live updates** ([mod.lua:444](tts_lua_code/mod.lua#L444), [mod.lua:552](tts_lua_code/mod.lua#L552)): `cycleMeasuringRadius` and `measuringOff` now call `rebuildActionPanelXml()` after `rebuildStatusEffectThings()` so the visible number updates as the radius cycles. `measuringOffArmy` inherits this automatically (it fans out via `measuringOff`).

**Context-menu Measuring entry** ([mod.lua:581](tts_lua_code/mod.lua#L581)): flipped `keep_open` back to `true` — cycling is a repeat action so the right-click menu should stay open.

No height change to the action panel — the UI Toggles row is still one row of buttons, just with three slots now.

### [2026-04-22] Measuring bar polish + UI Config rotate buttons

- File modified: `tts_lua_code/mod.lua`.

**Measuring-bar colour sync fix** ([mod.lua:320-321](tts_lua_code/mod.lua#L320-L321)): `setRingColor` was only calling `rebuildStatusEffectThings` on each unit mate, so the ring recoloured but the measuring-bar text (which is built by `buildActionPanelXml`) stayed on its old colour until the next radius change triggered a panel rebuild. Added a second `unitMate.call('rebuildActionPanelXml')` inside the fan-out loop.

**Transparent measuring-bar background** ([mod.lua:776](tts_lua_code/mod.lua#L776)): changed the bar Panel colour from `rgba(0,0,0,0.85)` to `rgba(0,0,0,0)`. Text floats on just the ring colour now. If readability against busy table surfaces becomes an issue, a TMPro outline is a drop-in fix (`outline="#000000"` / `outlineSize="1 -1"` on the Text).

**Rotate buttons in UI Config** ([mod.lua:832-835](tts_lua_code/mod.lua#L832-L835)): the `rotateMenuLeft` / `rotateMenuRight` functions already existed (they flip `menuRotationOffset`, which is already wired into the `menuRotation` string applied to every Object UI panel). Just added two buttons `Menu ↺` / `Menu ↻` to the UI Config row, sharing one `HorizontalLayout` with the existing `Menu ▲` / `Menu ▼`. `childForceExpandWidth="true"` redistributes the row across 4 slots automatically — no height change needed.

The whole stat-bars-panel + action-panel stack rotates together (both use `menuRotation`), which means the stat bars also spin with the rotation. Intentional — keeps the UI coherent regardless of how the model itself is oriented.

### [2026-04-22] Rotate axis fix: Y → Z

- File modified: `tts_lua_code/mod.lua` ([mod.lua:735](tts_lua_code/mod.lua#L735)).

Initial implementation put the rotation offset on the Y component of `menuRotation`. TTS Object UI uses a non-standard axis convention (documented in `CLAUDE/tts-lua-api-learnings.md`): X = left/right, Y = depth, Z = vertical (negative up). So offsetting Y was rotating the panel around its **depth** axis, producing a pinwheel tilt — not what the user wanted.

Fix: `menuRotation = "90 " .. (180 - rotationOffset) .. " 0"` → `menuRotation = "90 180 " .. rotationOffset`. Y stays at 180 (face viewer), offset goes to Z (rotation around vertical).

Rotation direction (↺ vs ↻) may need flipping depending on how TTS's Z axis spins — if the buttons feel backwards in-game, just swap the signs in `rotateMenuLeft`/`rotateMenuRight`.

### [2026-04-22] Rotate axis fix, attempt 2: Z → X

- File modified: `tts_lua_code/mod.lua` ([mod.lua:735](tts_lua_code/mod.lua#L735)).

Applying rotation offset to Y and to Z both rotated the panel around the same axis (depth-pinwheel), just in opposite directions. So neither Y nor Z is the vertical-spin axis in whatever TTS UI rotation convention applies here. By elimination, X is the remaining candidate. Moved offset to X: `menuRotation = (90 + rotationOffset) .. " 180 0"`. Testing in-game next.

If X also doesn't give a door-hinge rotation around vertical, the Euler triplet probably can't express the desired rotation directly, and we'll need to either bake the offset into a different place in the composition or abandon this UX path.

### [2026-04-22] Rotate axis fix, attempt 3: gimbal lock workaround (X=89)

- File modified: `tts_lua_code/mod.lua` ([mod.lua:735](tts_lua_code/mod.lua#L735)).

Attempt 2 (X offset) gave a third distinct rotation axis but still not the door-hinge yaw around vertical. User confirmed the previously-tried Y and Z gave the same depth-pinwheel axis in opposite directions — a classic sign of gimbal lock. At exactly X=90 (the tilt value), the Y and Z rotation axes align in world space, collapsing two degrees of freedom into one.

Fix: use X=89 instead of X=90 as the base tilt, and put the rotation offset back on Y. The 1° tilt is visually negligible, but it breaks the gimbal so Y rotation now rotates around world vertical (yaw / door-hinge), which is what the user wants.

Final formulation: `menuRotation = "89 " .. (180 + rotationOffset) .. " 0"`.

If the rotation direction feels backwards (clicking ↺ rotates clockwise), swap the `+15`/`-15` in `rotateMenuLeft` / `rotateMenuRight`.

### [2026-04-22] Rotate axis fix, attempt 4: nested-panel approach

- File modified: `tts_lua_code/mod.lua` ([mod.lua:733-859](tts_lua_code/mod.lua#L733-L859)).

X=89 didn't actually dodge the gimbal — back on the same pinwheel axis. All three Euler components tried: none gave a clean yaw from a single-component offset.

Following `CLAUDE/tts-lua-api-learnings.md`'s "Rotation for Billboard-Style Panels" section: the prescribed `"90 180 0"` is specifically calibrated to the object's own `setRotation({0, 180, 0})` at assignment. The Y=180 on the panel is compensating for the object's Y=180, not providing free yaw control. Adjusting that Y was fighting the compensation.

Fix: nest the action-panel in an outer "yaw wrapper" panel.

- **Outer** ([mod.lua:858](tts_lua_code/mod.lua#L858)) — carries `id="action-panel"` (show/hide still targets this), position, and **only** `rotation="0 rotationOffset 0"` (pure yaw). 380x560, matching inner.
- **Inner** ([mod.lua:859](tts_lua_code/mod.lua#L859)) — carries the billboard `rotation="90 180 0"`, and all the actual content (three-column block, ring colour row, UI Toggles, UI Config, close button). No id.

TTS composes nested panel transforms as quaternions internally: final orientation = outer_yaw * inner_billboard. That's mathematically exactly what we want, without hitting gimbal lock in any single Euler string.

`menuRotation` now just hard-codes `"90 180 0"` (doc pattern). `yawRotation` holds the user-adjustable offset on Y.
