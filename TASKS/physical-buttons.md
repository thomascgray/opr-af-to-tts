# Physical Buttons UI

**Status**: In Progress

## Overview

Replace the current right-click context menu system for TTS model interactions with a visual button panel. A toggle bar floats above each model (always visible at low opacity, full opacity on hover), and clicking it opens/closes an action panel with buttons grouped into three columns (Model/Unit/Army).

## Task Context

- **Main file to modify:** [tts_lua_code/mod.lua](tts_lua_code/mod.lua)
- **All UI code MUST be in `perModelCode`** (lines 56-717) to ensure models are self-contained and work when saved/loaded into any TTS table
- **Spec document:** [SPECS/physical-buttons.md](SPECS/physical-buttons.md) - contains full technical requirements
- **Current context menu system:** `rebuildContext()` function - kept as fallback
- **Game system helpers:** `isTraditionalSystem()` and `isSkirmishSystem()` already exist
- **Model memo structure:** Contains all state fields including new `unitColor` field
- **TTS UI methods:**
  - `self.UI.setXml(xml)` - Set/replace entire UI on object
  - `self.UI.show(id)` / `self.UI.hide(id)` - Show/hide elements
  - `colors` attribute: `"normal|highlighted|pressed|disabled"` for button states
- **Unit color coding:** Each unit gets a unique color from a 20-color palette (assigned during model assignment, stored in memo)

### Important Lessons Learned
- **Nested string delimiters:** Cannot use `[[...]]` inside `perModelCode` (which itself uses `[[...]]`). Must use string concatenation with `..` and double quotes instead.
- **TTS Object UI positioning:** Uses `position="X Y Z"` relative to object. **Negative Z moves UP** (not positive Y!). Use `self.getBounds().size.y` for actual world-space model height.
- **TTS Object UI rotation for standing panels:** Use `rotation="90 180 0"` for upright billboard-style panels. The 90 on X tilts it to stand upright, 180 on Y faces it toward the player.
- **UI position units:** Approximately 100 units per inch. Formula: `-((actualHeight * 100) + offset)` for height above model.
- **getBounds() vs getBoundsNormalized():** Use `getBounds()` to get actual world-space dimensions including inherent model size. `getBoundsNormalized()` returns normalized values that don't reflect different model sizes.
- **Model rotation on assignment:** Models are set to `{0, 180, 0}` rotation on assignment to face the player consistently.
- **Script reload required:** After `setLuaScript()`, must call `target.reload()` for `onLoad()` to execute and initialize the UI.

## Blockers/Issues

None currently - basic functionality working, needs refinement

## TODO

[X] Add `UNIT_COLORS` palette constant to global scope (20 colors)
[X] Track unit color index during army processing
[X] Store `unitColor` in model memo during `assignNameAndDescriptionToObjects()`
[X] Create `rebuildActionPanelXml()` function in `perModelCode`
    [X] Build toggle bar XML with unit color and opacity states
    [X] Build action panel XML with 3 columns (Model/Unit/Army)
    [X] Conditionally show buttons based on game system and model state
