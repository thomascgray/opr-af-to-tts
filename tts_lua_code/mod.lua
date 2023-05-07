require("vscode/console")
-- OPR AF to TTS by Tombola
-- This is a copy of the code that lives in https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810
-- I keep a copy in this repo to keep track of changes, so I can make issues against it if need be, etc.
local army = {}
local notecardGuid = 'e73b3a'
local oprAfToTtsLink = ""
local activeArmyListCardIndex = nil;

local nameOfModelAssigning = nil;
local nameToAssign = nil;
local descriptionToAssign = nil;
local unitIdToAssign = nil;

local perModelCode = [[
    function onLoad()
        local bounds = self.getBoundsNormalized();
        modelSizeX = bounds['size']['x'];
        local decodedMemo = JSON.decode(self.memo)
    
        measuringCircle = {
            color             = {231 / 255, 76 / 255, 60 / 255, 0.85}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 64,          --number of segments that make up the circle
            thickness         = 0.1,         --thickness of the circle line
            vertical_position = 0.75,         --vertical height of the circle relative to the object
        }
    
        isActivatedCircle = {
            color             = {46 / 255, 204 / 255, 113 / 255, 1}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 16,          --number of segments that make up the circle
            thickness         = 0.7,         --thickness of the circle line
            vertical_position = 0.4,         --vertical height of the circle relative to the object
        }

        isPinnedCircle = {
            color             = {241 / 255, 196 / 255, 15 / 255, 1}, --RGB color of the circle
            radius            = 0,           --radius of the circle around the object
            steps             = 5,          --number of segments that make up the circle
            thickness         = 0.3,         --thickness of the circle line
            vertical_position = 0.6,         --vertical height of the circle relative to the object
        }
    
        rebuildContext();
        rebuildStatusEffectThings();   
    end
    
    function togglePinned()
        local decodedMemo = JSON.decode(self.memo)
        local unitMates = getAllUnitMates()
        
        for _, unitMate in ipairs(unitMates) do
            unitMate.memo = JSON.encode({
                isActivated = decodedMemo['isActivated'],
                isPinned = not decodedMemo['isPinned'],
                isHighlightOn = decodedMemo['isHighlightOn'],
                unitId = decodedMemo['unitId']
            })
            unitMate.call('rebuildContext');
            unitMate.call('rebuildStatusEffectThings');
        end
    end

    function toggleActivated()
        local decodedMemo = JSON.decode(self.memo)
        local unitMates = getAllUnitMates()

        for _, unitMate in ipairs(unitMates) do
            unitMate.memo = JSON.encode({
                isActivated = not decodedMemo['isActivated'],
                isPinned = decodedMemo['isPinned'],
                isHighlightOn = decodedMemo['isHighlightOn'],
                unitId = decodedMemo['unitId']
            })
            unitMate.call('rebuildContext');
            unitMate.call('rebuildStatusEffectThings');
        end
    end

    function getAllUnitMates()
        local decodedMemo = JSON.decode(self.memo)
        local unitId = decodedMemo['unitId']
        local unitObjects = getObjectsWithTag('OPRAFTTS_unit_id_' .. decodedMemo['unitId'])
        return unitObjects
    end
    
    function rebuildContext()
        local decodedMemo = JSON.decode(self.memo)
        
        self.clearContextMenu()
        
        if (decodedMemo['isActivated']) then
            self.addContextMenuItem("☑ Activated", toggleActivated, false)
        else
            self.addContextMenuItem("☐ Activated", toggleActivated, false)
        end

        if (decodedMemo['isPinned']) then
            self.addContextMenuItem("☑ Pinned", togglePinned, false)
        else
            self.addContextMenuItem("☐ Pinned", togglePinned, false)
        end
    
        self.addContextMenuItem("Measuring Circle", cycleMeasuringRadius, true)
    end
        
    function rebuildStatusEffectThings()
        local decodedMemo = JSON.decode(self.memo)
    
        local vectorPointsTable = {}
        
        if (measuringCircle.radius > 0) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(measuringCircle.radius, measuringCircle.steps, measuringCircle.vertical_position),
                color     = measuringCircle.color,
                thickness = measuringCircle.thickness,
                rotation  = {0,0,0},
            })
        end
        if (decodedMemo['isActivated']) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(isActivatedCircle.radius, isActivatedCircle.steps, isActivatedCircle.vertical_position),
                color     = isActivatedCircle.color,
                thickness = isActivatedCircle.thickness,
                rotation  = {0,0,0},
            })
        end

        if (decodedMemo['isPinned']) then
            table.insert(vectorPointsTable, {
                points    = getCircleVectorPoints(isPinnedCircle.radius, isPinnedCircle.steps, isPinnedCircle.vertical_position),
                color     = isPinnedCircle.color,
                thickness = isPinnedCircle.thickness,
                rotation  = {0,0,0},
            })
        end
    
        self.setVectorLines(vectorPointsTable)
    end
    
    -- code taken from https://pastebin.com/Y1tTQ8Yw with huge appreciation to the original author
    function getCircleVectorPoints(radius, steps, y)
        -- the extra black magic maths here are to get things JUST RIGHT
        -- for battleforged-scale models
        radius = radius + (((modelSizeX / 2) * 0.98) - 0.2)
    
        local t = {}
        local d,s,c,r = 360/steps, math.sin, math.cos, math.rad
        for i = 0,steps do
            table.insert(t, {
                c(r(d*i))*radius,
                y,
                s(r(d*i))*radius
            })
        end
        return t
    end
    
    function cycleMeasuringRadius()
        -- resize the circle
        if measuringCircle.radius == 0 then
            measuringCircle.radius = 3;
        elseif measuringCircle.radius == 3 then
            measuringCircle.radius = 6;
        elseif measuringCircle.radius == 6 then
            measuringCircle.radius = 9;
        elseif measuringCircle.radius == 9 then
            measuringCircle.radius = 12;
        elseif measuringCircle.radius == 12 then
            measuringCircle.radius = 18;
        elseif measuringCircle.radius == 18 then
            measuringCircle.radius = 24;
        elseif measuringCircle.radius == 24 then
            measuringCircle.radius = 30;
        elseif measuringCircle.radius == 30 then
            measuringCircle.radius = 0;
        end
    
        if measuringCircle.radius == 0 then
            broadcastToAll("Measuring circle turned off", {1,1,1})
        else
            broadcastToAll("Measuring circle set to " .. measuringCircle.radius .. "''", {1,1,1})
        end
    
        rebuildStatusEffectThings();
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
    ]], unitIndex, modelIndex, calculateFontSize(totalModelsInThisUnit, 26, 4), modelDefinition['name'], calculateFontSize(totalModelsInThisUnit, 20, 2), modelDefinition['loadoutCSV'])
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
          >Unit: %s</Text>
          
            <HorizontalLayout
              spacing="40">
                %s
            </HorizontalLayout>
        </VerticalLayout>
        
    ]], unitDefinition['name'], thisUnitsModelCardsXml)
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

    broadcastToAll("Assigning '" .. nameOfModelAssigning .. "'")
