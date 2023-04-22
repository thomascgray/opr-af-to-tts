import * as ArmyForgeTypes from "./army-forge-types";

export interface iUnitProfile {
  id: string;
  originalName: string;
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
      originalLoadout: ArmyForgeTypes.IUpgradeGains;
    }[];
  }[];
}

export interface iAppState {
  armyListShareLink: string;
  armySpecialRulesDict: {
    name: string;
    description: string;
  }[];
  armySpecialRulesDictNames: string[];
  unitProfiles: iUnitProfile[];
  ui: {
    includeFullSpecialRulesText: boolean;
    modelWeaponOutputColour: string;
    modelSpecialRulesOutputColour: string;
  };
}