[X] Create `toggleActionPanel()` function to open/close the action panel
[X] Add `isActionPanelOpen` state variable to track panel state
[X] Call `rebuildActionPanelXml()` from `onLoad()`
[X] Enable `target.reload()` after assignment so UI initializes
[X] Fine-tune panel positioning and sizing
[X] Replace physical button HP/SP display with XML-based number bars
    [X] Position bars ABOVE toggle bar, BELOW action panel
    [X] Always visible at 100% opacity
    [X] HP bar: red (#e74c3c), SP bar: blue (#3498db)
    [X] Bars should update when HP/SP values change
[X] Fix HP/SP bars overlapping when model has both - use VerticalLayout with HP on top
[X] Fix HP/SP bar text not rendering - add explicit sizing to inner panels
[X] Add per-model menu position/rotation adjustment via right-click menu
    [X] Store `menuHeightOffset` and `menuRotationOffset` in memo
    [X] Add 4 context menu options: Menu Up, Menu Down, Rotate Left 15°, Rotate Right 15°
    [X] Apply offsets to all UI panels (toggle bar, stat bars, action panel)
    [X] Replace old context menu items with just these 4 adjustment options
[ ] Test all button actions work correctly
[ ] Verify backwards compatibility (right-click context menu still works)
[ ] Test model save/load portability across TTS tables

## Work Log

[2026-01-25] Initial implementation of Physical Buttons UI feature

**Changes made to tts_lua_code/mod.lua:**

**Global scope additions (lines 18-52):**
- Added `unitColorToAssign` variable for tracking color during assignment
- Added `unitColorAssignments` table to map unitId -> color for consistent unit coloring
- Added `UNIT_COLORS` palette constant with 20 distinct colors
- Added `unitColorIndexCounter` to track which color to assign next

**Assignment logic updates:**
- Modified `beginAssignment()` to assign a consistent color for each unit
- Modified `assignNameAndDescriptionToObjects()` to store `unitColor` in model memo
- Modified `cancelCurrentAssigning()` to reset `unitColorToAssign`

**New functions in perModelCode:**
- `isActionPanelOpen` state variable
- `toggleActionPanel()` function - toggles action panel visibility
- `buildActionPanelXml()` function - builds the complete XML UI
- `rebuildActionPanelXml()` function - applies the XML UI to the model

**onLoad() integration:**
- Added call to `rebuildActionPanelXml()` to initialize the UI on model load

---

[2026-01-25] Bug fixes - Lua syntax and UI orientation

**Issue 1: Lua syntax error** `chunk_4:(685,8-11): <eof> expected near 'end'`
- **Cause:** Nested `[[...]]` string delimiters inside `perModelCode` conflicted with the outer delimiters
- **Fix:** Replaced all inner multi-line strings with string concatenation using `..` and double quotes

**Issue 2: Menu button flat on ground / wrong orientation**
- **Cause:** TTS object UI was positioned with wrong axis values and no rotation
- **Fix:** Changed panel positioning to `position="0 0 -50"` with `rotation="180 180 0"`

**Issue 3: UI not appearing on newly assigned models**
- **Cause:** `setLuaScript()` doesn't trigger `onLoad()` - object needs to be reloaded
- **Fix:** Uncommented `target.reload()` in `assignNameAndDescriptionToObjects()`

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-25] Bug fixes - Panel positioning and orientation

**Issue 1: Panel appearing halfway up the model**
- **Cause:** Hardcoded position values (`position="0 0 -50"`) didn't account for model height
- **Fix:** Added `modelSizeY = bounds['size']['y']` in `onLoad()` and calculated dynamic positions:
  - Toggle bar: `position="0 [modelSizeY*100 + 30] 0"`
  - Action panel: `position="0 [modelSizeY*100 + 200] 0"`

**Issue 2: Panel lying flat (perpendicular to table)**
- **Cause:** Rotation `"180 180 0"` caused the panel to face upward/flat
- **Fix:** Changed rotation to `"0 180 0"` to make panels stand upright like billboards

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-25] Final positioning solution - extensive trial and error

**The Problem:** TTS Object UI coordinate system is non-intuitive. Multiple iterations were needed to find the correct combination of position axes and rotation values.

**What we tried (and why it failed):**
1. `position="0 Y 0"` with `rotation="0 180 0"` - Panel appeared at wrong position, still flat
2. `position="0 Y 0"` with `rotation="90 0 0"` - Panel in ground, backwards
3. `position="0 Y 0"` with `rotation="-90 0 0"` - Panel standing but at wrong position
4. `position="0 0 Z"` (positive Z) with `rotation="180 180 0"` - Panel far below model
5. `position="0 0 -Z"` (negative Z) with `rotation="180 180 0"` - Correct height, but flat!
6. `position="0 0 -Z"` with `rotation="90 180 0"` - **SUCCESS!** Standing upright, above model

**Final working solution:**
```lua
local bounds = self.getBounds()
local actualHeight = bounds['size']['y']
local toggleBarZ = -((actualHeight * 100) + 50)
local actionPanelZ = -((actualHeight * 100) + 220)

position="0 0 [Z]" rotation="90 180 0"
```

