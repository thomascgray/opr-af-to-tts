# TTS Mod Context Documentation

## Overview

The TTS (Tabletop Simulator) mod `tts_lua_code/mod.lua` is a comprehensive Lua script that integrates with the OPR Army Forge to TTS web tool. It enables users to import army definitions from the web tool and assign them to physical models in Tabletop Simulator, providing rich game mechanics and status tracking.

## Architecture

The mod operates in two distinct phases:

### Phase 1: Army Loading

1. User inputs URL from web tool via TTS UI
2. Mod fetches army data using `WebRequest.get()`
3. JSON response parsed and converted to internal format
4. Dynamic UI cards generated for unit/model selection

### Phase 2: Model Assignment

1. User selects model definition from UI cards
2. Assignment mode activated with model data cached
3. User assigns to TTS objects via hotkey or pickup detection
4. Complete Lua script injected into each assigned model

## Data Flow

```
Web Tool URL → WebRequest.get() → handleResponse() → createCards() → UI Display

User Selection → beginAssignment() → Cache Model Data → Assignment Trigger

assignNameAndDescriptionToObjects() → Inject perModelCode → Tag & Configure
```

### Key Data Structures

**Army Data Format:**

```lua
{
  listId = "unique_id",
  gameSystem = "gf|gff|aof|aofs|aofr",
  listName = "Army Name",
  units = {
    {
      name = "Unit Name",
      unitId = "unit_id",
      modelDefinitions = {
        {
          name = "Model Name",
          loadoutCSV = "Equipment CSV",
          ttsNameOutput = "Formatted Name",
          ttsDescriptionOutput = "Formatted Description",
          originalToughValue = number,
          originalCasterValue = number
        }
      }
    }
  }
}
```

**Model Memo State:**

```lua
{
  isActivated = false,
  isShaken = false,  -- GF/AOF/AOFR only
  isStunned = false, -- GFF/AOFS only
  gameSystem = "system_code",
  unitId = "unit_identifier",
  armyId = "army_identifier",
  unitName = "display_name",
  nameToAssign = "formatted_name",
  originalToughValue = number,
  originalCasterValue = number,  -- Tokens generated PER TURN, not starting value
  currentToughValue = number,    -- Starting HP = originalTough (traditional) or originalTough+5 (skirmish)
  currentCasterValue = number,   -- Starts at originalCasterValue (first round's worth)
  armyNameToAssign = "army_name",
  unitColor = {r, g, b},         -- RGB array for unit visual distinction
  menuHeightOffset = 0,          -- Per-model UI height adjustment
  menuRotationOffset = 0,        -- Per-model UI Y-rotation adjustment (legacy; not currently user-exposed)
  showHpBar = true,              -- Unit-wide: show the floating HP stat bar (2026-04)
  showSpBar = true,              -- Unit-wide: show the floating SP stat bar (2026-04)
  measuringRingColor = {r, g, b}, -- Unit-wide: colour for the measuring ring (defaults to white)
  unitHighlightColor = false     -- Unit-wide: {r,g,b} table when a highlight is active, or `false` when cleared.
                                 -- Nil for pre-upgrade models — treat as `false`.
}
```

**Pre-upgrade models** (assigned before `showHpBar`/`showSpBar` existed) will not have these fields. All read sites must default `nil` to `true` using `if val == nil then val = true end` (not `val or true` — that coerces `false` to `true`).

## Per-Model Code System

The most sophisticated aspect is the `perModelCode` string (lines 21-619), a complete Lua script injected into every assigned model. This provides:

### Game Mechanics by System

**Grimdark Future (GF) / Age of Fantasy (AOF) / Age of Fantasy Regiments (AOFR):**

- Wounds = Tough value
- Status: Activated, Shaken
- Name format: just the model name. HP and spell tokens are shown by the floating stat bars (2026-04), not the tooltip.

**Grimdark Future Firefight (GFF) / Age of Fantasy Skirmish (AOFS):**

