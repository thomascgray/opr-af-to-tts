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
    includeFullSpecialRulesText: boolean;
    useShorterVersionOfCoreSpecialRules: boolean;
    modelWeaponOutputColour: string;
    modelSpecialRulesOutputColour: string;
  };
  networkState: {
    fetchArmyList: eNetworkRequestState;
  };
}
