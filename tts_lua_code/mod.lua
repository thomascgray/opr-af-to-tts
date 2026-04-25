require("vscode/console")
-- OPR AF to TTS by Tombola
local army = {}
local armyId = nil; -- the army ID relative to OPR AF to TTS
local gameSystemToAssign = nil; -- the game system we're assigning, so models know what they are (for their right click menus)

local notecardGuid = 'e73b3a'
local oprAfToTtsLink = ""
local activeArmyListCardIndex = nil;

local nameOfModelAssigning = nil;
local nameToAssign = nil;
local descriptionToAssign = nil;
local unitIdToAssign = nil;
local originalToughValueToAssign = nil;
local originalCasterValueToAssign = nil;
local armyNameToAssign = nil;
local unitColorToAssign = nil;
local unitColorAssignments = {}  -- Maps unitId -> color for consistent unit coloring

-- Global Font Scaling Constants
local GLOBAL_FONT_SCALING = {
    name_base = 26,
    name_decrease = 4,
    loadout_base = 20,
    loadout_decrease = 2
}

-- Unit Color Palette for visual distinction (20 colors)
local UNIT_COLORS = {
    {0, 0, 255},        -- Blue
    {255, 0, 0},        -- Red
    {0, 255, 0},        -- Green
    {255, 255, 0},      -- Yellow
    {255, 0, 255},      -- Magenta
    {0, 255, 255},      -- Cyan
    {255, 128, 0},      -- Orange
    {128, 0, 255},      -- Purple
    {0, 128, 0},        -- Dark Green
    {128, 128, 0},      -- Olive
    {255, 192, 204},    -- Pink
    {0, 0, 128},        -- Navy
    {128, 64, 0},       -- Brown
    {192, 192, 192},    -- Silver
    {255, 215, 0},      -- Gold
    {0, 128, 128},      -- Teal
    {128, 0, 0},        -- Maroon
    {128, 128, 255},    -- Light Blue
    {255, 128, 128},    -- Salmon
    {128, 255, 128},    -- Light Green
}
local unitColorIndexCounter = 0  -- Track which color to assign next

