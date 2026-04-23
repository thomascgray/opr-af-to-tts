# Physical Buttons UI - TTS Model Interaction Panel

## Overview

Replace the current right-click context menu system for model interactions with a visual button panel that appears above a model's head when selected. This will provide a more intuitive and accessible interface for players to manage wounds, spell tokens, activation status, and other unit controls.

## Requirements

### Core Functionality - Toggle Bar + Menu Panel

**Reference:** Similar to the health bar UI in other TTS mods where a small bar floats above the model, and clicking it reveals a full menu panel above it.

**Toggle Bar (Always Visible)**
1. A small floating "toggle bar" is ALWAYS visible above the model's head
2. The bar is subtle (low opacity ~30%) when not being interacted with
3. The bar becomes fully visible (100% opacity) on hover
4. Each unit has a unique color for its toggle bar (helps distinguish units visually)
5. The bar stays in place whether the menu is open or closed

**Menu Panel (Toggles On/Off)**
1. Clicking the toggle bar OPENS the action panel ABOVE the bar
2. Clicking the toggle bar again CLOSES the action panel
3. The action panel contains all current context menu options (grouped into columns)
4. Same button for open AND close (no separate close button needed)

### Action Panel Contents

Buttons grouped into three columns/categories:

**Model Controls:**
- Wounds +/- (if model has Tough value or is skirmish game)
- Spell Tokens +/- (if model has Caster value)
- Toggle W/SP Count visibility
- Measuring radius cycle
- Measuring Off

**Unit Controls:**
- Toggle Activated
- Toggle Stunned (skirmish systems only)
- Toggle Shaken (traditional systems only)
- Select All (unit)
- Count (unit)

**Army Controls:**
- Army Measuring Off
- Deactivate Army
- Refresh Spell Tokens

### Backwards Compatibility
- Keep the right-click context menu as a fallback during testing phase
- Can be removed later once the new UI is proven stable

## Technical Considerations

### TTS XML UI System (from documentation)

**Global vs Object UI:**
- Global UI: `UI.setXml(xml)` - appears on screen
- Object UI: `object.UI.setXml(xml)` - attached to specific object
- Object UI button clicks call functions in that object's script by default
- Override with `onClick="Global/functionName"` or `onClick="objectGUID/functionName"`

**Key UI Methods:**
- `self.UI.setXml(xml)` - Set/replace entire UI on object
- `self.UI.show(id)` / `self.UI.hide(id)` - Show/hide elements with animation
- `self.UI.setAttribute(id, attribute, value)` - Modify specific attributes
- `active="false"` attribute - Hides element and removes from layout

**Button onClick Handler:**
```lua
function buttonClicked(player, value, id)
    -- player: Player object who clicked
    -- value: custom value if specified, else nil
    -- id: element's id attribute
end
```

**Available Layout Elements:**
- `<Panel>` - Basic container
- `<HorizontalLayout>` - Horizontal row arrangement
- `<VerticalLayout>` - Vertical column arrangement
- `<GridLayout>` - Grid with cellSize, constraint, constraintCount
- `<Button>` - Clickable button with onClick handler

**Useful Attributes:**
- `id` - Unique identifier for scripting access
- `active` - Show/hide element (default: true)
- `visibility` - Restrict to specific players (e.g., "Red|Blue")
- `showAnimation` / `hideAnimation` - Grow, FadeIn, SlideIn_Left, etc.

### Always-Visible Toggle Button (No Polling Required)

**Approach:** The toggle button is ALWAYS visible above the model, but at low opacity. It becomes fully visible on hover.

**How it works:**
1. Toggle button renders on model load (always present)
2. Button is subtle (30% opacity) when not interacted with
3. Button becomes fully visible (100% opacity) on hover
4. Click opens the full action panel
5. Action panel has a "Close" button to hide it again

**TTS Button `colors` Attribute:**
```
colors="normal|highlighted|pressed|disabled"
```

Example with opacity states:
```xml
<Button colors="rgba(0,0,255,0.3)|rgba(0,0,255,1)|rgba(0,0,255,0.8)|rgba(0,0,255,0.2)">
```
- **Normal:** 30% opacity (subtle, always visible)
- **Highlighted (hover):** 100% opacity (full visibility)
- **Pressed:** 80% opacity
- **Disabled:** 20% opacity

### Unit Color Coding

Each unit is assigned a unique color from a palette of ~20 colors. This helps players visually distinguish which models belong to which unit.

**Color Palette (assigned during model assignment):**
```lua
local UNIT_COLORS = {
    {0, 0, 1},      -- Blue
    {1, 0, 0},      -- Red
    {0, 1, 0},      -- Green
    {1, 1, 0},      -- Yellow
    {1, 0, 1},      -- Magenta
    {0, 1, 1},      -- Cyan
    {1, 0.5, 0},    -- Orange
    {0.5, 0, 1},    -- Purple
    {0, 0.5, 0},    -- Dark Green
    {0.5, 0.5, 0},  -- Olive
    {1, 0.75, 0.8}, -- Pink
    {0, 0, 0.5},    -- Navy
    {0.5, 0.25, 0}, -- Brown
    {0.75, 0.75, 0.75}, -- Silver
    {1, 0.84, 0},   -- Gold
    {0, 0.5, 0.5},  -- Teal
    {0.5, 0, 0},    -- Maroon
    {0.5, 0.5, 1},  -- Light Blue
    {1, 0.5, 0.5},  -- Salmon
    {0.5, 1, 0.5},  -- Light Green
}
```

