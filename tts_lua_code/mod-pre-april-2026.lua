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

-- Global Font Scaling Constants
local GLOBAL_FONT_SCALING = {
    name_base = 26,
    name_decrease = 4,
    loadout_base = 20,
    loadout_decrease = 2
}

-- When saving, remove the --lua
-- local perModelCode = [[
local perModelCode = [[
    function distributeObjects(numObjects, spacing)
        if numObjects <= 0 then
            return {} -- Return an empty table for an invalid input
        elseif numObjects == 1 then
            return {0} -- Center position for a single object
        end
    
        local positions = {}
        local totalWidth = (numObjects - 1) * spacing
    
        for i = 1, numObjects do
            local position = (i - 1) * spacing - totalWidth / 2
            table.insert(positions, position)
        end
    
        return positions
    end

    function tablelength(T)
        local c = 0
        for _ in pairs(T) do
            c = c + 1
        end
        return c
    end

    function largestWithMax(a, b, c)
        return (a > b) and (b > c and c or b) or (a > c and c or a)
    end

    function smallestWithMin(a, b, c)
        return (a < b) and (b < c and b or c) or (a < c and a or c)
    end

    function numOrMin(a, b)
        if (a < b) then
            return b
        else
            return a
        end
    end

    function numOrMax(a, b)
        if (a > b) then
            return b
        else
            return a
        end
    end

    function mergeTables(table1, table2)
        local mergedTable = {}
    
        for key, value in pairs(table1) do
            mergedTable[key] = value
        end
    
        for key, value in pairs(table2) do
            mergedTable[key] = value
        end
    
        return mergedTable
    end

    function roundToTwoDecimalPlaces(number)
        return math.floor(number * 100 + 0.5) / 100
    end

    function __noop()
        -- deliberately blank
    end

    -- Constants
    local MEASURING_RADII = {3, 6, 9, 12, 18, 24, 30}
    local FONT_SCALING = {
        name_base = 26,
        name_decrease = 4,
        loadout_base = 20,
        loadout_decrease = 2
    }
    local BUTTON_CONFIG = {
        width = 100,
        height = 100,
        font_size = 340,
        wound_spacing = 0.275,
        row_spacing = 0.35
    }
    local COLORS = {
        wound = {1, 0, 0},
        spell = {0, 1, 1},
        text = {1, 1, 1}
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

    -- Button Creation Helper
    function createStatusButton(position, color, opacity, modelSizeY, rowIndex, buttonRowsDistribution)
        self.createButton({
            click_function = "__noop",
            function_owner = self,
            label          = "",
            position       = {position, modelSizeY, buttonRowsDistribution[rowIndex]},
            rotation       = {0, 0, 0},
            width          = BUTTON_CONFIG.width,
            height         = BUTTON_CONFIG.height,
            font_size      = BUTTON_CONFIG.font_size,
            color          = {color[1], color[2], color[3], opacity},
            font_color     = COLORS.text,
        })
    end

    function onLoad()
        local bounds = self.getBoundsNormalized();
        modelSizeX = bounds['size']['x'];
        local decodedMemo = JSON.decode(self.memo)
    
        isShowWoundsAndSpellTokens = true;

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
        rebuildXml();
    end

    function hpUp(player_color)
        local decodedMemo = JSON.decode(self.memo)

        printToAll("'" .. decodedMemo['unitName'] .. "' gained 1 Wound.");
        
        self.memo = JSON.encode(mergeTables(decodedMemo, {
            currentToughValue = decodedMemo['currentToughValue'] + 1,
        }))
        

        self.call('rebuildName');
        self.call('rebuildXml');
    end

    function hpDown(player_color)
        local decodedMemo = JSON.decode(self.memo)

        printToAll("'" .. decodedMemo['unitName'] .. "' lost 1 Wound.");
        
        self.memo = JSON.encode(mergeTables(decodedMemo, {
            currentToughValue = decodedMemo['currentToughValue'] - 1,
        }))
        
        self.call('rebuildName');
        self.call('rebuildXml');
    end

    function spellTokensUp(player_color)
        local decodedMemo = JSON.decode(self.memo)
        
        printToAll("'" .. decodedMemo['unitName'] .. "' gained 1 Spell Token.");
        
        self.memo = JSON.encode(mergeTables(decodedMemo, {
            currentCasterValue = decodedMemo['currentCasterValue'] + 1,
        }))

        self.call('rebuildName');
        self.call('rebuildXml');
    end

    function spellTokensDown(player_color)
        local decodedMemo = JSON.decode(self.memo)
        
        printToAll("'" .. decodedMemo['unitName'] .. "' lost 1 Spell Token.");
        
        self.memo = JSON.encode(mergeTables(decodedMemo, {
            currentCasterValue = decodedMemo['currentCasterValue'] - 1,
        }))

        self.call('rebuildName');
        self.call('rebuildXml');
    end

    function toggleActivated(player_color)
        toggleUnitStatus('isActivated', 'activation')
    end

    function toggleStunned(player_color)
        toggleUnitStatus('isStunned', 'Stunned')
    end

    function toggleShaken(player_color)
        toggleUnitStatus('isShaken', 'Shaken')
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

    function selectAllUnit(player_color)
        local unitMates = getAllUnitMates();
        
        for _, unitMate in ipairs(unitMates) do
            unitMate.addToPlayerSelection(player_color);
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
            armyMate.call('rebuildContext');
            armyMate.call('rebuildName');
            armyMate.call('rebuildXml');
            armyMate.call('rebuildStatusEffectThings');
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
    end

    function cycleShowHideWoundsAndSpellTokens()
        isShowWoundsAndSpellTokens = not isShowWoundsAndSpellTokens;
        self.call('rebuildXml');
    end

    function rebuildStatusEffectThings()
        local decodedMemo = JSON.decode(self.memo)
           
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

    function rebuildXml()
        if (isShowWoundsAndSpellTokens == false) then
            self.clearButtons();
            return;
        end

        local decodedMemo = JSON.decode(self.memo)

        local bounds = self.getVisualBoundsNormalized();
        local modelSizeY = (bounds['size']['y'] + (bounds['size']['y'] / 2)) / self.getScale()['y'];    

        local rowCount = 1;
        if (decodedMemo['originalCasterValue'] ~= 0) then
            rowCount = rowCount + 1;
        end

        local buttonRowsDistribution = distributeObjects(rowCount, BUTTON_CONFIG.row_spacing);

        self.clearButtons();

        if isTraditionalSystem(decodedMemo['gameSystem']) then
            local woundsDistribution = distributeObjects(decodedMemo['originalToughValue'], BUTTON_CONFIG.wound_spacing);
            
            -- do wounds for non skirmish games
            for key, value in pairs(woundsDistribution) do
                if (decodedMemo['currentToughValue'] < key) then
                    opacity = 0.6;
                else
                    opacity = 1;
                end
                createStatusButton(value, COLORS.wound, opacity, modelSizeY, 1, buttonRowsDistribution)
            end
        end

        if isSkirmishSystem(decodedMemo['gameSystem']) then
            local woundsDistribution = distributeObjects(decodedMemo['originalToughValue'] + 5, BUTTON_CONFIG.wound_spacing);
            
            -- do wounds for skirmish games
                -- basically, they have as many wounds as they have tough plus 5
            for key, value in pairs(woundsDistribution) do
                if (decodedMemo['currentToughValue'] < key) then
                    opacity = 0.6;
                else
                    opacity = 1;
                end
                createStatusButton(value, COLORS.wound, opacity, modelSizeY, 1, buttonRowsDistribution)
            end
        end

        -- do spell tokens
        -- spell tokens are always the same regardless of game system

        if (decodedMemo['originalCasterValue'] > 0) then
            local spellTokensDistribution = distributeObjects(6, BUTTON_CONFIG.wound_spacing);
            local opacity = 1;
            for key, value in pairs(spellTokensDistribution) do
                if (decodedMemo['currentCasterValue'] < key) then
                    opacity = 0.6;
                else
                    opacity = 1;
                end
                createStatusButton(value, COLORS.spell, opacity, modelSizeY, 2, buttonRowsDistribution)
            end
        end
    end

    function rebuildName()
        local decodedMemo = JSON.decode(self.memo)

        local gameSystem = decodedMemo['gameSystem']
        local nameToAssign = decodedMemo['nameToAssign']
        local currentTough = decodedMemo['currentToughValue']
        local currentCaster = decodedMemo['currentCasterValue']
        local originalTough = decodedMemo['originalToughValue']
        local originalCaster = decodedMemo['originalCasterValue']

        if isTraditionalSystem(decodedMemo['gameSystem']) then
            if (originalTough ~= 0 and originalCaster ~= 0) then
                self.setName(nameToAssign .. "\r\n" .. "Wounds: ".. currentTough .. "/" .. originalTough .. "\r\n" .. "Spell Tokens: " .. currentCaster .. '/6')
            elseif (originalTough ~= 0 and originalCaster == 0) then
                self.setName(nameToAssign .. "\r\n" .. "Wounds:" .. currentTough .. '/' .. originalTough)
            elseif (originalTough == 0 and originalCaster ~= 0) then
                self.setName(nameToAssign .. "\r\n" .. "Spell Tokens: " .. currentCaster .. '/6')
            else
                self.setName(nameToAssign)
            end
        end

        if isSkirmishSystem(decodedMemo['gameSystem']) then
            if (originalTough ~= 0) then
                nameToAssign = nameToAssign .. "\r\nTough: " .. originalTough;
            end

            nameToAssign = nameToAssign .. "\r\nWounds: " .. currentTough;
            
            if (originalCaster ~= 0) then
                nameToAssign = nameToAssign .. "\r\n" .. "Spell Tokens: " .. currentCaster .. '/6';
            end
            self.setName(nameToAssign)
        end
    end

    function measuringOff()
        local decodedMemo = JSON.decode(self.memo)
        measuringCircle.radius = 0;
        printToAll("'" .. decodedMemo['unitName'] .. "' Measuring Off")
        rebuildStatusEffectThings();
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
    
    function rebuildContext()
        local decodedMemo = JSON.decode(self.memo)
        
        self.clearContextMenu()

        self.addContextMenuItem("▼ Model", __noop, true)

        if (decodedMemo['originalToughValue'] ~= 0 or isSkirmishSystem(decodedMemo['gameSystem'])) then
            self.addContextMenuItem("Wounds +", hpUp, true)
            self.addContextMenuItem("Wounds -", hpDown, true)
        end

        if (decodedMemo['originalCasterValue'] ~= 0) then
            self.addContextMenuItem("Spell Tokens +", spellTokensUp, true)
            self.addContextMenuItem("Spell Tokens -", spellTokensDown, true)
        end

        if (decodedMemo['originalToughValue'] ~= 0 or isSkirmishSystem(decodedMemo['gameSystem']) or decodedMemo['originalCasterValue'] ~= 0) then
            self.addContextMenuItem("Toggle W/SP Count", cycleShowHideWoundsAndSpellTokens, false)
        end

        self.addContextMenuItem("Measuring", cycleMeasuringRadius, true)
        self.addContextMenuItem("Measuring Off", measuringOff, true) 

        self.addContextMenuItem("▼ Unit", __noop, true)

        if (decodedMemo['isActivated']) then
            self.addContextMenuItem("☑ Activated", toggleActivated, false)
        else
            self.addContextMenuItem("☐ Activated", toggleActivated, false)
        end

        if isSkirmishSystem(decodedMemo['gameSystem']) then
            if (decodedMemo['isStunned']) then
                self.addContextMenuItem("☑ Stunned", toggleStunned, false)
            else
                self.addContextMenuItem("☐ Stunned", toggleStunned, false)
            end
        end

        if isTraditionalSystem(decodedMemo['gameSystem']) then
            if (decodedMemo['isShaken']) then
                self.addContextMenuItem("☑ Shaken", toggleShaken, false)
            else
                self.addContextMenuItem("☐ Shaken", toggleShaken, false)
            end
        end
    
        self.addContextMenuItem("Select All", selectAllUnit)
        self.addContextMenuItem("Count", countUnit)

        self.addContextMenuItem("▼ Army", __noop, true)
        
        self.addContextMenuItem("Army Measuring Off", measuringOffArmy)
        self.addContextMenuItem("Deactivate", deactivateArmy)
        self.addContextMenuItem("Refresh Spell Tokens", armyRefreshSpellTokens)
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
    local object = spawnObject({
    type = "rpg_BEAR",
    position = {0, 3, 0},
    scale = {2, 2, 2},
    sound = false,
    callback_function = function(spawned_object)
        log(spawned_object.getBounds())
    end
})
end

function onSubmit()
    UI.hide("main-panel")
    WebRequest.get(oprAfToTtsLink, handleResponse)
end

function onCloseInput()
    UI.hide("main-panel")
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
            currentToughValue = 0,
            currentCasterValue = 0,
            armyNameToAssign = armyNameToAssign,
        })
        target.setRotation({0, 180, 0});
        -- target.reload();
    end

    broadcastToAll("Assigned '" .. nameOfModelAssigning .. "' to " .. tablelength(selectedObjects) .. " objects!", {0, 1, 0})
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