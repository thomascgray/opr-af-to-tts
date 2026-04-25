# qol-improvements-to-mod

## Overview

A bundle of quality-of-life improvements to the TTS mod (`tts_lua_code/mod.lua`) around the per-model floating UI. This follows the recent removal of the `^` toggle bar (replaced with a "Toggle Menu" right-click option) and the removal of close-on-click behaviour from Activated/Stunned/Shaken.

Four improvements in scope:

1. **Inline HP/SP adjust buttons** — small `[-]` / `[+]` buttons rendered on either side of each stat bar, so users can nudge wounds/spell tokens without opening the full menu.
2. **Close the right-click context menu after "Toggle Menu"** — the existing "Toggle Menu" entry keeps the right-click menu open; flip it to close.
3. **"UI Toggles" row in the action panel** — new bottom-row section inside the action panel with per-bar visibility toggles (HP bar, SP bar), conditional on whether the unit has those stats.
4. **"UI Config" row in the action panel** — new bottom-row section (below UI Toggles) with in-panel Menu Up / Menu Down buttons that adjust the menu's vertical offset (mirrors the existing right-click entries).

No floating in-game toggle button is being re-introduced. With R2's right-click menu closing cleanly on "Toggle Menu", the right-click path is ergonomic enough on its own.

## Requirements

### R1 — Inline HP/SP adjust buttons

- Each visible stat bar (HP bar, SP bar) gains two small square buttons, one on each side of the current text.
  - Layout: `[-] HP: X/Y [+]` and `[-] SP: X/6 [+]`.
  - `[-]` decrements via the existing `hpDown` / `spellTokensDown` functions.
  - `[+]` increments via the existing `hpUp` / `spellTokensUp` functions.
- Buttons must be visually distinct from the bar background but not overwhelming — dark semi-transparent (e.g. `rgba(0,0,0,0.4)` normal, brighter on hover).
- Buttons must not break the rest of the stat bar — text stays centered, bar height stays consistent with the current 24px.
- The stat bars panel width may need to grow beyond the current `width="100"` to accommodate the buttons. Acceptable — parent panel is not width-constrained.
- Tapping `[-]` / `[+]` must **not** close or otherwise affect the main action panel state (matches current `hpUp`/`hpDown` behaviour, which calls `rebuildActionPanelXml` and that preserves `isActionPanelOpen`).
- The existing `HP +`, `HP -`, `SP +`, `SP -` buttons in the action panel's Model column are **kept** (intentional redundancy — the full menu still lists every option).

### R2 — Close the right-click menu after "Toggle Menu"

- The "Toggle Menu" entry added in `rebuildContext()` must close the right-click menu immediately after the click registers.
- Other right-click entries ("Menu Up", "Menu Down") must retain their current behaviour of keeping the menu open, since they're inherently used in repeated nudges.

### R3 — "UI Toggles" bottom-row section in the action panel

- Add a new horizontal row to the action panel, labelled **"UI Toggles"**, rendered below the existing three-column section (Model / Unit / Army).
- Row contents are conditional on the unit's stats:
  - **HP Bar toggle** — rendered only if `hasTough` is true. Flips the HP stat bar's visibility.
  - **SP Bar toggle** — rendered only if `hasCaster` is true. Flips the SP stat bar's visibility.
- If neither applies, the row is not rendered.
- Toggle scope: **unit-wide**. Flipping either toggle on one model flips it on every mate in the unit (same pattern as `toggleUnitStatus`), and every mate's action panel XML is rebuilt so the change is reflected immediately.
- State persists in the model's memo (fields: `showHpBar`, `showSpBar`). Defaults: both `true`.
- Existing models assigned before this change (missing these fields) must default to visible and must not error — reads must use `if val == nil then val = true end`, not `val or true`.
- Labels are **static** (e.g. "Toggle HP Bar", "Toggle SP Bar") — no show/hide state flipping in the label text. Simpler, and the state is already visible via the bar itself.

### R4 — "UI Config" bottom-row section in the action panel

- Add a second new horizontal row to the action panel, labelled **"UI Config"**, rendered below the "UI Toggles" row.
- Row contents: two buttons, **Menu ▲** (up) and **Menu ▼** (down), wired to the existing `moveMenuUp` and `moveMenuDown` functions.
- Behaviour matches the existing right-click "Menu Up" / "Menu Down": each click shunts `menuHeightOffset` by ±20 and rebuilds the panel XML so the UI floats up/down relative to the model.
- Clicking either button does not close the action panel (verified — `moveMenuUp/Down` end with `rebuildActionPanelXml`, which preserves `isActionPanelOpen`).
- The existing right-click "Menu Up" / "Menu Down" entries are **kept** (same redundancy principle as R1: full menu offers all options).

## Technical Considerations

This is Lua, not TypeScript — no TS types apply. The relevant "contracts" are the memo shape and the XML structure emitted by `buildActionPanelXml`.

### Memo shape — additions

