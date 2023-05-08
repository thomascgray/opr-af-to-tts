import * as ArmyForgeTypes from "./army-forge-types";

export enum eNetworkRequestState {
  IDLE = "IDLE",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface iTotalShareableOutput {
  gameSystem: ArmyForgeTypes.eGameSystemInitials;
  units: {
    name: string;
    modelDefinitions: iUnitProfileModelTTSOutput[];
    unitId: string;
  }[];
}

export interface iUnitProfileModelTTSOutput {
  name: string;
  loadoutCSV: string;
  ttsNameOutput: string;
  ttsDescriptionOutput: string;
}

export interface iUnitProfileModel {
  id: string;
  name: string;
  originalName: string;
  qua: number;
  def: number;
  isGenerated: boolean;
  originalSpecialRules: any[];
  xp: number;
  traits: string[];
  loadout: {
    id: string;
    name: string;
    definition: string;
    quantity: number;
    includeInName: boolean;
    originalLoadout: ArmyForgeTypes.IUpgradeGains;
  }[];
}

export interface iUnitProfile {
  id: string;
  originalName: string;
  customName?: string;
  customNameSingular?: string;
  originalUnit: ArmyForgeTypes.ISelectedUnit;
  originalModelCountInUnit: number;
  models: iUnitProfileModel[];
}

export interface iAppState {
  armyListShareLink: string;
  shareableLinkForTTS?: string;
  armySpecialRulesDict: {
    name: string;
    description: string;
    shortDescription?: string;
  }[];
  gameSystem?: ArmyForgeTypes.eGameSystemInitials;
  coreSpecialRulesDict: {
    name: string;
    description: string;
  }[];
  armySpecialRulesDictNames: string[];
  unitProfiles: iUnitProfile[];
  ttsOutputConfig: {
    includeCoreSpecialRules: boolean;
    includeArmySpecialRules: boolean;
    useShorterVersionOfCoreSpecialRules: boolean;
    includeFullArmySpecialRulesText: boolean;
    includeFullCoreSpecialRulesText: boolean;
    completelyReplaceNameWithCustomName: boolean;
    swapCustomNameBracketingForUnitsWithMultipleModels: boolean;
    includeWeaponsListInName: boolean;
    includeSpecialRulesListInName: boolean;
    includeToughSpecialRuleRatingInName: boolean;
    disableSmallText: boolean;
    includeCampaignXp: boolean;
    includeCampaignTraits: boolean;
    includeCampaignTraitsFullText: boolean;

    modelWeaponOutputColour: string;
    modelSpecialRulesOutputColour: string;
    modelQuaOutputColour: string;
    modelDefOutputColour: string;
    modelToughOutputColour: string;
    modelCampaignStuffOutputColour: string;
  };
  networkState: {
    fetchArmyFromArmyForge: eNetworkRequestState;
    saveArmyListAsBBToDB: eNetworkRequestState;
  };
}