end

function assignNameAndDescriptionToSelectedObjects()
    local players = Player.getPlayers();
    local player = players[1];

    local selectedObjects = player.getSelectedObjects();

    for _, target in ipairs(selectedObjects) do
        target.setName(nameToAssign)
        target.setDescription(descriptionToAssign)
        target.setLuaScript(perModelCode);
        target.addTag('OPRAFTTS_unit_id_' .. unitIdToAssign)
        target.memo = JSON.encode({
            isActivated = false,
            isPinned = false,
            isHighlightOn = false,
            unitId = unitIdToAssign,
        })
    end

    broadcastToAll("Assigned '" .. nameOfModelAssigning .. "' to " .. tablelength(selectedObjects) .. " objects!")
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
        assignNameAndDescriptionToSelectedObjects();
        cancelCurrentAssigning();
    end

    -- scripting key 2 is cancel assigning
    if (index == 2) then
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

    picked_up_object.setName(nameToAssign)
    picked_up_object.setDescription(descriptionToAssign)
    picked_up_object.setLuaScript(perModelCode);
    picked_up_object.addTag('OPRAFTTS_unit_id_' .. unitIdToAssign)
    picked_up_object.memo = JSON.encode({
        isActivated = false,
        isPinned = false,
        isHighlightOn = false,
        unitId = unitIdToAssign,
    })

    broadcastToAll("Assigned '" .. nameOfModelAssigning .. "' to 1 object!")

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

function handleResponse(response)
    if response.is_error then
        broadcastToAll("Something went wrong at the server!", ERROR_RED)
        return
    end

    local data = JSON.decode(response.text)

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
