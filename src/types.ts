import * as ArmyForgeTypes from "./army-forge-types";

export enum eNetworkRequestState {
  IDLE = "IDLE",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface iUnitProfile {
  id: string;
  originalName: string;
  originalUnit: ArmyForgeTypes.ISelectedUnit;
  originalModelCountInUnit: number;
  models: {
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
  }[];
}

export interface iAppState {
  armyListShareLink: string;
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
    fetchArmyList: eNetworkRequestState;
  };
}