-- When saving, remove the --lua
-- local perModelCode = [[
local perModelCode = [[
    function tablelength(T)
        local c = 0
        for _ in pairs(T) do c = c + 1 end
        return c
    end

    function numOrMin(a, b) return (a < b) and b or a end
    function numOrMax(a, b) return (a > b) and b or a end

    function mergeTables(t1, t2)
        local out = {}
        for k, v in pairs(t1) do out[k] = v end
        for k, v in pairs(t2) do out[k] = v end
        return out
    end

    -- Constants
    local MEASURING_RADII = {3, 6, 9, 12, 18, 24, 30}
    local FONT_SCALING = {
        name_base = 26,
        name_decrease = 4,
        loadout_base = 20,
        loadout_decrease = 2
    }

    -- Game System Helper Functions
    function isTraditionalSystem(gameSystem)
        return gameSystem == 'gf' or gameSystem == 'aof' or gameSystem == 'aofr'
    end

    function isSkirmishSystem(gameSystem)
        return gameSystem == 'aofs' or gameSystem == 'gff'
    end

    -- Memo Update Helper
    function updateMemo(updates)
        local decodedMemo = JSON.decode(self.memo)
        self.memo = JSON.encode(mergeTables(decodedMemo, updates))
    end

    -- Generic Toggle Function for Unit-wide Status
    function toggleUnitStatus(statusField, statusName)
        local decodedMemo = JSON.decode(self.memo)
        local unitMates = getAllUnitMates()
        printToAll("'" .. decodedMemo['unitName'] .. "' toggled " .. statusName)

        for _, unitMate in ipairs(unitMates) do
            local mateMemo = JSON.decode(unitMate.memo)
            unitMate.memo = JSON.encode(mergeTables(mateMemo, {
                [statusField] = not decodedMemo[statusField]
            }))
            unitMate.call('rebuildContext')
            unitMate.call('rebuildStatusEffectThings')
        end
    end

    function onLoad()
        local bounds = self.getBoundsNormalized();
        modelSizeX = bounds['size']['x'];
        modelSizeY = bounds['size']['y'];
        local decodedMemo = JSON.decode(self.memo)

        measuringCircle = {
            color             = {255, 255, 255, 0.9}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 64,          --number of segments that make up the circle
            thickness         = 0.05,         --thickness of the circle line
            vertical_position = 0.5,         --vertical height of the circle relative to the object
        }

        isActivatedCircle = {
            color             = {46 / 255, 204 / 255, 113 / 255, 1}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 16,          --number of segments that make up the circle
            thickness         = 0.1,         --thickness of the circle line
        }

        isShakenCircle = {
            color             = {241 / 255, 196 / 255, 15 / 255, 1}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 5,          --number of segments that make up the circle
            thickness         = 0.2,         --thickness of the circle line
        }

        isStunnedCircle = {
            color             = {231 / 255, 76 / 255, 60 / 255, 1}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 6,          --number of segments that make up the circle
            thickness         = 0.2,         --thickness of the circle line
        }

        rebuildContext();
        rebuildStatusEffectThings();
        rebuildName();
        rebuildActionPanelXml();
        applyHighlightFromMemo();  -- TTS doesn't persist highlights across save/reload
    end

    -- Hover hotkeys — live on the model itself so they travel with the object
    -- when a user saves it to their library and loads it into a new map
    -- without the mod's Global script. TTS fires this event on every object's
    -- script (not just the hovered one), so each instance gates on
    -- `getHoverObject() == self` and only the hovered model acts.
    function onScriptingButtonDown(index, player_color)
        local player = Player[player_color]
        if player == nil then return end
        if player.getHoverObject() ~= self then return end

        -- In the mod's host map, keys 1/2 drive the assignment flow; defer to
        -- Global for those while an assignment is pending. In a new map where
        -- the mod isn't loaded, Global.call returns nil (function missing) so
        -- this short-circuits to false and hotkeys run unconditionally.
        if Global.call('isAssigning') then return end

        local decodedMemo = JSON.decode(self.memo)
        local gameSystem = decodedMemo['gameSystem']
        local hasTough = decodedMemo['originalToughValue'] ~= 0 or isSkirmishSystem(gameSystem)
        local hasCaster = decodedMemo['originalCasterValue'] ~= 0

        if index == 1 then
            toggleActionPanel()
        elseif index == 2 and hasTough then
            hpDown()
        elseif index == 3 and hasTough then
            hpUp()
        elseif index == 4 and hasCaster then
            spellTokensDown()
        elseif index == 5 and hasCaster then
            spellTokensUp()
        elseif index == 6 then
            cycleMeasuringRadius()
        end
    end

    -- Adjust a numeric memo field by delta, announce, and refresh the panel.
    -- No name rebuild — HP/SP are shown by the floating stat bars, not the name.
    function adjustStat(field, delta, verb)
        local decodedMemo = JSON.decode(self.memo)
        printToAll("'" .. decodedMemo['unitName'] .. "' " .. verb)
        updateMemo({ [field] = decodedMemo[field] + delta })
        rebuildActionPanelXml()
    end

    function hpUp()            adjustStat('currentToughValue',   1, 'gained 1 HP.') end
    function hpDown()          adjustStat('currentToughValue',  -1, 'lost 1 HP.') end
    function spellTokensUp()   adjustStat('currentCasterValue',  1, 'gained 1 Spell Token.') end
    function spellTokensDown() adjustStat('currentCasterValue', -1, 'lost 1 Spell Token.') end

    function toggleActivated(player_color)
        toggleUnitStatus('isActivated', 'activation')
    end

    function toggleStunned(player_color)
        toggleUnitStatus('isStunned', 'Stunned')
    end

    function toggleShaken(player_color)
        toggleUnitStatus('isShaken', 'Shaken')
    end

    -- Grouped-boolean unit toggle for UI flags: if any mate has the flag
    -- explicitly false, flip ALL mates on. Otherwise (all on) flip them all
    -- off. Missing flags (pre-upgrade models) count as on, matching the
    -- default-visible treatment used elsewhere.
    function toggleUnitUiFlag(flagField)
        local unitMates = getAllUnitMates()

        local anyOff = false
        for _, unitMate in ipairs(unitMates) do
            if JSON.decode(unitMate.memo)[flagField] == false then
                anyOff = true
                break
            end
        end
        local newValue = anyOff

        for _, unitMate in ipairs(unitMates) do
            local mateMemo = JSON.decode(unitMate.memo)
            unitMate.memo = JSON.encode(mergeTables(mateMemo, {
                [flagField] = newValue
            }))
            unitMate.call('rebuildActionPanelXml')
        end
    end

    -- Per-model variant: flips the flag on self only.
    function toggleModelUiFlag(flagField)
        local decodedMemo = JSON.decode(self.memo)
        local current = decodedMemo[flagField]
        if current == nil then current = true end
        updateMemo({ [flagField] = not current })
        rebuildActionPanelXml()
    end

    function toggleHpBar(player_color)        toggleUnitUiFlag('showHpBar')        end
    function toggleSpBar(player_color)        toggleUnitUiFlag('showSpBar')        end
    function toggleMeasuringBar(player_color) toggleUnitUiFlag('showMeasuringBar') end

    function toggleHpBarModel(player_color)        toggleModelUiFlag('showHpBar')        end
    function toggleSpBarModel(player_color)        toggleModelUiFlag('showSpBar')        end
    function toggleMeasuringBarModel(player_color) toggleModelUiFlag('showMeasuringBar') end

    -- Shared palette for the Measuring Ring Colour and Unit Highlight pickers.
    -- Each named colour has a light (full-saturation UI palette hex) and dark
    -- (~0.6 luminance) variant, rendered as two rows in each picker.
    PALETTE = {
        {name = 'white',  light = {hex = '#ffffff', rgb = {1, 1, 1}},                              dark = {hex = '#999999', rgb = {153/255, 153/255, 153/255}}},
        {name = 'red',    light = {hex = '#e74c3c', rgb = {231/255, 76/255, 60/255}},              dark = {hex = '#962d22', rgb = {150/255, 45/255, 34/255}}},
        {name = 'orange', light = {hex = '#e67e22', rgb = {230/255, 126/255, 34/255}},             dark = {hex = '#8a4b14', rgb = {138/255, 75/255, 20/255}}},
        {name = 'yellow', light = {hex = '#f1c40f', rgb = {241/255, 196/255, 15/255}},             dark = {hex = '#907509', rgb = {144/255, 117/255, 9/255}}},
        {name = 'green',  light = {hex = '#2ecc71', rgb = {46/255, 204/255, 113/255}},             dark = {hex = '#1b7a43', rgb = {27/255, 122/255, 67/255}}},
        {name = 'blue',   light = {hex = '#3498db', rgb = {52/255, 152/255, 219/255}},             dark = {hex = '#1f5b83', rgb = {31/255, 91/255, 131/255}}},
        {name = 'purple', light = {hex = '#9b59b6', rgb = {155/255, 89/255, 182/255}},             dark = {hex = '#5d356d', rgb = {93/255, 53/255, 109/255}}},
        {name = 'pink',   light = {hex = '#e84393', rgb = {232/255, 67/255, 147/255}},             dark = {hex = '#8b2858', rgb = {139/255, 40/255, 88/255}}},
    }

    -- Look up an {r,g,b} triple from a button id like 'ring-color-red-light'
    -- or 'highlight-color-blue-dark'. Returns nil if the id doesn't match.
    function paletteLookup(id, prefix)
        local name, variant = id:match('^' .. prefix .. '%-(.-)%-(.+)$')
        if not name then return nil end
        for _, p in ipairs(PALETTE) do
            if p.name == name then
                return (variant == 'dark') and p.dark.rgb or p.light.rgb
            end
        end
        return nil
    end

    -- Button onClick handler. Reads the colour preset from the element id.
    function setRingColor(player, value, id)
        local color = paletteLookup(id, 'ring%-color')
        if not color then return end

        for _, unitMate in ipairs(getAllUnitMates()) do
            local mateMemo = JSON.decode(unitMate.memo)
            unitMate.memo = JSON.encode(mergeTables(mateMemo, { measuringRingColor = color }))
            unitMate.call('rebuildStatusEffectThings')
            unitMate.call('rebuildActionPanelXml')  -- so the measuring-bar text recolours too
        end
    end

    -- Unit Highlight: applies a persistent TTS Object highlight to every model
    -- in the unit. Click a colour to set; Clear Highlight to remove. The chosen
    -- colour is stored in each mate's memo so we can re-apply on onLoad.
    --
    -- `previouslyAppliedHighlight` is a script-local (not memo-persisted)
    -- cache of the colour currently drawn by TTS, so we can pass it back to
    -- `highlightOff` when switching colours.
    previouslyAppliedHighlight = nil

    function applyHighlightFromMemo()
        local decodedMemo = JSON.decode(self.memo)
        local newColor = decodedMemo['unitHighlightColor']

        if previouslyAppliedHighlight then
            self.highlightOff(previouslyAppliedHighlight)
            previouslyAppliedHighlight = nil
        end

        if newColor then
            self.highlightOn(newColor)
            previouslyAppliedHighlight = newColor
        end
    end

    function setHighlightColor(player, value, id)
        local color = paletteLookup(id, 'highlight%-color')
        if not color then return end

        for _, unitMate in ipairs(getAllUnitMates()) do
            local mateMemo = JSON.decode(unitMate.memo)
            unitMate.memo = JSON.encode(mergeTables(mateMemo, { unitHighlightColor = color }))
            unitMate.call('applyHighlightFromMemo')
        end
    end

    function clearUnitHighlight()
        for _, unitMate in ipairs(getAllUnitMates()) do
            local mateMemo = JSON.decode(unitMate.memo)
            -- `false` rather than nil: mergeTables only iterates non-nil keys,
            -- so nil wouldn't actually clear the field from the encoded memo.
            unitMate.memo = JSON.encode(mergeTables(mateMemo, { unitHighlightColor = false }))
            unitMate.call('applyHighlightFromMemo')
        end
    end

    function getAllUnitMates()
        local decodedMemo = JSON.decode(self.memo)
        local unitObjects = getObjectsWithTag('OPRAFTTS_unit_id_' .. decodedMemo['unitId'])
        return unitObjects
    end

    function getAllArmyMates()
        local decodedMemo = JSON.decode(self.memo)
        local armyObjects = getObjectsWithTag('OPRAFTTS_army_id_' .. decodedMemo['armyId'])
        return armyObjects
    end

    function selectAllUnit(playerOrColor)
        -- Context-menu callbacks pass a color string; Object UI Button onClick
        -- passes a Player object. Normalize to a color string.
        local color = playerOrColor
        if type(color) ~= 'string' then
            color = playerOrColor.color
        end

        local unitMates = getAllUnitMates()
        for _, unitMate in ipairs(unitMates) do
            unitMate.addToPlayerSelection(color)
        end
    end

    function countUnit(player_color)
        local unitMates = getAllUnitMates();
        local decodedMemo = JSON.decode(self.memo)
        printToAll("Unit '" .. decodedMemo['unitName'] .. "' has " .. tablelength(unitMates) .." models remaining.")
    end

    function deactivateArmy()
        local armyMates = getAllArmyMates();
        local decodedMemo = JSON.decode(self.memo)
        printToAll("'" .. decodedMemo['armyNameToAssign'] .. "' deactivated")

        for _, armyMate in ipairs(armyMates) do
            armyMate.memo = JSON.encode(mergeTables(JSON.decode(armyMate.memo), {
                isActivated = false,
            }))

            armyMate.call('rebuildContext');
            armyMate.call('rebuildStatusEffectThings');
        end
    end

    function armyRefreshSpellTokens()
        local armyMates = getAllArmyMates();
        local decodedMemo = JSON.decode(self.memo)
        printToAll("'" .. decodedMemo['armyNameToAssign'] .. "' Spell Tokens refreshed")

        for _, armyMate in ipairs(armyMates) do
            local armyMateMemo = JSON.decode(armyMate.memo);

            armyMate.memo = JSON.encode(mergeTables(armyMateMemo, {
                currentCasterValue = numOrMax(armyMateMemo['currentCasterValue'] + armyMateMemo['originalCasterValue'], 6),
            }))
            armyMate.call('rebuildActionPanelXml');
        end
    end

    -- code taken from https://pastebin.com/Y1tTQ8Yw with huge appreciation to the original author
    function getCircleVectorPoints(radius, steps, y, accountForScale)
        local bounds = self.getBoundsNormalized();
        local scale = self.getScale();

        local halfOfBaseWidth = bounds['size']['x'] / 2;
        local halfOfBaseLength = bounds['size']['z'] / 2;

        local xRadius = numOrMin(radius + halfOfBaseWidth, 0.4);
        local zRadius = numOrMin(radius + halfOfBaseLength, 0.4);

        -- if we account for scale, then 3'' will always be 3'' even if the model is scaled up
        if (accountForScale) then
            xRadius = xRadius / scale['x'];
            zRadius = zRadius / scale['z'];
        end

        local t = {}
        local d,s,c,r = 360/steps, math.sin, math.cos, math.rad
        for i = 0,steps do
            table.insert(t, {
                c(r(d*i)) * xRadius,                   -- x
                y,                                  -- y
                s(r(d*i)) * zRadius                 -- z
            })
        end
        return t
    end
    
    function cycleMeasuringRadius()
        local decodedMemo = JSON.decode(self.memo)

        local currentIndex = 0
        for i, radius in ipairs(MEASURING_RADII) do
            if measuringCircle.radius == radius then
                currentIndex = i
                break
            end
        end

        if currentIndex == 0 or currentIndex == #MEASURING_RADII then
            measuringCircle.radius = currentIndex == 0 and MEASURING_RADII[1] or 0
        else
            measuringCircle.radius = MEASURING_RADII[currentIndex + 1]
        end

    
        if measuringCircle.radius == 0 then
            printToAll("'" .. decodedMemo['unitName'] .. "' model measuring aura turned off")
        else
            printToAll("'" .. decodedMemo['unitName'] .. "' model measuring aura set to " .. measuringCircle.radius .. "''")
        end

        rebuildStatusEffectThings();
        rebuildActionPanelXml();
    end

    -- Legacy function kept for backward compatibility with old models
    function cycleShowHideWoundsAndSpellTokens()
        -- HP/SP display is now handled by XML-based stat bars (always visible)
    end

    function rebuildStatusEffectThings()
        local decodedMemo = JSON.decode(self.memo)

        -- Sync measuring ring colour from memo (unit-wide; missing defaults to white)
        local ringColor = decodedMemo['measuringRingColor'] or {1, 1, 1}
        measuringCircle.color = {ringColor[1], ringColor[2], ringColor[3], 0.9}

        local vectorPointsTable = {}

        local scale = self.getScale();
        local heightForCircles = 0.4 / scale['y'];

        if (measuringCircle.radius > 0) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(measuringCircle.radius, measuringCircle.steps, measuringCircle.vertical_position, true),
                color     = measuringCircle.color,
                thickness = measuringCircle.thickness,
                rotation  = {0,0,0},
            })
        end
        if (decodedMemo['isActivated']) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(isActivatedCircle.radius, isActivatedCircle.steps, heightForCircles, true),
                color     = isActivatedCircle.color,
                thickness = isActivatedCircle.thickness,
                rotation  = {0,0,0},
            })
        end

        if (decodedMemo['isShaken']) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(isShakenCircle.radius, isShakenCircle.steps, heightForCircles + 0.2, true),
                color     = isShakenCircle.color,
                thickness = isShakenCircle.thickness,
                rotation  = {0,0,0},
            })
        end

        if (decodedMemo['isStunned']) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(isStunnedCircle.radius, isStunnedCircle.steps, heightForCircles + 0.2, true),
                color     = isStunnedCircle.color,
                thickness = isStunnedCircle.thickness,
                rotation  = {0,0,0},
            })
        end
    
        self.setVectorLines(vectorPointsTable)
    end

    -- Legacy function kept for backward compatibility with old models
    -- HP/SP display is now handled by XML-based stat bars in rebuildActionPanelXml()
    function rebuildXml()
        self.clearButtons();
    end

    -- Sets the tooltip name. HP and spell tokens are now shown by the floating
    -- stat bars, so only static info lives here — the base name for every
    -- system, plus the Tough rating for skirmish models that have one (it's a
    -- unit rating, not a current-state value, so it belongs in the name).
    function rebuildName()
        local decodedMemo = JSON.decode(self.memo)
        local nameToAssign = decodedMemo['nameToAssign']

        if isSkirmishSystem(decodedMemo['gameSystem']) and decodedMemo['originalToughValue'] ~= 0 then
            nameToAssign = nameToAssign .. "\r\nTough: " .. decodedMemo['originalToughValue']
        end

        self.setName(nameToAssign)
    end

    function measuringOff()
        local decodedMemo = JSON.decode(self.memo)
        measuringCircle.radius = 0;
        printToAll("'" .. decodedMemo['unitName'] .. "' Measuring Off")
        rebuildStatusEffectThings();
        rebuildActionPanelXml();
    end

    function measuringOffArmy()
        local decodedMemo = JSON.decode(self.memo)

        local armyMates = getAllArmyMates();
        for _, armyMate in ipairs(armyMates) do
            armyMate.call('measuringOff');
        end
        
        printToAll("'" .. decodedMemo['armyNameToAssign'] .. "' Measuring Off")
        rebuildStatusEffectThings();

    end
    
    -- Menu position/rotation adjustment functions
    function adjustMenuOffset(field, delta)
        local decodedMemo = JSON.decode(self.memo)
        updateMemo({ [field] = (decodedMemo[field] or 0) + delta })
        rebuildActionPanelXml()
    end

    function moveMenuUp()      adjustMenuOffset('menuHeightOffset',    20) end
    function moveMenuDown()    adjustMenuOffset('menuHeightOffset',   -20) end
    function rotateMenuLeft()  adjustMenuOffset('menuRotationOffset', -15) end
    function rotateMenuRight() adjustMenuOffset('menuRotationOffset',  15) end

    function rebuildContext()
        self.clearContextMenu()
        local decodedMemo = JSON.decode(self.memo)
        local gameSystem = decodedMemo['gameSystem']

        self.addContextMenuItem("Toggle Menu", toggleActionPanel, false)
        self.addContextMenuItem("Activated", toggleActivated, false)
        if isTraditionalSystem(gameSystem) then
            self.addContextMenuItem("Shaken", toggleShaken, false)
        end
        if isSkirmishSystem(gameSystem) then
            self.addContextMenuItem("Stunned", toggleStunned, false)
        end
        self.addContextMenuItem("Measuring", cycleMeasuringRadius, true)
    end

    -- Action Panel UI State
    isActionPanelOpen = false

    function closeActionPanel()
        if not isActionPanelOpen then return end
        self.UI.hide('action-panel')
        isActionPanelOpen = false
    end
    -- Alias: called by army mates when another menu opens.
    closeMenuFromExternal = closeActionPanel

    function toggleActionPanel(player, value, id)
        if isActionPanelOpen then
            self.UI.hide('action-panel')
            isActionPanelOpen = false
        else
            -- Close all other menus in the same army before opening this one
            local armyMates = getAllArmyMates()
            for _, armyMate in ipairs(armyMates) do
                if armyMate ~= self then
                    armyMate.call('closeMenuFromExternal')
                end
            end

            self.UI.show('action-panel')
            isActionPanelOpen = true
        end
    end

    function buildActionPanelXml()
        local decodedMemo = JSON.decode(self.memo)
        local gameSystem  = decodedMemo['gameSystem']
        local hasTough    = decodedMemo['originalToughValue'] ~= 0 or isSkirmishSystem(gameSystem)
        local hasCaster   = decodedMemo['originalCasterValue'] ~= 0

        -- UI visibility flags. Missing (pre-upgrade models) defaults to true; any
        -- stored value other than `false` (i.e. nil or true) means visible.
        local showHpBar        = decodedMemo['showHpBar']        ~= false
        local showSpBar        = decodedMemo['showSpBar']        ~= false
        local showMeasuringBar = decodedMemo['showMeasuringBar'] ~= false

        local currentTough  = decodedMemo['currentToughValue']  or 0
        local originalTough = decodedMemo['originalToughValue'] or 0
        local currentCaster = decodedMemo['currentCasterValue'] or 0

        local ringColor = decodedMemo['measuringRingColor'] or {1, 1, 1}
        local ringColorHex = string.format("#%02x%02x%02x",
            math.floor(ringColor[1] * 255), math.floor(ringColor[2] * 255), math.floor(ringColor[3] * 255))

        local btnColors    = 'colors="rgba(255,255,255,0.9)|rgba(255,255,255,1)|rgba(200,200,200,1)|rgba(128,128,128,0.5)"'
        local barBtnColors = 'colors="rgba(0,0,0,0.4)|rgba(0,0,0,0.7)|rgba(0,0,0,0.9)|rgba(0,0,0,0.2)"'

        -- XML builder helpers. All close over btnColors / barBtnColors.
        local function btn(onClick, label, fontSize)
            return '<Button onClick="' .. onClick .. '" fontSize="' .. (fontSize or 14) .. '" ' .. btnColors .. '>' .. label .. '</Button>'
        end
        local function section(title, innerXml)
            return '<Panel color="rgba(0,0,0,0.85)" padding="10">' ..
                '<VerticalLayout spacing="5" childForceExpandHeight="false">' ..
                    '<Text fontSize="16" fontStyle="Bold" color="#FFFFFF">' .. title .. '</Text>' ..
                    innerXml ..
                '</VerticalLayout>' ..
            '</Panel>'
        end
        local function column(title, buttons, width)
            width = width or 110
            return '<VerticalLayout spacing="5" minWidth="' .. width .. '" preferredWidth="' .. width .. '">' ..
                '<Text fontSize="16" fontStyle="Bold" color="#FFFFFF">' .. title .. '</Text>' ..
                buttons ..
            '</VerticalLayout>'
        end
        -- Progress-bar style: outer Panel's colour is the border frame. Inside,
        -- a HorizontalLayout with padding=2 exposes 2px of that colour around a
        -- row of two Panels — fill (in `color`) sized to current/max, and empty
        -- (dark) filling the remainder. A second HorizontalLayout sibling holds
        -- the interactive buttons + text on top.
        local function statBar(color, label, onDown, onUp, current, max)
            local innerW = 172   -- bar is 176 wide; 2px padding each side
            local fillW = 0
            if max > 0 then
                fillW = math.max(0, math.min(innerW, math.floor(innerW * current / max)))
            end
            local emptyW = innerW - fillW
            return '<Panel color="' .. color .. '" minHeight="24" preferredHeight="24">' ..
                '<HorizontalLayout spacing="0" padding="2" childForceExpandWidth="false" childForceExpandHeight="true">' ..
                    '<Panel color="' .. color .. '" minWidth="' .. fillW .. '" preferredWidth="' .. fillW .. '" />' ..
                    '<Panel color="rgba(0,0,0,0.7)" minWidth="' .. emptyW .. '" preferredWidth="' .. emptyW .. '" />' ..
                '</HorizontalLayout>' ..
                '<HorizontalLayout spacing="0" padding="0" childForceExpandWidth="false" childAlignment="MiddleCenter">' ..
                    '<Button minWidth="24" preferredWidth="24" height="24" onClick="' .. onDown .. '" fontSize="18" fontStyle="Bold" textColor="#FFFFFF" ' .. barBtnColors .. '>-</Button>' ..
                    '<Text minWidth="80" preferredWidth="80" fontSize="16" fontStyle="Bold" color="#FFFFFF">' .. label .. '</Text>' ..
                    '<Button minWidth="24" preferredWidth="24" height="24" onClick="' .. onUp .. '" fontSize="18" fontStyle="Bold" textColor="#FFFFFF" ' .. barBtnColors .. '>+</Button>' ..
                '</HorizontalLayout>' ..
            '</Panel>'
        end

        -- Model column (conditional on stats)
        local modelButtons = ""
        if hasTough  then modelButtons = modelButtons .. btn('hpUp', 'HP +') .. btn('hpDown', 'HP -') end
        if hasCaster then modelButtons = modelButtons .. btn('spellTokensUp', 'SP +') .. btn('spellTokensDown', 'SP -') end
        modelButtons = modelButtons .. btn('cycleMeasuringRadius', 'Measuring') .. btn('measuringOff', 'Measuring Off', 12)

        -- Unit column (conditional on game system)
        local unitButtons = btn('toggleActivated', 'Activated')
        if isSkirmishSystem(gameSystem)    then unitButtons = unitButtons .. btn('toggleStunned', 'Stunned') end
        if isTraditionalSystem(gameSystem) then unitButtons = unitButtons .. btn('toggleShaken',  'Shaken')  end
        unitButtons = unitButtons .. btn('selectAllUnit', 'Select All') .. btn('countUnit', 'Count')

        -- Army column
        local armyButtons = btn('measuringOffArmy', 'Measuring Off', 12) ..
            btn('deactivateArmy', 'Deactivate') ..
            btn('armyRefreshSpellTokens', 'Refresh Spells', 12)

        -- Positions + rotations. See CLAUDE/tts-lua-api-learnings.md for the axis
        -- rules (negative Z = up for position; yaw is Z on the outer wrapper to
        -- compose cleanly with the X=90/Y=180 billboard).
        local actualHeight   = self.getBounds()['size']['y']
        local heightOffset   = decodedMemo['menuHeightOffset']   or 0
        local rotationOffset = decodedMemo['menuRotationOffset'] or 0
        local statBarsZ      = -((actualHeight * 100) + 130 + heightOffset)
        local actionPanelZ   = -((actualHeight * 100) + 530 + heightOffset)
        local menuRotation   = "90 180 0"
        local yawRotation    = "0 0 " .. rotationOffset

        -- Stat bars: HP/SP gated on unit stat + user toggle; measuring only when
        -- radius > 0 AND its toggle is on.
        local showHp        = hasTough and showHpBar
        local showSp        = hasCaster and showSpBar
        local showMeasuring = (measuringCircle.radius > 0) and showMeasuringBar
        local statBarsXml = ""
        if showHp or showSp or showMeasuring then
            local barContents = ""
            if showHp then
                -- Skirmish: max = tough + 5. Traditional: max = original tough.
                local maxWounds = isSkirmishSystem(gameSystem) and (originalTough + 5) or originalTough
                barContents = barContents .. statBar('#e74c3c', 'HP: ' .. currentTough .. '/' .. maxWounds, 'hpDown', 'hpUp', currentTough, maxWounds)
            end
            if showSp then
                barContents = barContents .. statBar('#3498db', 'SP: ' .. currentCaster .. '/6', 'spellTokensDown', 'spellTokensUp', currentCaster, 6)
            end
            if showMeasuring then
                -- Transparent background, ring-coloured text.
                barContents = barContents .. '<Panel color="rgba(0,0,0,0)" minHeight="24" preferredHeight="24">' ..
                    '<Text fontSize="16" fontStyle="Bold" color="' .. ringColorHex .. '">Measuring ' .. measuringCircle.radius .. "''" .. '</Text>' ..
                '</Panel>'
            end

            local barCount = (showHp and 1 or 0) + (showSp and 1 or 0) + (showMeasuring and 1 or 0)
            local panelHeight = (barCount * 26) + ((barCount - 1) * 4) + 4  -- 26 per bar + spacing + padding

            -- Same outer-yaw / inner-billboard split as the action panel.
            statBarsXml = '<Panel id="stat-bars-panel" position="0 0 ' .. statBarsZ .. '" rotation="' .. yawRotation .. '" width="180" height="' .. panelHeight .. '">' ..
                '<Panel rotation="' .. menuRotation .. '" width="180" height="' .. panelHeight .. '">' ..
                    '<VerticalLayout spacing="4" padding="2" childAlignment="MiddleCenter" childForceExpandHeight="false">' ..
                        barContents ..
                    '</VerticalLayout>' ..
                '</Panel>' ..
            '</Panel>'
        end

        -- UI Toggles: two columns — per-model flags on the left, unit-wide on
        -- the right. Actual on/off state lives in memo and is evaluated at
        -- click time; the buttons themselves don't reflect current state.
        local modelToggleBtns = ""
        local unitToggleBtns  = ""
        if hasTough then
            modelToggleBtns = modelToggleBtns .. btn('toggleHpBarModel', 'HP Bar')
            unitToggleBtns  = unitToggleBtns  .. btn('toggleHpBar',      'HP Bar')
        end
        if hasCaster then
            modelToggleBtns = modelToggleBtns .. btn('toggleSpBarModel', 'SP Bar')
            unitToggleBtns  = unitToggleBtns  .. btn('toggleSpBar',      'SP Bar')
        end
        modelToggleBtns = modelToggleBtns .. btn('toggleMeasuringBarModel', 'Measure Distance Indicator', 12)
        unitToggleBtns  = unitToggleBtns  .. btn('toggleMeasuringBar',      'Measure Distance Indicator', 12)

        local uiTogglesXml = section('Floating UI Visibility',
            '<HorizontalLayout spacing="10" childForceExpandWidth="false">' ..
                column('Model', modelToggleBtns, 170) ..
                column('Unit',  unitToggleBtns,  170) ..
            '</HorizontalLayout>')

        -- Colour picker row: one HorizontalLayout of 32x32 buttons, one per
        -- palette entry's named variant. `idPrefix` is prepended to build ids
        -- like `ring-color-red-light` / `highlight-color-blue-dark`, which the
        -- onClick handlers parse back via paletteLookup.
        local function colorPickerRow(idPrefix, onClick, variantKey)
            local btns = ""
            for _, p in ipairs(PALETTE) do
                local v = (variantKey == 'dark') and p.dark or p.light
                btns = btns .. '<Button id="' .. idPrefix .. '-' .. p.name .. '-' .. variantKey .. '" onClick="' .. onClick .. '" minWidth="32" preferredWidth="32" height="32" color="' .. v.hex .. '"></Button>'
            end
            return '<HorizontalLayout spacing="10" childForceExpandWidth="false" childAlignment="MiddleCenter">' .. btns .. '</HorizontalLayout>'
        end

        local ringColourXml = section('Measuring Ring Colour',
            colorPickerRow('ring-color', 'setRingColor', 'light') ..
            colorPickerRow('ring-color', 'setRingColor', 'dark'))

        -- Unit Highlight: same palette, plus a Clear Highlight button.
        local highlightXml = section('Unit Highlight',
            colorPickerRow('highlight-color', 'setHighlightColor', 'light') ..
            colorPickerRow('highlight-color', 'setHighlightColor', 'dark') ..
            '<HorizontalLayout spacing="10" childForceExpandWidth="true">' ..
                btn('clearUnitHighlight', 'Clear Highlight') ..
            '</HorizontalLayout>')

        -- Floating-UI position row — shunts / rotates the whole billboard stack.
        local uiConfigXml = section('Model Floating UI Position',
            '<HorizontalLayout spacing="10" childForceExpandWidth="true">' ..
                btn('moveMenuUp', '▲ Up') .. btn('moveMenuDown', '▼ Down') ..
                btn('rotateMenuLeft', '↺ Left') .. btn('rotateMenuRight', '↻ Right') ..
            '</HorizontalLayout>')

        return '<Defaults><Button fontSize="14" fontStyle="Bold" /></Defaults>' ..
            statBarsXml ..
            '<Panel id="action-panel" position="0 0 ' .. actionPanelZ .. '" rotation="' .. yawRotation .. '" active="false" width="380" height="760">' ..
                '<Panel rotation="' .. menuRotation .. '" width="380" height="760">' ..
                    '<VerticalLayout spacing="5" padding="10" childForceExpandHeight="false" childForceExpandWidth="false">' ..
                        '<Panel color="rgba(0,0,0,0.85)" padding="10">' ..
                            '<HorizontalLayout spacing="10" childForceExpandWidth="false">' ..
                                column('Model', modelButtons) ..
                                column('Unit',  unitButtons) ..
                                column('Army',  armyButtons) ..
                            '</HorizontalLayout>' ..
                        '</Panel>' ..
                        ringColourXml .. highlightXml .. uiTogglesXml .. uiConfigXml ..
                    '</VerticalLayout>' ..
                    '<Button onClick="closeActionPanel" width="28" height="28" fontSize="14" fontStyle="Bold" textColor="#FFFFFF" color="#e74c3c" rectAlignment="UpperRight" offsetXY="-15 -15">X</Button>' ..
                '</Panel>' ..
            '</Panel>'
    end

    function rebuildActionPanelXml()
        local wasOpen = isActionPanelOpen
        local xml = buildActionPanelXml()
        self.UI.setXml(xml)
        isActionPanelOpen = false

        -- Restore open state if panel was open before rebuild
        if wasOpen then
            Wait.frames(function()
                self.UI.show('action-panel')
                isActionPanelOpen = true
            end, 1)
        end
    end
]]