**Color Assignment:**
- When assigning a model, determine unit index (1-20, cycling if more units)
- Store the color in the model's memo: `unitColor = {r, g, b}`
- `rebuildActionPanelXml()` uses this color for the toggle button

**Why this is better than polling:**
- No timers or periodic checks
- No CPU overhead
- Immediate response (hover is instant)
- Simpler code
- Self-contained in `perModelCode`

### Current Implementation Analysis

**Context Menu System:** ([mod.lua:565-621](tts_lua_code/mod.lua#L565-L621))
```lua
function rebuildContext()
    self.clearContextMenu()
    self.addContextMenuItem("▼ Model", __noop, true)
    -- ... conditionally add items based on state
end
```

**Existing XML UI:** Already used for unit card selection panel ([mod.lua:668-681](tts_lua_code/mod.lua#L668-L681))

### Model Memo Structure

```lua
{
    isActivated: boolean,
    isShaken: boolean,
    isWavering: boolean,
    isStunned: boolean,
    gameSystem: string,  -- 'gf', 'aof', 'aofr', 'aofs', 'gff'
    unitId: string,
    armyId: string,
    unitName: string,
    nameToAssign: string,
    originalToughValue: number,
    originalCasterValue: number,
    currentToughValue: number,
    currentCasterValue: number,
    armyNameToAssign: string,
}
```

**Game System Helpers:**
- `isTraditionalSystem(gameSystem)` - returns true for 'gf', 'aof', 'aofr'
- `isSkirmishSystem(gameSystem)` - returns true for 'aofs', 'gff'

### Per-Model Code Location
All per-model code lives in the `perModelCode` string variable ([mod.lua:29-622](tts_lua_code/mod.lua#L29-L622)) which is assigned to models via `target.setLuaScript(perModelCode)`.

## Related Systems and Tasks

- Current context menu system: `rebuildContext()` function
- Current wound/spell token button system: `rebuildXml()` function
- Model state management: memo-based state with JSON encode/decode

## Open Questions

1. **~~Selection Event~~** ✅ RESOLVED: On model selection (click-select)

2. **~~Panel Dismissal~~** ✅ RESOLVED: When model is deselected

3. **~~Button Layout~~** ✅ RESOLVED: Grouped into 3 columns (Model/Unit/Army)

4. **~~Multiple Selections~~** ✅ RESOLVED: Each selected model shows its own toggle button

5. **~~Backwards Compatibility~~** ✅ RESOLVED: Keep right-click menu during testing

6. **~~Selection Detection~~** ✅ RESOLVED: No detection needed! Toggle button is always visible (low opacity), full opacity on hover

7. **~~Polling Frequency~~** ✅ RESOLVED: No polling needed! Using always-visible button with hover opacity

8. **Panel Position/Size**: To be determined during implementation - will experiment with values

## Acceptance Criteria

1. [ ] Toggle bar is always visible above model (low opacity ~30%)
2. [ ] Toggle bar becomes fully visible on hover (100% opacity)
3. [ ] Each unit has a unique color for its toggle bar (from 20-color palette)
4. [ ] Clicking toggle bar opens action panel ABOVE the bar
5. [ ] Clicking toggle bar again closes the action panel (same button for open/close)
6. [ ] Toggle bar stays visible whether menu is open or closed
7. [ ] Action panel contains all functionality from current context menu
8. [ ] Buttons grouped into 3 columns (Model/Unit/Army)
9. [ ] Buttons conditionally shown based on model state (game system, tough/caster values)
10. [ ] All button actions work correctly (wounds, spell tokens, activation, etc.)
11. [ ] Panel does not interfere with normal gameplay/model manipulation
12. [ ] Works for both traditional and skirmish game systems
13. [ ] Unit-wide and army-wide actions propagate to all relevant models
14. [ ] Right-click context menu still works as fallback
15. [ ] Models work correctly when saved and loaded into any table

## Implementation Notes

### Suggested Approach

**All code goes in `perModelCode` (inside mod.lua) to ensure portability.**

1. **Store unit color in memo during assignment** (in global `mod.lua`):
   ```lua
   -- Add to assignNameAndDescriptionToObjects()
   local unitColorIndex = (unitIndex - 1) % #UNIT_COLORS + 1
   local unitColor = UNIT_COLORS[unitColorIndex]

   target.memo = JSON.encode({
       -- ... existing fields ...
       unitColor = unitColor,  -- NEW: {r, g, b} values
   })
   ```

2. **Build UI on load** (in `perModelCode`):
   ```lua
   function onLoad()
       -- ... existing code ...
       rebuildActionPanelXml()  -- Build and apply the UI
   end
   ```

3. **XML UI builder with unit color:**
   ```lua
   function rebuildActionPanelXml()
       local decodedMemo = JSON.decode(self.memo)
       local color = decodedMemo['unitColor'] or {0.5, 0.5, 0.5}  -- Default gray
       local r, g, b = color[1], color[2], color[3]

       -- Build colors string for button states: normal|hover|pressed|disabled
       local buttonColors = string.format(
           "rgba(%s,%s,%s,0.3)|rgba(%s,%s,%s,1)|rgba(%s,%s,%s,0.8)|rgba(%s,%s,%s,0.2)",
           r, g, b, r, g, b, r, g, b, r, g, b
       )

       local xml = buildXmlString(buttonColors, decodedMemo)
       self.UI.setXml(xml)
   end
   ```

4. **Toggle action panel (same button opens/closes):**
   ```lua
   local isActionPanelOpen = false

   function toggleActionPanel(player, value, id)
       if isActionPanelOpen then
           self.UI.hide('action-panel')
           isActionPanelOpen = false
       else
           self.UI.show('action-panel')
           isActionPanelOpen = true
       end
   end
   ```

5. **Keep `rebuildContext()` unchanged** for backwards compatibility (right-click menu still works)

### Example XML Structure (draft)

```xml
<!--
    Layout: Action Panel sits ABOVE the Toggle Bar
    Toggle Bar is always visible, clicking it shows/hides the Action Panel
-->

<!-- Toggle Bar (ALWAYS visible, low opacity until hover) -->
<!-- Position at bottom, Action Panel will appear above it -->
<Panel id="toggle-bar-panel" position="0 150 0">
    <Button
        id="toggle-bar"
        onClick="toggleActionPanel"
        width="80"
        height="30"
        colors="rgba(0,0,1,0.3)|rgba(0,0,1,1)|rgba(0,0,1,0.8)|rgba(0,0,1,0.2)"
    >
        <Text fontSize="20">Menu</Text>
    </Button>
</Panel>

<!-- Action Panel (hidden by default, appears ABOVE the toggle bar) -->
<Panel id="action-panel" position="0 300 0" active="false" width="450" height="280">
    <VerticalLayout spacing="5" padding="10" color="rgba(0,0,0,0.8)">
        <HorizontalLayout spacing="10">
            <!-- Model Column -->
            <VerticalLayout spacing="5" minWidth="120">
                <Text fontStyle="Bold" color="#FFFFFF">Model</Text>
                <Button onClick="hpUp">Wounds +</Button>
                <Button onClick="hpDown">Wounds -</Button>
                <Button onClick="spellTokensUp">Spell +</Button>
                <Button onClick="spellTokensDown">Spell -</Button>
                <Button onClick="cycleShowHideWoundsAndSpellTokens">Toggle W/SP</Button>
                <Button onClick="cycleMeasuringRadius">Measuring</Button>
                <Button onClick="measuringOff">Measuring Off</Button>
            </VerticalLayout>

            <!-- Unit Column -->
            <VerticalLayout spacing="5" minWidth="120">
                <Text fontStyle="Bold" color="#FFFFFF">Unit</Text>
                <Button onClick="toggleActivated">Activated</Button>
                <Button onClick="toggleShaken">Shaken</Button>
                <Button onClick="toggleStunned">Stunned</Button>
                <Button onClick="selectAllUnit">Select All</Button>
                <Button onClick="countUnit">Count</Button>
            </VerticalLayout>

            <!-- Army Column -->
            <VerticalLayout spacing="5" minWidth="120">
                <Text fontStyle="Bold" color="#FFFFFF">Army</Text>
                <Button onClick="measuringOffArmy">Measuring Off</Button>
                <Button onClick="deactivateArmy">Deactivate</Button>
                <Button onClick="armyRefreshSpellTokens">Refresh Spells</Button>
            </VerticalLayout>
        </HorizontalLayout>
    </VerticalLayout>
</Panel>
```

**Note:** The `colors` attribute on the toggle bar will be dynamically generated based on the unit's assigned color. Same button opens AND closes the menu.

### Files to Modify
- [tts_lua_code/mod.lua](tts_lua_code/mod.lua) - the `perModelCode` string (lines 29-622)

### Key Architectural Requirement
**All UI code MUST be in `perModelCode`** - this ensures models are self-contained and work when saved/loaded into any table, not just the original mod save.

### TTS Documentation References
- [UI Introduction](https://api.tabletopsimulator.com/ui/introUI/)
- [Basic Elements](https://api.tabletopsimulator.com/ui/basicelements/)
- [Layout/Grouping](https://api.tabletopsimulator.com/ui/layoutgrouping/)
- [Input Elements (Button)](https://api.tabletopsimulator.com/ui/inputelements/)
- [UI Attributes](https://api.tabletopsimulator.com/ui/attributes/)

---
*This specification is ready for implementation. Use `/task physical-buttons` to begin development.*
