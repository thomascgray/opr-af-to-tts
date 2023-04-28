import * as ArmyForgeTypes from "./army-forge-types";

export enum eNetworkRequestState {
  IDLE = "IDLE",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
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
  armySpecialRulesDictNames: string[];
  unitProfiles: iUnitProfile[];
  ttsOutputConfig: {
    includeCoreSpecialRules: boolean;
    includeArmySpecialRules: boolean;
    useShorterVersionOfCoreSpecialRules: boolean;
    includeFullSpecialRulesText: boolean;
    includeWeaponsListInName: boolean;
    includeSpecialRulesListInName: boolean;
    modelWeaponOutputColour: string;
    modelSpecialRulesOutputColour: string;
    modelQuaOutputColour: string;
    modelDefOutputColour: string;
  };
  networkState: {
    fetchArmyFromArmyForge: eNetworkRequestState;
    saveArmyListAsBBToDB: eNetworkRequestState;
  };
}