**Key discoveries:**
- **Negative Z = UP** for Object UI position (counterintuitive!)
- **rotation="90 180 0"** = standing upright (90 on X) + facing player (180 on Y)
- **getBounds()** returns actual world-space dimensions (includes inherent model size)
- **getBoundsNormalized()** returns normalized values that DON'T vary between different model geometries
- **~100 units per inch** for UI positioning
- Models are rotated `{0, 180, 0}` on assignment, so UI "forward" aligns with player view

**Files modified:** tts_lua_code/mod.lua (buildActionPanelXml function)

---

[2026-01-25] Replaced physical button HP/SP display with XML-based stat bars

**Problem:** The old physical button system for displaying HP/spell tokens looked inconsistent with the new XML-based action panel UI.

**Solution:** Added XML-based stat bars that display HP and SP as colored number panels:
- HP bar: Red (#e74c3c) showing "HP: X/Y"
- SP bar: Blue (#3498db) showing "SP: X/6"
- Positioned ABOVE the toggle bar, BELOW the action panel
- Always visible at 100% opacity
- Updates automatically when HP/SP values change

**Changes to `buildActionPanelXml()` function:**
- Added current HP/SP value retrieval from memo
- Added `statBarsZ` position calculation (between toggle bar and action panel)
- Created new `stat-bars-panel` XML with HorizontalLayout containing HP and SP colored panels
- Adjusted `actionPanelZ` to account for the new stat bars (pushed higher)

**Changes to HP/SP modifier functions:**
- Updated `hpUp()`, `hpDown()`, `spellTokensUp()`, `spellTokensDown()` to call `rebuildActionPanelXml()` instead of old `rebuildXml()`
- Updated `armyRefreshSpellTokens()` to call `rebuildActionPanelXml()`

**Cleanup (removed old physical button system):**
- Removed `isShowWoundsAndSpellTokens` variable from `onLoad()`
- Simplified `rebuildXml()` to just clear buttons (kept for backward compat)
- Simplified `cycleShowHideWoundsAndSpellTokens()` to no-op (kept for backward compat)
- Removed unused constants: `BUTTON_CONFIG`, `COLORS`
- Removed unused helper: `createStatusButton()`
- Removed "Toggle W/SP Count" from context menu and action panel
- Removed call to `rebuildXml()` from `onLoad()`

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-25] Fixed HP/SP bars overlapping and added menu position/rotation adjustment

**Issue 1: HP/SP bars overlapping**
- **Cause:** `HorizontalLayout` was putting bars side-by-side but they were rendering on top of each other
- **Fix:** Changed to `VerticalLayout` with HP bar first (on top), SP bar second (below)
- Reduced padding and font size slightly for cleaner look
- Dynamic panel height based on number of bars (28px per bar)

**Issue 2: Added per-model menu adjustment controls**
- Added 4 new functions: `moveMenuUp()`, `moveMenuDown()`, `rotateMenuLeft()`, `rotateMenuRight()`
- Store `menuHeightOffset` and `menuRotationOffset` in model memo (persists across saves)
- Height adjustment: 20 units per click (up = higher, down = lower)
- Rotation adjustment: 15° per click (left = counter-clockwise, right = clockwise)
- Applied offsets to all three UI panels: toggle bar, stat bars, action panel
- Base rotation is `90 180 0`, Y rotation offset is added to the 180

**Context menu changes:**
- Replaced all previous context menu items with just 4 adjustment options:
  - "Menu Up" - moves UI higher
  - "Menu Down" - moves UI lower
  - "Rotate Left 15°" - rotates UI counter-clockwise
  - "Rotate Right 15°" - rotates UI clockwise
- All other functionality now accessed via the action panel

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-26] Fixed HP/SP bar text not rendering on some models

**Issue:** HP/SP bars showed colored backgrounds but text was not visible on models that had both HP and SP bars.

**Cause:** The panel sizing was too tight - inner panels had no explicit height and the overall panel height calculation wasn't accounting for proper spacing.