function calculateFontSize(totalModels, startingValue, decreaseAmount)
    -- Use a formula to calculate y based on the value of x
    return startingValue - (decreaseAmount * (totalModels - 1));
end

local function BuildModelCard(modelDefinition, unitIndex, modelIndex, totalModelsInThisUnit)
    return string.format([[
        <Button id="%s-%s" onClick="Global/beginAssignment">
            <VerticalLayout childForceExpandHeight="false" height="200" padding="20" spacing="20">
                <Text fontSize="%s" fontStyle="bold" color="#2f3640">%s</Text>
                <Text fontSize="%s" color="#2f3640" fontStyle="italic">Loadout: %s</Text>
            </VerticalLayout>
        </Button>
    ]], unitIndex, modelIndex, calculateFontSize(totalModelsInThisUnit, GLOBAL_FONT_SCALING.name_base, GLOBAL_FONT_SCALING.name_decrease), modelDefinition['name']:gsub("%&", "<![CDATA[&]]>"), calculateFontSize(totalModelsInThisUnit, GLOBAL_FONT_SCALING.loadout_base, GLOBAL_FONT_SCALING.loadout_decrease), modelDefinition['loadoutCSV']:gsub("%&", "<![CDATA[&]]>"))
end

local function BuildUnitLayout(unitDefinition, unitIndex)
    local thisUnitsModelCardsXml = ''
    local totalModelsInThisUnit = tablelength(unitDefinition['modelDefinitions'])
    for index, modelDefinition in pairs(unitDefinition['modelDefinitions']) do
        thisUnitsModelCardsXml = thisUnitsModelCardsXml .. BuildModelCard(modelDefinition, unitIndex, index, totalModelsInThisUnit)
    end

    return string.format([[
        <VerticalLayout
        childForceExpandHeight="false"
          height="100"
          spacing="10">
          <Text
              fontSize="30"
              color="#FFFFFF"
              fontStyle="bold"
          >Ut: %s</Text>
          
            <HorizontalLayout
              spacing="40">
                %s
            </HorizontalLayout>
        </VerticalLayout>
        
    ]], unitDefinition['name']:gsub("%&", "<![CDATA[&]]>"), thisUnitsModelCardsXml)
