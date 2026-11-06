import { iAppState, iUnitProfile, iUnitProfileModel } from "../types";

export const getModelNameForOutput = (
  unit: iUnitProfile,
  model: iUnitProfileModel,
  ttsOutputConfig: iAppState["ttsOutputConfig"]
) => {
  const {
    swapCustomNameBracketingForUnitsWithMultipleModels,
    completelyReplaceNameWithCustomName,
  } = ttsOutputConfig;

  if (completelyReplaceNameWithCustomName && unit.customNameSingular) {
    return unit.customNameSingular;
  }

  if (
    swapCustomNameBracketingForUnitsWithMultipleModels &&
    unit.originalModelCountInUnit > 1
  ) {
    if (unit.customName) {
      return `${model.name} (${unit.customName})`;
    }
    return unit.originalName;
  }
  if (unit.customName) {
    return `${unit.customName} (${model.name})`;
  }
  return unit.originalName;
};

export const getUnitIndexForSelectionId = (
  selectionId: string,
  stateView: Readonly<iAppState>
) => {
  const index = stateView.unitProfiles.findIndex((u) => {
    return u.originalSelectionId === selectionId;
  });

  return index + 1;
};

// 3.6 rules have no `key`, so match on name too (bug B3)
export const isUnitHero = (unit: iUnitProfile) => {
  return unit.models[0].originalSpecialRules.some(
    (sr) => sr.name === "Hero" || sr.key === "hero"
  );
};

export const getUnitNameForSavedShareableOutput = (
  unit: iUnitProfile,
  stateView: iAppState
): string => {
  let name = "";
  if (unit.customName) {
    name = `${unit.customName} (${unit.originalName})`;
  } else {
    name = `${unit.originalName}`;
  }
  const armyUnitIndex = getUnitIndexForSelectionId(
    unit.originalSelectionId,
    stateView
  );
  name = `#${armyUnitIndex} ${name}`;

  const joinedTo = unit.originalJoinToUnit
    ? stateView.unitProfiles.find(
        (up) => up.originalSelectionId === unit.originalJoinToUnit
      )
    : undefined;

  if (joinedTo) {
    const joinText = isUnitHero(unit) ? "joined to" : "combined with";
    const joinedToName = getUnitNameForSavedShareableOutput(joinedTo, stateView);
    name = `${name} (${joinText} ${joinedToName})`;
  }

  return name;
};

// courtesy of chatgpt lmao
// computationally expensive, but fuck it
// necessary for a handful of edge cases where tabletop simulator doesn't
// care for text inside description being around 56/57 characters long.
export const insertLineBreaksIntoString = (str: string) => {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += str.charAt(i);
    if ((i + 1) % 54 === 0) {
      var j = i;
      while (j >= 0 && result.charAt(j) !== " ") {
        j--;
      }
      if (j >= 0) {
        result = result.substring(0, j) + "\r\n" + result.substring(j + 1);
      }
    }
  }
  return result;
};