**Fix:**
- Added explicit `minHeight="24"` and `preferredHeight="24"` to each bar's inner Panel
- Added `childForceExpandHeight="false"` to VerticalLayout to prevent stretching
- Added `padding="2"` to VerticalLayout for breathing room
- Improved height calculation: `(barCount * 26) + ((barCount - 1) * 4) + 4` to account for bar height + spacing + padding
- Reduced outer panel width from 120 to 100 (sufficient for "HP: X/Y" text)

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-26] Menu button refinements and assignment fixes

**Fix 1: Models now start at max HP and max SP when assigned**
- Previously `currentToughValue` and `currentCasterValue` were set to 0 on assignment
- Now they start at their maximum values:
  - For skirmish systems: HP = originalToughValue + 5
  - For traditional systems: HP = originalToughValue
  - SP = originalCasterValue

**Fix 2: Menu button defaults higher**
- Increased base offset from 50 to 80 for toggle bar
- Adjusted stat bars offset from 100 to 130
- Adjusted action panel offset from 280 to 310

**Fix 3: Menu toggle button now uses arrow indicators**
- Shows ▲ when action panel is closed
- Shows ▼ when action panel is open
- Uses `self.UI.setValue()` to dynamically update button text on toggle

**Fix 4: Menu toggle button styling**
- Reduced font size from 16 to 12
- Added `textColor="#FFFFFF"` for white text

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-26] Refined toggle button to use rotation instead of character swap

**Changes:**
- Replaced unicode arrows (▲/▼) with simple caret "^"
- Button now rotates 180° on Z axis when open (flips ^ to look like v)
- Made button square/circular: 36x36 instead of 80x30
- Uses `self.UI.setAttribute('toggle-bar-panel', 'rotation', ...)` for dynamic rotation
- Increased font size back to 14 for better visibility in smaller button

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-26] Action panel close behavior and close button

**Changes:**
- Added `closeActionPanel()` helper function that hides panel and resets toggle button rotation
- HP/SP buttons (Wounds +/-, Spell +/-) do NOT close the panel (unchanged behavior)
- Status toggle buttons (Activated, Stunned, Shaken) now close the panel after action
- Army Deactivate button now closes the panel after action
- Added red close button (X) in top right corner of action panel:
  - 28x28 size, red background (#e74c3c), white X text
  - Uses `rectAlignment="UpperRight"` with offset for positioning

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-26] Fixed HP/SP buttons closing menu and close button styling

**Fix 1: HP/SP buttons no longer close the menu**
- `rebuildActionPanelXml()` now preserves open state using `Wait.frames()`
- If panel was open before rebuild, it reopens after 1 frame with correct rotation

**Fix 2: Close button now renders on top and is red**
- Moved close button to be last element in action-panel (renders on top)
- Changed from `colors` attribute (state tinting) to `color="#e74c3c"` (solid background)
- Adjusted offset to `-15 -15` for proper corner positioning

**Files modified:** tts_lua_code/mod.lua

---

[2026-01-26] Final menu improvements - army-wide close, button labels, and deactivate behavior

**Change 1: Opening a menu now closes other menus in the same army**
- Added `closeMenuFromExternal()` function that army mates can call to close this object's menu
- Modified `toggleActionPanel()` to iterate through all army mates and call `closeMenuFromExternal()` on each when opening
- Only affects opening - closing your own menu doesn't trigger army-wide behavior

**Change 2: Army Deactivate button no longer auto-closes the menu**
- Removed `closeActionPanel()` call from `deactivateArmy()` function
- Regular Activated toggle still closes menu (as per user preference)

**Change 3: Renamed button labels from Wounds/Spell to HP/SP**
- Changed "Wounds +" → "HP +"
- Changed "Wounds -" → "HP -"
- Changed "Spell +" → "SP +"
- Changed "Spell -" → "SP -"

**Note about starting spell tokens (3/6):**
- `originalCasterValue` represents tokens generated per turn, not starting value
- Model starts with `currentCasterValue = originalCasterValue` (their first round's worth)
- `armyRefreshSpellTokens()` adds `originalCasterValue` each turn, capped at 6

**Files modified:** tts_lua_code/mod.lua
