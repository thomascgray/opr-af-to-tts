# TTS Lua API Learnings

## Object UI Positioning (Critical!)

TTS Object UI has a **counterintuitive coordinate system**. This was discovered through extensive trial and error.

### Position Axis

For `position="X Y Z"` on Object UI elements:
- **X** = left/right (relative to object)
- **Y** = forward/backward (depth)
- **Z** = **NEGATIVE values go UP** (counterintuitive!)

To place something above the model: `position="0 0 -150"` (negative Z)

### Rotation for Billboard-Style Panels

To create panels that stand upright and face the player (like billboards):

```
rotation="90 180 0"
```

- **90 on X** = tilts the panel to stand upright (from lying flat to vertical)
- **180 on Y** = faces the panel toward the player (models are rotated 180 on Y when assigned)
- **0 on Z** = no spin

### Complete Working Example

```lua
-- Get actual model height in world units
local bounds = self.getBounds()
local actualHeight = bounds['size']['y']

-- Calculate positions (negative Z = up, ~100 units per inch)
local toggleBarZ = -((actualHeight * 100) + 50)
local actionPanelZ = -((actualHeight * 100) + 220)

local xml = '<Panel position="0 0 ' .. toggleBarZ .. '" rotation="90 180 0" width="80" height="30">' ..
    '<Button onClick="myFunction">Menu</Button>' ..
'</Panel>'

self.UI.setXml(xml)
```

### getBounds() vs getBoundsNormalized()

- **`getBounds()`** = Returns actual world-space dimensions. Different model geometries return different sizes. **Use this for positioning UI based on model size.**
- **`getBoundsNormalized()`** = Returns normalized values relative to object transform. Does NOT vary between different model geometries - only reflects scale changes.

### UI Units

Approximately **100 UI units = 1 inch** in TTS world space.

Formula for height above model:
```lua
local uiHeight = -((modelHeightInInches * 100) + spacerOffset)
```

### Rotation Reference (from TTS docs)

- **X rotation** = tilts like a dish (forward/back)
- **Y rotation** = tilts like a dish (side to side)
- **Z rotation** = turns like a steering wheel (in-plane spin)

### What NOT to do

These combinations were tried and failed:

| Position | Rotation | Result |
|----------|----------|--------|
| `"0 Y 0"` | `"0 180 0"` | Wrong position, still flat |
| `"0 Y 0"` | `"90 0 0"` | In ground, backwards |
| `"0 Y 0"` | `"-90 0 0"` | Standing but wrong position |
| `"0 0 +Z"` | `"180 180 0"` | Far below model |
| `"0 0 -Z"` | `"180 180 0"` | Correct height but flat |

Only `position="0 0 -Z"` with `rotation="90 180 0"` works correctly.

## Object Script Lifecycle

### setLuaScript() Does NOT Trigger onLoad()

When assigning a Lua script to an object:

```lua
target.setLuaScript(luaCode)
target.reload()  -- REQUIRED for onLoad() to execute!
```

Without `reload()`, the script is set but `onLoad()` never runs.

## Nested String Delimiters in Lua

Cannot use `[[...]]` inside code that's already wrapped in `[[...]]`:

```lua
-- BAD - nested [[ ]] breaks
local perModelCode = [[
    local xml = [[<Panel>...</Panel>]]  -- SYNTAX ERROR
]]

-- GOOD - use string concatenation
local perModelCode = [[
    local xml = '<Panel>' ..
        '<Button>Click</Button>' ..
    '</Panel>'
]]
```

## Model Assignment Pattern

Models are rotated on assignment to face the player consistently:

```lua
target.setRotation({0, 180, 0})
target.reload()  -- Required for onLoad() to run and initialize UI
```

This means Object UI with `rotation="... 180 ..."` on Y will face toward the typical viewing angle.

**Note:** `reload()` IS required when the injected script needs `onLoad()` to run (e.g., to call `rebuildActionPanelXml()` for UI initialization). Without it, the script is set but `onLoad()` never executes.

## Inter-Object Communication

Objects can call functions on other objects using the `.call()` method:

```lua
-- Get all objects with a specific tag
local armyMates = getObjectsWithTag('OPRAFTTS_army_id_' .. armyId)

-- Call a function on each object
for _, armyMate in ipairs(armyMates) do
    if armyMate ~= self then  -- Skip self if needed
        armyMate.call('functionName')
    end
end
```

**Use case:** Closing all other menus in an army when one opens:
```lua
function closeMenuFromExternal()
    -- Function exposed for other objects to call
    self.UI.hide('action-panel')
    isActionPanelOpen = false
end

function toggleActionPanel()
    if not isActionPanelOpen then
        -- Close all other army menus first
        for _, mate in ipairs(getAllArmyMates()) do
            if mate ~= self then
                mate.call('closeMenuFromExternal')
            end
        end
    end
    -- Then open this one...
end
```

## Wait.frames() for Deferred Operations

When rebuilding UI with `setXml()`, state is reset. Use `Wait.frames()` to restore state after the UI initializes:

```lua
function rebuildActionPanelXml()
    local wasOpen = isActionPanelOpen
    self.UI.setXml(xml)
    isActionPanelOpen = false  -- Reset by setXml

    -- Restore state after 1 frame (UI needs time to initialize)
    if wasOpen then
        Wait.frames(function()
            self.UI.show('action-panel')
            isActionPanelOpen = true
        end, 1)
    end
end
```

## Dynamic UI Positioning with Offsets

Store per-object position/rotation offsets in memo for user adjustability:

```lua
-- In memo:
menuHeightOffset = 0,      -- Additive offset to Z position
menuRotationOffset = 0,    -- Additive offset to Y rotation

-- In buildActionPanelXml():
local heightOffset = decodedMemo['menuHeightOffset'] or 0
local rotationOffset = decodedMemo['menuRotationOffset'] or 0

local toggleBarZ = -((actualHeight * 100) + 80 + heightOffset)
local menuRotation = "90 " .. (180 + rotationOffset) .. " 0"
```

Adjustment functions:
```lua
function moveMenuUp()
    local currentOffset = decodedMemo['menuHeightOffset'] or 0
    updateMemo({ menuHeightOffset = currentOffset + 20 })
    rebuildActionPanelXml()
end
```

## UI Element Visibility and Attributes

Dynamically show/hide elements and modify attributes:

```lua
self.UI.show('element-id')
self.UI.hide('element-id')
self.UI.setAttribute('element-id', 'rotation', '90 180 180')
self.UI.setValue('element-id', 'new text')
```

**Panel rotation trick:** Flip a "^" character to look like "v" by rotating 180° on Z:
```lua
-- Normal: rotation="90 180 0" shows ^
-- Flipped: rotation="90 180 180" shows ^ upside down (like v)
```