end

local function BuildLayout(cardsXml, totalUnitCount)
    return string.format([[
        <Panel width="600" height="3500" position="-450,-1700,-1000">
        <VerticalScrollView scrollSensitivity="40" width="700" height="3500">
            <VerticalLayout
                width="600" 
                height="%s"
                spacing="40"
                padding="0 0 40 40"
            >%s</VerticalLayout>
            </VerticalScrollView>
        </Panel>
    ]], totalUnitCount * 350, cardsXml)
end


function cancelCurrentAssigning()
    nameOfModelAssigning = nil;
    nameToAssign = nil;
    descriptionToAssign = nil;
    unitIdToAssign = nil;
    originalToughValueToAssign = nil;
    originalCasterValueToAssign = nil;
    unitColorToAssign = nil;
end

-- insane that this isn't in the Lua standard library???
function tablelength(T)
    local count = 0
    for _ in pairs(T) do
        count = count + 1
    end
    return count
end

function string:split(inSplitPattern, outResults)
    if not outResults then
        outResults = {}
    end
    local theStart = 1
    local theSplitStart, theSplitEnd = string.find(self, inSplitPattern, theStart)
    while theSplitStart do
        table.insert(outResults, string.sub(self, theStart, theSplitStart - 1))
        theStart = theSplitEnd + 1
        theSplitStart, theSplitEnd = string.find(self, inSplitPattern, theStart)
    end
    table.insert(outResults, string.sub(self, theStart))
    return outResults
