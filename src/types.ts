import * as ArmyForgeTypes from "./army-forge-types";

export enum eNetworkRequestState {
  IDLE = "IDLE",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface iTotalShareableOutput {
  gameSystem: ArmyForgeTypes.eGameSystemInitials;
  listName: string;
  // the TTS mod drops the skirmish +5 HP for lists that carry this
  rulesVersion: string;
  units: {
    name: string;
    modelDefinitions: iUnitProfileModelTTSOutput[];
    unitId: string;
    selectionId: string;
  }[];
}

export interface iUnitProfileModelTTSOutput {
  name: string;
  loadoutCSV: string;
  ttsNameOutput: string;
  ttsDescriptionOutput: string;
  originalToughValue?: number;
  originalCasterValue?: number;
}

export enum eCampaignTraitCategory {
  SKILL_SET = "SKILL_SET",
  TRAIT = "TRAIT",
  INJURY = "INJURY",
  TALENT = "TALENT",
}

export interface iCampaignTraitOnModel {
  id: string;
  name: string;
  category: eCampaignTraitCategory;
  skillSet?: string;
  description: string;
  includeInOutput: boolean;
  originalTrait?: ArmyForgeTypes.ICommonRuleTrait;
}

export interface iUnitProfileModel {
  id: string;
  name: string;
  originalName: string;
  qua: number;
  def: number;
  isGenerated: boolean;
  originalSpecialRules: ArmyForgeTypes.ISpecialRule[];
  xp: number;
  campaignTraits: iCampaignTraitOnModel[];
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
  originalSelectionId: string;
  originalJoinToUnit?: string | null;
  originalLoadoutCsvHelperString: string;
  models: iUnitProfileModel[];
}

export interface iAppState {
  armyListShareLink: string;
  shareableLinkForTTS?: string;
  listName?: string;
  armySpecialRulesDict: {
    name: string;
    description: string;
    // true when Army Forge prints this rule's text under any rule that names it
    showWhenReferenced?: boolean;
  }[];
  gameSystem?: ArmyForgeTypes.eGameSystemInitials;
  coreSpecialRulesDict: {
    name: string;
    description: string;
  }[];
  campaignTraitsDict: ArmyForgeTypes.ICommonRuleTrait[];
  unitProfiles: iUnitProfile[];
  ttsOutputConfig: {
    includeCoreSpecialRules: boolean;
    includeArmySpecialRules: boolean;
    includeFullArmySpecialRulesText: boolean;
    includeFullCoreSpecialRulesText: boolean;
    completelyReplaceNameWithCustomName: boolean;
    swapCustomNameBracketingForUnitsWithMultipleModels: boolean;
    includeWeaponsListInName: boolean;
    includeSpecialRulesListInName: boolean;
    disableSmallText: boolean;
    includeCampaignXp: boolean;
    includeCampaignTraits: boolean;
    includeCampaignTraitsFullText: boolean;
    includeCampaignSkillSets: boolean;
    includeCampaignTraitsCategory: boolean;
    includeCampaignInjuries: boolean;
    includeCampaignTalents: boolean;

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
