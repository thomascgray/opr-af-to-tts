import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteModel,
  duplicateModel,
  resetState,
  state,
  updateCampaignTraitIncludeInOutput,
  updateWeaponIncludeInName,
  updateWeaponQuantity,
} from "./state";
import { eCampaignTraitCategory, iUnitProfile } from "./types";

const buildUnit = (): iUnitProfile =>
  ({
    id: "u1",
    originalName: "Pathfinder Snipers",
    originalModelCountInUnit: 3,
    originalSelectionId: "o5mHF",
    originalLoadoutCsvHelperString: "",
    originalUnit: {} as any,
    models: [
      {
        id: "m1",
        name: "Pathfinder Sniper",
        originalName: "Pathfinder Snipers",
        qua: 3,
        def: 4,
        isGenerated: true,
        originalSpecialRules: [],
        xp: 10,
        campaignTraits: [
          {
            id: "t1",
            name: "Agile",
            category: eCampaignTraitCategory.TRAIT,
            description: "desc",
            includeInOutput: true,
          },
        ],
        loadout: [
          {
            id: "w1",
            name: "Sniper Rifle",
            definition: "(30'', A1, AP(1), Reliable)",
            quantity: 1,
            includeInName: true,
            originalLoadout: {} as any,
          },
        ],
      },
    ],
  } as iUnitProfile);

const model = (mId = "m1") =>
  state.unitProfiles[0].models.find((m) => m.id === mId)!;

describe("state mutators", () => {
  beforeEach(() => {
    resetState();
    state.unitProfiles = [buildUnit()];
  });

  it("updateWeaponQuantity sets the quantity", () => {
    updateWeaponQuantity("u1", "m1", "w1", 3);
    expect(model().loadout[0].quantity).toBe(3);
    expect(model().loadout[0].includeInName).toBe(true);
  });

  it("updateWeaponQuantity at zero also unticks include in name", () => {
    updateWeaponQuantity("u1", "m1", "w1", 0);
    expect(model().loadout[0].quantity).toBe(0);
    expect(model().loadout[0].includeInName).toBe(false);
  });

  it("updateWeaponQuantity ignores unknown ids", () => {
    updateWeaponQuantity("nope", "m1", "w1", 5);
    updateWeaponQuantity("u1", "nope", "w1", 5);
    updateWeaponQuantity("u1", "m1", "nope", 5);
    expect(model().loadout[0].quantity).toBe(1);
  });

  it("updateWeaponIncludeInName sets the flag and leaves quantity alone", () => {
    updateWeaponIncludeInName("u1", "m1", "w1", false);
    expect(model().loadout[0].includeInName).toBe(false);
    expect(model().loadout[0].quantity).toBe(1);
  });

  it("duplicateModel deep-clones with fresh model and trait ids", () => {
    duplicateModel("u1", "m1");
    const models = state.unitProfiles[0].models;
    expect(models).toHaveLength(2);
    const [original, copy] = models;
    expect(copy.isGenerated).toBe(false);
    expect(copy.id).not.toBe(original.id);
    expect(copy.campaignTraits[0].id).not.toBe(original.campaignTraits[0].id);
    expect(copy.campaignTraits[0].name).toBe("Agile");
    expect(copy.loadout).toEqual(original.loadout);

    copy.loadout[0].quantity = 7;
    expect(original.loadout[0].quantity).toBe(1);
  });

  it("updateCampaignTraitIncludeInOutput sets the flag", () => {
    updateCampaignTraitIncludeInOutput("u1", "m1", "t1", false);
    expect(model().campaignTraits[0].includeInOutput).toBe(false);
  });

  it("deleteModel removes the model", () => {
    duplicateModel("u1", "m1");
    deleteModel("u1", "m1");
    expect(state.unitProfiles[0].models.map((m) => m.isGenerated)).toEqual([
      false,
    ]);
  });

  it("resetState restores initial values", () => {
    state.listName = "x";
    state.ttsOutputConfig.disableSmallText = true;
    resetState();
    expect(state.listName).toBeUndefined();
    expect(state.unitProfiles).toEqual([]);
    expect(state.ttsOutputConfig.disableSmallText).toBe(false);
  });
});
