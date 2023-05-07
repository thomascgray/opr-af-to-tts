import { proxy } from "valtio";
import { eNetworkRequestState, iAppState } from "./types";
import { nanoid } from "nanoid";
import * as _ from "lodash";

export const state = proxy<iAppState>({
  armyListShareLink: "",
  shareableLinkForTTS: undefined,
  armySpecialRulesDict: [],
  coreSpecialRulesDict: [],
  armySpecialRulesDictNames: [],
  unitProfiles: [],
  ttsOutputConfig: {
    includeFullArmySpecialRulesText: true,
    includeFullCoreSpecialRulesText: true,
    includeCoreSpecialRules: true,
    includeArmySpecialRules: true,
    includeWeaponsListInName: false,
    includeSpecialRulesListInName: false,
    useShorterVersionOfCoreSpecialRules: false,
    includeToughSpecialRuleRatingInName: true,
    swapCustomNameBracketingForUnitsWithMultipleModels: true,
    completelyReplaceNameWithCustomName: false,
    disableSmallText: false,
    includeCampaignXp: false,
    includeCampaignTraits: false,
    includeCampaignTraitsFullText: false,

    modelWeaponOutputColour: "#fde047",
    modelSpecialRulesOutputColour: "#f472b6",
    modelQuaOutputColour: "#ef4444",
    modelDefOutputColour: "#0ea5e9",
    modelToughOutputColour: "#2ecc71",
    modelCampaignStuffOutputColour: "#a55eea",
  },
  networkState: {
    fetchArmyFromArmyForge: eNetworkRequestState.IDLE,
    saveArmyListAsBBToDB: eNetworkRequestState.IDLE,
  },
});

export const updateWeaponQuantity = (
  upId: string,
  mId: string,
  wpId: string,
  quantity: number
) => {
  const unit = state.unitProfiles.find((up) => up.id === upId);
  if (unit) {
    const model = unit.models.find((m) => m.id === mId);
    if (model) {
      const weapon = model.loadout.find((wp) => wp.id === wpId);
      if (weapon) {
        weapon.quantity = quantity;

        // if we've just reduced the quantity down to zero or less, also untick the include in names
        if (weapon.quantity <= 0) {
          weapon.includeInName = false;
        }
      }
    }
  }
};

export const updateWeaponIncludeInName = (
  upId: string,
  mId: string,
  wpId: string,
  includeInName: boolean
) => {
  const unit = state.unitProfiles.find((up) => up.id === upId);
  if (unit) {
    const model = unit.models.find((m) => m.id === mId);
    if (model) {
      const weapon = model.loadout.find((wp) => wp.id === wpId);
      if (weapon) {
        weapon.includeInName = includeInName;

        // if we're turning it on and the weapon is currently quantity 0, also set it to quantity 1
        // if (weapon.includeInName && weapon.quantity <= 0) {
        //   weapon.quantity = 1;
        // }
        // // if we're turning it off and its currently set to quantity 1 exactly, set it to quantity 0
        // if (!weapon.includeInName && weapon.quantity >= 1) {
        //   weapon.quantity = 0;
        // }
      }
    }
  }
};

export const duplicateModel = (upId: string, mId: string) => {
  const unit = state.unitProfiles.find((up) => up.id === upId);
  if (unit) {
    const model = unit.models.find((m) => m.id === mId);
    if (model) {
      unit.models.push({
        ..._.cloneDeep(model),
        isGenerated: false,
        id: nanoid(),
      });
    }
  }
};

export const deleteModel = (upId: string, mId: string) => {
  const unit = state.unitProfiles.find((up) => up.id === upId);
  if (unit) {
    const modelIndex = unit.models.findIndex((m) => m.id === mId);
    unit.models.splice(modelIndex, 1);
  }
};