end

function onExternalCommand(input)
    print('VSCode: ' .. input)
end

function onTextInputChange(_, v)
    oprAfToTtsLink = v
end

function noop()
end

function onLoad(save_state)
end

function onSubmit()
    UI.hide("main-panel")
    WebRequest.get(oprAfToTtsLink, handleResponse)
end

function onCloseInput()
    UI.hide("main-panel")
end

function sendRequest(data)
    -- Perform the request
    WebRequest.get(oprAfToTtsLink, handleResponse)
end

function beginAssignment(player, _, id)
    local idxs = id:split("-")
    local unitIndex = tonumber(idxs[1]);
    local modelIndex = tonumber(idxs[2]);

    nameOfModelAssigning = army[unitIndex]['modelDefinitions'][modelIndex]['name']
    nameToAssign = army[unitIndex]['modelDefinitions'][modelIndex]['ttsNameOutput']
    descriptionToAssign = army[unitIndex]['modelDefinitions'][modelIndex]['ttsDescriptionOutput']
    unitIdToAssign = army[unitIndex]['unitId']
    originalToughValueToAssign = army[unitIndex]['modelDefinitions'][modelIndex]['originalToughValue']
    originalCasterValueToAssign = army[unitIndex]['modelDefinitions'][modelIndex]['originalCasterValue']

    -- Assign a consistent color for this unit (same color for all models in the unit)
    if unitColorAssignments[unitIdToAssign] == nil then
        unitColorIndexCounter = unitColorIndexCounter + 1
        local colorIndex = ((unitColorIndexCounter - 1) % #UNIT_COLORS) + 1
        unitColorAssignments[unitIdToAssign] = UNIT_COLORS[colorIndex]
    end
    unitColorToAssign = unitColorAssignments[unitIdToAssign]

    broadcastToAll("Assigning '" .. nameOfModelAssigning .. "'")
end

function assignNameAndDescriptionToObjects( object )
    local players = Player.getPlayers();
    local player = players[1];

    local selectedObjects

    if (object ~= nil) then
        selectedObjects = { object }
    else
        selectedObjects = player.getSelectedObjects();
    end

    for _, target in ipairs(selectedObjects) do
        target.setName(nameToAssign)
        target.setDescription(descriptionToAssign)
        target.setLuaScript(perModelCode);
        -- clear out existing tags
        target.setTags({});

        -- set the new tags
        target.addTag('OPRAFTTS_unit_id_' .. unitIdToAssign)
        target.addTag('OPRAFTTS_army_id_' .. armyId)

        -- Calculate starting HP based on game system
        -- For skirmish systems: max HP = tough + 5
        -- For traditional systems: max HP = originalToughValue
        local startingHP = originalToughValueToAssign
        if gameSystemToAssign == 'aofs' or gameSystemToAssign == 'gff' then
            startingHP = originalToughValueToAssign + 5
        end

        target.memo = JSON.encode({
            isActivated = false,
            isShaken = false,
            isWavering = false,
            isStunned = false,
            gameSystem = gameSystemToAssign,
            unitId = unitIdToAssign,
            armyId = armyId,
            unitName = nameOfModelAssigning,
            nameToAssign = nameToAssign,
            originalToughValue = originalToughValueToAssign,
            originalCasterValue = originalCasterValueToAssign,
            currentToughValue = startingHP,
            currentCasterValue = originalCasterValueToAssign,
            armyNameToAssign = armyNameToAssign,
            unitColor = unitColorToAssign,
            showHpBar = true,
            showSpBar = true,
            showMeasuringBar = true,
            measuringRingColor = {1, 1, 1},
            unitHighlightColor = false,
        })
        target.setRotation({0, 180, 0});
        target.reload();  -- Reload to trigger onLoad() which sets up the action panel UI
    end

    broadcastToAll("Assigned '" .. nameOfModelAssigning .. "' to " .. tablelength(selectedObjects) .. " objects!", {0, 1, 0})
end

-- Exposed for per-model `onScriptingButtonDown` handlers to defer their hover
-- hotkeys while assignment-mode keys 1/2 are active. `Global.call('isAssigning')`
-- returns nil in a map where the mod isn't loaded (function missing = falsy),
-- so library-saved models degrade to unconditional hotkey dispatch cleanly.
function isAssigning()
    return nameOfModelAssigning ~= nil
end

function onScriptingButtonDown(index, player_color)
    -- scripting key 1 is assign to selected objects
    if (index == 1) then
        if nameToAssign == nil then
            return
        end
        if descriptionToAssign == nil then
            return
        end
        assignNameAndDescriptionToObjects();
        cancelCurrentAssigning();
    end

    -- scripting key 2 is cancel assigning
    if (index == 2 and nameOfModelAssigning ~= nil) then
        broadcastToAll("Stopped assigning '" .. nameOfModelAssigning .. "'")
        cancelCurrentAssigning();
    end
end

function click_func()

end



function onObjectPickUp(player_color, picked_up_object)
    if nameToAssign == nil then
        return
    end
    if descriptionToAssign == nil then
        return
    end

    assignNameAndDescriptionToObjects(picked_up_object);
    
    cancelCurrentAssigning();
end

function createCards(unitsDefinitions)
    local cardsAnchor = getObjectFromGUID(notecardGuid)
    army = unitsDefinitions
    local cardsXml = ''
    local totalUnitCount = tablelength(army)
    for unitIndex, unitDefinition in pairs(unitsDefinitions) do
        cardsXml = cardsXml .. BuildUnitLayout(unitDefinition, unitIndex)
    end
    cardsAnchor.UI.setXml(BuildLayout(cardsXml, totalUnitCount))
end

local function isValidJson(jsonString)
    -- First, check if the string is not nil or empty
    if not jsonString or jsonString:match("^%s*$") then
        return false
    end

    -- Use pcall to catch any errors during JSON decoding
    local success, result = pcall(function()
        return JSON.decode(jsonString)
    end)

    -- Return true if decoding was successful
    return success
end

function handleResponse(response)
    if response.is_error then
        broadcastToAll("Couldn't get the list from the server! Please re-load and try again", ERROR_RED)
        return
    end

    if not isValidJson(response.text) then
        broadcastToAll("Data from the server is not structured data - are you sure you copied the right URL? Please double check your URL and try again", ERROR_RED)
        return
    end

    local data = JSON.decode(response.text)

    armyId = data['listId'];
    gameSystemToAssign = data['listJson']['gameSystem'];
    armyNameToAssign = data['listJson']['listName'];

    local units = {}
    for _, unitDefinition in ipairs(data['listJson']['units']) do
        local unit = {
            name = unitDefinition['name'],
            modelDefinitions = unitDefinition['modelDefinitions'],
            unitId = unitDefinition['unitId'],
        }
        table.insert(units, unit)
    end
    createCards(units)
end