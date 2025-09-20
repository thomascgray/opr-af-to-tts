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
  originalCasterValue = number,
  currentToughValue = number,
  currentCasterValue = number,
  armyNameToAssign = "army_name"
}
```

## Per-Model Code System

The most sophisticated aspect is the `perModelCode` string (lines 21-619), a complete Lua script injected into every assigned model. This provides:

### Game Mechanics by System

**Grimdark Future (GF) / Age of Fantasy (AOF) / Age of Fantasy Regiments (AOFR):**

- Wounds = Tough value
- Status: Activated, Shaken
- Name format: "Name\nWounds: X/Y\nSpell Tokens: X/6"

**Grimdark Future Firefight (GFF) / Age of Fantasy Skirmish (AOFS):**

- Wounds = Tough + 5
- Status: Activated, Stunned
- Name format includes Tough rating display

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

**Method 1: Scripting Hotkeys**

- Key 1: `onScriptingButtonDown(1)` → Assign to selected objects
- Key 2: `onScriptingButtonDown(2)` → Cancel assignment

**Method 2: Pickup Detection**

- `onObjectPickUp()` → Auto-assign to picked up object

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

### Performance

- Dynamic UI generation scales with army size
- Vector line calculations for status circles
- JSON parsing and validation for API responses

### Extensibility

- Game system detection drives different mechanics
- Modular function structure for easy enhancement
- Tag-based object organization for batch operations