- Wounds = Tough + 5
- Status: Activated, Stunned
- Name format: model name + static "Tough: X" line when the model has a Tough rating. HP shown by the floating stat bar.

### Interactive Features

**Model Actions (Right-click context menu):**

- `hpUp()` / `hpDown()` - Wound management
- `spellTokensUp()` / `spellTokensDown()` - Spell token management
- `cycleMeasuringRadius()` - Measuring circles (3", 6", 9", 12", 18", 24", 30")
- `cycleShowHideWoundsAndSpellTokens()` - Toggle UI elements

**Unit Actions:**

- `toggleActivated()` - Unit activation status
- `toggleShaken()` / `toggleStunned()` - Status effects
- `selectAllUnit()` - Select all models in unit
- `countUnit()` - Count remaining models

**Army Actions:**

- `deactivateArmy()` - Deactivate entire army
- `armyRefreshSpellTokens()` - Restore spell tokens army-wide
- `measuringOffArmy()` - Remove all measuring circles

### Visual System

**Status Circles:**

- Activated: Green circle (16 steps)
- Shaken: Yellow pentagon (5 steps)
- Stunned: Red hexagon (6 steps)
- Measuring: White circle (64 steps, variable radius)

**Wound/Spell Token UI:**

- Dynamic button generation based on values
- Red buttons for wounds, cyan for spell tokens
- Opacity indicates current vs maximum values
- Scalable layout based on model count

## UI Components

### Dynamic XML Generation

**Layout Structure:**

```
Panel (600x3500) → VerticalScrollView → VerticalLayout
    ↓
Units (VerticalLayout spacing=40)
    ↓
Models (HorizontalLayout spacing=40)
    ↓
Model Cards (Button with VerticalLayout)
```

**Font Scaling:**

- `calculateFontSize(totalModels, startingValue, decreaseAmount)`
- Names: 26 font, -4 per additional model
- Loadouts: 20 font, -2 per additional model

**Special Character Handling:**

- Ampersands wrapped in `<![CDATA[&]]>` for XML safety

## Assignment System

### Trigger Methods

**Method 1: Scripting Hotkeys (modal)**

- When an assignment is in flight (`nameOfModelAssigning ~= nil`):
  - Key 1 → Assign to selected objects
  - Key 2 → Cancel assignment

**Method 2: Pickup Detection**

- `onObjectPickUp()` → Auto-assign to picked up object

### Hover Hotkeys (2026-04)

Scripting keys 1–6 act on whichever assigned OPRAFTTS model the player's pointer is currently hovering over.

| Key | Action | Gated on |
| --- | --- | --- |
| 1 | Toggle action panel | — |
| 2 | HP -1 (`hpDown`) | model has Tough (or is a skirmish system) |
| 3 | HP +1 (`hpUp`) | model has Tough (or is a skirmish system) |
| 4 | SP -1 (`spellTokensDown`) | `originalCasterValue ~= 0` |
| 5 | SP +1 (`spellTokensUp`) | `originalCasterValue ~= 0` |
| 6 | Cycle measuring radius | — |

**Critical: `onScriptingButtonDown` lives in `perModelCode`, not Global.** Users routinely save assigned models to their personal library and load them into maps that don't have the mod's Global script. Only the per-model script travels with the saved object, so the hotkey dispatcher must be per-model.

Consequences:
- TTS fires `onScriptingButtonDown` on **every** object whose script defines it — not just the hovered one. Every assigned model receives the event; the handler gates on `Player[player_color].getHoverObject() == self` so only the hovered model acts.
- Assignment-mode keys 1/2 (confirm / cancel) live in Global and still take priority in the mod's host map. The per-model handler calls `Global.call('isAssigning')` to defer while an assignment is pending. In a new map without the mod, `Global.call` returns nil (function missing = falsy), so hotkeys degrade gracefully to unconditional dispatch.
- `isAssigning()` must remain exposed on Global (reads `nameOfModelAssigning ~= nil`).

Non-OPRAFTTS objects don't define the handler, so they ignore the keys automatically — no tag check needed.

### Assignment Process

1. **Cache Model Data:** `beginAssignment()` stores:

   - `nameOfModelAssigning` - Display name
   - `nameToAssign` - Formatted TTS name
   - `descriptionToAssign` - Formatted TTS description
   - `unitIdToAssign` - Unit identifier
   - `originalToughValueToAssign` - Base tough value
   - `originalCasterValueToAssign` - Base caster value

2. **Apply to Objects:** `assignNameAndDescriptionToObjects()`:
   - Set name and description
   - Inject `perModelCode` as Lua script
   - Add tags: `OPRAFTTS_unit_id_X`, `OPRAFTTS_army_id_X`
   - Initialize memo with default state
   - Rotate model (0, 180, 0)
   - Reload model to apply script

## State Management

### Tagging System

- `OPRAFTTS_unit_id_[unitId]` - Groups models by unit
- `OPRAFTTS_army_id_[armyId]` - Groups models by army
- Used by `getAllUnitMates()` and `getAllArmyMates()`

### Global Variables

- `army[]` - Parsed army data from API
- `armyId` - Current army identifier
- `gameSystemToAssign` - Game system code
- `armyNameToAssign` - Army display name
- `oprAfToTtsLink` - Input URL from user
- `notecardGuid` - UI anchor object GUID ('e73b3a')

## Key Functions Reference

### Core Functions

- `onLoad()` - Initialize mod
- `onSubmit()` - Process URL input
- `handleResponse()` - Parse API response
- `createCards()` - Generate selection UI
- `beginAssignment()` - Start model assignment
- `assignNameAndDescriptionToObjects()` - Apply to TTS objects

### Per-Model Functions

- `rebuildName()` - Update model name display
- `rebuildXml()` - Update wound/token UI
- `rebuildContext()` - Update right-click menu
- `rebuildStatusEffectThings()` - Update visual circles

### Utility Functions

- `tablelength()` - Count table entries
- `string:split()` - String splitting
- `isValidJson()` - JSON validation
- `distributeObjects()` - Layout positioning
- `getCircleVectorPoints()` - Circle drawing math

## Integration Points

### Web Tool API

- **Endpoint Pattern:** User-provided URL from web tool
- **Response Format:** JSON with `listId`, `listJson` containing army data
- **Error Handling:** Network errors and malformed JSON detection

### TTS Integration

- **UI System:** XML-based interface with dynamic generation
- **Object System:** Name, description, tags, memo, and script injection
- **Event System:** Button clicks, hotkeys, object pickup detection
- **Visual System:** Vector lines for circles, button UI for counters

### Game System Support

- **GF/AOF/AOFR:** Traditional wound system, Shaken status
- **GFF/AOFS:** Skirmish wound system (Tough+5), Stunned status
- **Universal:** Spell tokens (max 6), measuring tools, activation tracking

## Development Considerations

### Code Structure

- Single file with embedded per-model code string
- Global state management for assignment process
- Event-driven architecture for user interactions
- **Refactored (2025)**: Added helper functions and constants for maintainability

### Performance

- Dynamic UI generation scales with army size
- Vector line calculations for status circles
- JSON parsing and validation for API responses

### Extensibility

- Game system detection drives different mechanics
- Modular function structure for easy enhancement
- Tag-based object organization for batch operations

## Recent Refactoring (2025)

The mod has been significantly refactored to improve maintainability and reduce code duplication:

### Helper Functions Added

**Game System Helpers:**
```lua
function isTraditionalSystem(gameSystem)  -- GF/AOF/AOFR
function isSkirmishSystem(gameSystem)     -- GFF/AOFS
```

**Generic Toggle System:**
```lua
function toggleUnitStatus(statusField, statusName)  -- Unified toggle logic
```

**UI Helpers:**
```lua
function createStatusButton(position, color, opacity, modelSizeY, rowIndex, buttonRowsDistribution)
function updateMemo(updates)  -- Simplified memo updates
```

### Constants Extracted

**Configuration Constants:**
```lua
MEASURING_RADII = {3, 6, 9, 12, 18, 24, 30}
FONT_SCALING = {name_base = 26, name_decrease = 4, loadout_base = 20, loadout_decrease = 2}
BUTTON_CONFIG = {width = 100, height = 100, font_size = 340, wound_spacing = 0.275, row_spacing = 0.35}
COLORS = {wound = {1, 0, 0}, spell = {0, 1, 1}, text = {1, 1, 1}}
GLOBAL_FONT_SCALING = {name_base = 26, name_decrease = 4, loadout_base = 20, loadout_decrease = 2}
```

### Refactoring Benefits

- **~100+ lines eliminated** through deduplication
- **Easier maintenance**: Game system changes, colors, measurements centralized
- **Improved readability**: Clear helper function names vs long conditionals
- **Better extensibility**: Adding new systems/features much simpler
- **Zero functional changes**: All existing behavior preserved

### Key Improvements

1. **Game System Checks**: `if isTraditionalSystem(gameSystem)` vs long OR chains
2. **Toggle Functions**: 3 identical functions → 1 generic + 3 one-liners
3. **Button Creation**: Repetitive createButton calls → single helper function
4. **Measuring Cycling**: Long if-elseif chain → elegant array-based cycling
5. **Magic Numbers**: Hardcoded values → named constants
6. **Assignment Process**: Optimized to prevent unwanted tool switching

## Unit Color System (2025)

Each unit is assigned a unique color from a 20-color palette for visual distinction in the UI.

### Color Assignment

**Palette** (`UNIT_COLORS` constant):
```lua
{0, 0, 255},      -- Blue
{255, 0, 0},      -- Red
{0, 255, 0},      -- Green
{255, 255, 0},    -- Yellow
{255, 0, 255},    -- Magenta
-- ... 20 colors total, wraps around
```

**Assignment Process**:
1. During `beginAssignment()`, check if unit already has a color assigned
2. If not, assign next color from palette (index wraps at 20)
3. Store in `unitColorAssignments[unitId]` for consistency across models
4. Pass color to model memo as `unitColor = {r, g, b}`

**Usage**: The unit color is used for the toggle bar button background, providing visual grouping of models in the same unit.

## Spell Token Mechanics

**Important distinction:**
- `originalCasterValue` = tokens generated **per turn**, NOT starting/max value
- `currentCasterValue` = current token count (max 6)
- Model starts with `currentCasterValue = originalCasterValue` (first round's worth)

**Refresh behavior** (`armyRefreshSpellTokens()`):
```lua
currentCasterValue = min(currentCasterValue + originalCasterValue, 6)
```

Example: A Caster(3) generates 3 tokens/turn, starts at 3/6, refreshes add 3 more (capped at 6).

## Action Panel UI System (2025, updated 2026-04)

A floating 3D action panel floats above each model with stat bars plus a toggle-opened button panel. The original `^` toggle-bar button was removed in 2026-04; the panel is now opened via a right-click → "Toggle Menu" context menu entry.

### UI Components

**1. Stat Bars** - HP/SP display floating above the model
- HP bar: Red (#e74c3c), shows "HP: X/Y"
- SP bar: Blue (#3498db), shows "SP: X/6"
- Each bar has inline `[-]` / `[+]` buttons on either side of its text for quick wound/token adjustment without opening the full menu (2026-04).
- Individually togglable via the Floating UI Visibility section in the action panel. Visibility stored in `showHpBar` / `showSpBar` memo fields, unit-wide.
- Uses VerticalLayout (HP on top, SP below). Panel is hidden entirely if neither bar is visible.

**2. Action Panel** - 3-column button panel + bottom rows (hidden by default)
- Opened/closed via the right-click "Toggle Menu" entry.
- **Model column**: HP +/-, SP +/-, Measuring controls, Measuring Off.
- **Unit column**: Activated, Stunned/Shaken, Select All, Count.
- **Army column**: Measuring Off, Deactivate, Refresh Spells.
- **Measuring Ring Colour row** (2026-04): two rows of eight 32x32 colour swatches — light variants on top, dark variants below. Sets `measuringRingColor` unit-wide. Shares the `PALETTE` table with Unit Highlight.
- **Unit Highlight row** (2026-04): two rows of eight colour swatches (same palette) plus a full-width **Clear Highlight** button. Clicking a swatch calls `Object.highlightOn(color)` on every model in the unit; Clear calls `highlightOff`. Persisted in `unitHighlightColor` memo and re-applied via `applyHighlightFromMemo` on `onLoad`, since TTS does not persist object highlights across save/reload.
- **Floating UI Visibility row** (2026-04): `Toggle HP Bar` / `Toggle SP Bar` — conditional on the unit having that stat. Unit-wide.
- **Model Floating UI Position row** (2026-04): `Up` / `Down` shunt the floating UI by ±20 Z units per click (mirrors the right-click `Menu Up` / `Menu Down`); `Rotate Right` / `Rotate Left` spin it by ±15° around the vertical axis.
- Red X close button in top-right corner (only close action in the panel).

### Key Functions

```lua
buildActionPanelXml()      -- Generates complete XML for all UI components
rebuildActionPanelXml()    -- Applies XML and preserves open state
toggleActionPanel()        -- Opens/closes panel, closes other army menus
closeActionPanel()         -- Internal close
closeMenuFromExternal()    -- Called by army mates to close this menu
toggleHpBar / toggleSpBar  -- Unit-wide visibility toggles (2026-04)
toggleUnitUiFlag(flag)     -- Shared helper for unit-wide UI toggles; calls rebuildActionPanelXml on each mate
paletteLookup(id, prefix)  -- Shared id->rgb resolver for Ring Colour and Highlight pickers (2026-04)
setRingColor / setHighlightColor -- Unit-wide fan-out picker handlers (2026-04)
applyHighlightFromMemo     -- Per-model: applies highlightOn/Off based on unitHighlightColor memo (2026-04)
clearUnitHighlight         -- Unit-wide: clears highlight + wipes the memo field (2026-04)
```

### Cross-Object Communication

**Only one menu open per army:**
When opening a menu, iterate all army mates and close their menus:
```lua
for _, armyMate in ipairs(getAllArmyMates()) do
    if armyMate ~= self then
        armyMate.call('closeMenuFromExternal')
    end
end
```

### Button Behaviors

**None of the in-panel CTAs close the panel except the X button** (2026-04 change — previously Activated/Stunned/Shaken closed it).

- Activated, Stunned, Shaken toggles → panel stays open
- Army Deactivate → stays open
- HP/SP buttons (both the Model column ones and the inline stat-bar ones) → stay open
- Floating UI Visibility / Model Floating UI Position actions → stay open
- Only the red X closes the panel

### Context Menu

Right-click a model to get:
- `Toggle Menu` — opens/closes the action panel. **Closes the right-click menu after click** (2026-04).
- `Menu Up` / `Menu Down` — adjusts `menuHeightOffset` (±20 units). Keeps the right-click menu open so you can nudge repeatedly.

The same Menu Up/Down actions are also available inside the action panel's Model Floating UI Position row (2026-04), along with Rotate Left/Right.

### State Preservation

When rebuilding UI (e.g., after HP change), preserve open state:
```lua
function rebuildActionPanelXml()
    local wasOpen = isActionPanelOpen
    self.UI.setXml(xml)
    isActionPanelOpen = false

    if wasOpen then
        Wait.frames(function()
            self.UI.show('action-panel')
            isActionPanelOpen = true
        end, 1)
    end
end
```

### Assignment & Initialization

**Assignment process now includes:**
1. Calculate starting HP based on game system (skirmish: tough+5, traditional: tough)
2. Set `currentCasterValue = originalCasterValue` (first round's tokens)
3. Include `unitColor` from assignment
4. Call `target.reload()` - **required** for `onLoad()` to run and initialize UI

**`onLoad()` initializes:**
- Status effect circles
- Context menu (adjustment options only)
- Action panel XML via `rebuildActionPanelXml()`
