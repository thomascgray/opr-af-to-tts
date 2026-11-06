import ky from "ky";
import { nanoid } from "nanoid";
import * as ArmyForgeTypes from "./army-forge-types";
import {
  eNetworkRequestState,
  iAppState,
  iTotalShareableOutput,
  iUnitProfile,
  iUnitProfileModelTTSOutput,
} from "./types";
import { state } from "./state";
import i18n from "./i18n";
import {
  ArmyForgeError,
  extractIdFromUrl,
  fetchArmyList,
  fetchCommonRules,
  UnsupportedGameSystemError,
} from "./army-forge/client";
import { mapArmyForgeListToUnitProfiles } from "./army-forge/map-list";
import { generateUnitOutput } from "./tts-output/generate-unit-output";
import { getUnitNameForSavedShareableOutput } from "./tts-output/names";

export {
  COMMON_RULES_ID_BY_GAME_SYSTEM,
  extractIdFromUrl,
} from "./army-forge/client";
export {
  generateLoadoutItemDefinition,
  generateOriginalLoadoutCsvHelperString,
  getCampaignTraitCategory,
  mapArmyForgeListToUnitProfiles,
  mergeSelectedUpgradesIntoLoadout,
  removeQuantityStringFromStartOfString,
} from "./army-forge/map-list";
export { generateUnitOutput } from "./tts-output/generate-unit-output";
export {
  getModelNameForOutput,
  getUnitIndexForSelectionId,
  getUnitNameForSavedShareableOutput,
  insertLineBreaksIntoString,
  isUnitHero,
} from "./tts-output/names";

const alertTextForArmyForgeError = (e: ArmyForgeError): string => {
  switch (e.kind) {
    case "unsupportedGameSystem":
      return i18n.t("errors.unsupportedGameSystem", {
        gameSystem: (e as UnsupportedGameSystemError).gameSystem,
      });
    case "upstreamUnavailable":
      return e.isBeta
        ? i18n.t("errors.armyForgeBetaUnavailable")
        : i18n.t("errors.armyForgeUnavailable");
    case "listFailed":
      return e.upstreamMessage || i18n.t("errors.armyForgeExportFailed");
    case "commonRulesFailed":
      return e.upstreamMessage || i18n.t("errors.fetchCommonRulesFailed");
  }
};

export const onGenerateDefinitions = async (stateView: Readonly<iAppState>) => {
  state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.PENDING;
  state.unitProfiles = [];
  const { id, isBeta } = extractIdFromUrl(stateView.armyListShareLink);
  if (!id) {
    alert(i18n.t("errors.noArmyId"));
    state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.IDLE;
    return;
  }

  try {
    const list = await fetchArmyList(id, isBeta);
    // the common special rules for whatever army forge game system we're playing
    const commonRules = await fetchCommonRules(list.gameSystem, isBeta);
    const mapped = mapArmyForgeListToUnitProfiles(list, commonRules);

    state.listName = mapped.listName;
    state.gameSystem = mapped.gameSystem;
    state.coreSpecialRulesDict = mapped.coreSpecialRulesDict;
    state.campaignTraitsDict = mapped.campaignTraitsDict;
    state.armySpecialRulesDict = mapped.armySpecialRulesDict;
    state.unitProfiles = mapped.unitProfiles;
    state.shareableLinkForTTS = undefined;
    state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.SUCCESS;
  } catch (e) {
    if (e instanceof ArmyForgeError) {
      alert(alertTextForArmyForgeError(e));
    } else {
      console.error(e);
    }
    state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.ERROR;
  }
};

// Army Forge serves only 3.6 data since 29 Oct 2026 and /api/tts carries no
// rules version, so the app stamps saved lists with a constant
export const CURRENT_RULES_VERSION = "3.6";

export const onGenerateShareableId = async (stateView: Readonly<iAppState>) => {
  state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.PENDING;
  state.shareableLinkForTTS = undefined;

  const totalOutput: iTotalShareableOutput = {
    gameSystem: stateView.gameSystem || ArmyForgeTypes.eGameSystemInitials.GF,
    units: [],
    listName: state.listName || "UNDEFINED",
    rulesVersion: CURRENT_RULES_VERSION,
  };

  stateView.unitProfiles.forEach((unitProfile) => {
    let thisUnitsModelDefinitions: iUnitProfileModelTTSOutput[] = [];
    const unitId = nanoid();

    unitProfile.models.forEach((model) => {
      const {
        name,
        loadoutCSV,
        ttsNameOutput,
        ttsDescriptionOutput,
        originalCasterValue = 0,
        originalToughValue = 0,
      } = generateUnitOutput(unitProfile, model, stateView);

      thisUnitsModelDefinitions.push({
        name,
        loadoutCSV,
        ttsNameOutput,
        ttsDescriptionOutput,
        originalToughValue,
        originalCasterValue,
      });
    });

    totalOutput.units.push({
      name: getUnitNameForSavedShareableOutput(unitProfile, stateView),
      modelDefinitions: thisUnitsModelDefinitions,
      selectionId: unitProfile.originalSelectionId,
      unitId,
    });
  });

  // now we loop over totalOutput.units and for any units that are combined or joined to another unit,
  // make that unit use the unit id of the one its joined to
  totalOutput.units.forEach((unit) => {
    const unitProfile = stateView.unitProfiles.find(
      (up) => up.originalSelectionId === unit.selectionId
    );
    if (!unitProfile) {
      return;
    }
    if (!unitProfile.originalJoinToUnit) {
      return;
    }
    const joinedToUnit = totalOutput.units.find(
      (u) => u.selectionId === unitProfile.originalJoinToUnit
    );
    if (!joinedToUnit) {
      return;
    }
    unit.unitId = joinedToUnit.unitId;
  });

  let data;
  state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.PENDING;

  try {
    const response = await ky.post("/.netlify/functions/save-list", {
      json: {
        list_json: totalOutput,
      },
    });

    data = await response.json();
    const { listId } = data as any;
    state.shareableLinkForTTS = `${window.location.href}.netlify/functions/save-list?listId=${listId}`;
    state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.SUCCESS;
  } catch (e) {
    console.error(e);
    state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.ERROR;
  }
};

// accounts for custom names
export const getUnitNameForLegend = (unit: iUnitProfile) => {
  if (unit.customName) {
    return (
      <>
        <span className="font-bold mr-1">{unit.customName}</span>
        <span>({unit.originalName})</span>
      </>
    );
  }
  return <span className="font-bold">{unit.originalName}</span>;
};