Current memo fields relevant here (see [mod.lua:932-948](tts_lua_code/mod.lua#L932-L948) and `CLAUDE/mod-context.md`):

```lua
{
  isActivated, isShaken, isWavering, isStunned,
  gameSystem, unitId, armyId, unitName, nameToAssign,
  originalToughValue, originalCasterValue,
  currentToughValue, currentCasterValue,
  armyNameToAssign, unitColor,
  menuHeightOffset = 0,       -- lazy-added
  menuRotationOffset = 0,     -- lazy-added
}
```

New fields to add:

```lua
{
  showHpBar = true,   -- bool; controls HP stat bar visibility (ignored if !hasTough)
  showSpBar = true,   -- bool; controls SP stat bar visibility (ignored if !hasCaster)
}
```

Defaults are `true`. Pre-existing assigned models won't have these fields, so reads must guard with the nil-check pattern:

```lua
local show = decodedMemo['showHpBar']
if show == nil then show = true end
```

Not `val or true` — that coerces `false` to `true`.

These fields must also be initialised in `assignNameAndDescriptionToObjects` ([mod.lua:901](tts_lua_code/mod.lua#L901)) for newly assigned models.

### XML structure — changes to `buildActionPanelXml`

**Stat bars (R1):** Each bar Panel wraps its Text in a HorizontalLayout flanked by `[-]` / `[+]` buttons. Conditional rendering of each bar also now needs to honour the new memo flags.

```xml
<Panel color="#e74c3c" minHeight="24" preferredHeight="24">
  <HorizontalLayout spacing="0" childForceExpandWidth="false" childAlignment="MiddleCenter">
    <Button width="24" height="24" onClick="hpDown"
            fontSize="18" fontStyle="Bold" textColor="#FFFFFF"
            colors="rgba(0,0,0,0.4)|rgba(0,0,0,0.7)|rgba(0,0,0,0.9)|rgba(0,0,0,0.2)">-</Button>
    <Text minWidth="60" preferredWidth="60" fontSize="16" fontStyle="Bold" color="#FFFFFF">HP: X/Y</Text>
    <Button width="24" height="24" onClick="hpUp" ...>+</Button>
  </HorizontalLayout>
</Panel>
```

**Bar visibility (R3):** the existing `barContents` concatenation in `buildActionPanelXml` already conditionally includes HP and SP based on `hasTough`/`hasCaster`. Extend each branch to also require the corresponding memo flag:

```lua
if hasTough and showHpBar then ... end
if hasCaster and showSpBar then ... end
```

**Z-coordinate stability:** Keep `toggleBarZ` (if it survives) / `statBarsZ` / `actionPanelZ` static regardless of what's hidden — toggling a bar off should not reflow the other elements' positions. This is already roughly how the code behaves; confirm during implementation.

**UI Toggles / UI Config bottom rows (R3 + R4):** append to the action panel's outer `VerticalLayout`, below the existing three-column `HorizontalLayout` panel. Rough shape:

```xml
<!-- existing three-column block, unchanged -->
<Panel color="rgba(0,0,0,0.85)" padding="10">
  <HorizontalLayout spacing="10" ...>
    <!-- Model / Unit / Army columns -->
  </HorizontalLayout>
</Panel>

<!-- NEW: UI Toggles row (only if hasTough or hasCaster) -->
<Panel color="rgba(0,0,0,0.85)" padding="10">
  <VerticalLayout spacing="5">
    <Text fontSize="16" fontStyle="Bold" color="#FFFFFF">UI Toggles</Text>
    <HorizontalLayout spacing="10" childForceExpandWidth="true">
      <!-- conditional: Toggle HP Bar -->
      <!-- conditional: Toggle SP Bar -->
    </HorizontalLayout>
  </VerticalLayout>
</Panel>

<!-- NEW: UI Config row -->
<Panel color="rgba(0,0,0,0.85)" padding="10">
  <VerticalLayout spacing="5">
    <Text fontSize="16" fontStyle="Bold" color="#FFFFFF">UI Config</Text>
    <HorizontalLayout spacing="10" childForceExpandWidth="true">
      <Button onClick="moveMenuUp" ...>Menu ▲</Button>
      <Button onClick="moveMenuDown" ...>Menu ▼</Button>
    </HorizontalLayout>
  </VerticalLayout>
</Panel>
```

The action panel's root Panel `height="320"` will likely need to grow to accommodate the new rows. Recalculate during implementation.

### Font-glyph rendering for arrows (▲ ▼)

U+25B2 / U+25BC (black up/down triangles) are in the Unicode Geometric Shapes block and are widely supported by Unity TMPro default fonts — lower risk than the originally-considered U+2699 cog. If they still render as tofu, fall back to plain `Up` / `Down` text.

### Unit-wide toggle fan-out

`toggleUnitStatus` ([mod.lua:154](tts_lua_code/mod.lua#L154)) is the existing helper for unit-wide flips. It calls `rebuildContext` and `rebuildStatusEffectThings` on each mate — neither of which rebuilds the action panel XML. For the new `toggleHpBar` / `toggleSpBar` we need a variant that also calls `rebuildActionPanelXml` on each mate, so the UI reflects the flipped memo value immediately. Cleanest implementation: copy-and-adapt `toggleUnitStatus`, or add an optional "extra function to call per mate" parameter.

### `rebuildContext` — R2 change

Current call: `self.addContextMenuItem("Toggle Menu", toggleActionPanel, true)` at [mod.lua:546](tts_lua_code/mod.lua#L546).

TTS's `addContextMenuItem(label, callback, keep_open)` — `keep_open=true` leaves the right-click menu open after click. Flip this arg to `false` so the menu closes. "Menu Up" / "Menu Down" keep `true` (unchanged).

## Related Systems and Tasks

- `CLAUDE/mod-context.md` — canonical mod architecture document. **Will need updating** as part of implementation: it still documents the removed `^` toggle bar and the removed close-on-click behaviour for Activated/Stunned/Shaken. Also needs entries for the new memo fields, inline HP/SP buttons, and the new UI Toggles / UI Config rows.
- `CLAUDE/tts-lua-api-learnings.md` — Object UI positioning, `Wait.frames`, `self.UI.show/hide`, and the re-show-after-`setXml` pattern. The stat-bar and bottom-row changes all ride on these patterns.
- `SPECS/physical-buttons.md` — the historical spec that introduced the toggle bar + stat bars + action panel system. This QoL spec evolves that system.
- Recent commits on `mod-updates-apr-2026` branch: removed the `^` toggle bar, added "Toggle Menu" context entry, removed close-on-click from Activated/Stunned/Shaken.

## Acceptance Criteria

- **R1** — Clicking `[-]` / `[+]` on either stat bar adjusts HP or SP by exactly 1, broadcasts the existing wound/token message, and does not open or close the action panel.
- **R1** — Stat bar text remains centered and legible with the new buttons in place.
- **R1** — The "Model" column inside the action panel still contains the pre-existing `HP +/-`, `SP +/-` buttons (no regression).
- **R2** — Right-clicking a model and choosing "Toggle Menu" closes the right-click menu and toggles the action panel in a single action.
- **R2** — "Menu Up" / "Menu Down" right-click entries still stay open after click (regression check).
- **R3** — When the action panel is open, a "UI Toggles" section appears at the bottom containing only the toggles relevant to the model (HP only / SP only / both / none).
- **R3** — Clicking "Toggle HP Bar" (or SP) flips the visibility of that bar on every model in the unit. Clicking again restores it. The action panel stays open.
- **R3** — Hiding a bar does not reflow the action panel position; it just hides the bar's Panel.
- **R3** — Toggles persist across TTS save-reload cycles.
- **R3** — Existing models assigned before this change (missing `showHpBar` / `showSpBar` in memo) default to all bars visible and do not error.
- **R4** — When the action panel is open, a "UI Config" section appears at the bottom containing Menu ▲ / Menu ▼ buttons.
- **R4** — Clicking either button shunts the menu up/down by 20 units, identical to the behaviour of the existing right-click entries.
- **R4** — Clicking either button does not close the action panel.
- **Docs** — `CLAUDE/mod-context.md` is updated to reflect: removed cog/`^` toggle bar, non-closing Activated/Stunned/Shaken, new `showHpBar`/`showSpBar` memo fields, and the new inline HP/SP controls plus UI Toggles / UI Config rows.

## Implementation Notes

Targets for the implementation session:

- `tts_lua_code/mod.lua`:
  - `buildActionPanelXml` ([mod.lua:598](tts_lua_code/mod.lua#L598)) — rewrite stat-bar XML with `[-]`/`[+]` buttons; gate HP and SP panels on memo flags; append "UI Toggles" and "UI Config" rows to the action panel's root VerticalLayout; recalculate action-panel height.
  - `rebuildContext` ([mod.lua:543](tts_lua_code/mod.lua#L543)) — change "Toggle Menu" third arg from `true` to `false`.
  - New per-model functions `toggleHpBar` and `toggleSpBar` (unit-wide fan-out; copy the `toggleUnitStatus` pattern and add a per-mate `rebuildActionPanelXml` call). These are the onClick targets of the new UI Toggles row buttons.
  - `assignNameAndDescriptionToObjects` ([mod.lua:901](tts_lua_code/mod.lua#L901)) — add `showHpBar = true`, `showSpBar = true` to the memo `JSON.encode`.
- `CLAUDE/mod-context.md` — update "Action Panel UI System" section and memo-state reference.

Defensive defaults for pre-existing models:

```lua
local showHp = decodedMemo['showHpBar']
if showHp == nil then showHp = true end
local showSp = decodedMemo['showSpBar']
if showSp == nil then showSp = true end
```

---

*This specification is ready for implementation. Use `/task qol-improvements-to-mod` to begin development.*
