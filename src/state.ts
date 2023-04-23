import { proxy } from "valtio";
import { eNetworkRequestState, iAppState } from "./types";
import { nanoid } from "nanoid";
import * as _ from "lodash";

export const state = proxy<iAppState>({
  armyListShareLink: "",
  armySpecialRulesDict: [],
  armySpecialRulesDictNames: [],
  unitProfiles: [],
  ttsOutputConfig: {
    includeFullSpecialRulesText: true,
    modelWeaponOutputColour: "#e74c3c",
    modelSpecialRulesOutputColour: "#f1c40f",
  },
  networkState: {
    fetchArmyList: eNetworkRequestState.IDLE,
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
