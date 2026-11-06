import ky from "ky";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ArmyForgeTypes from "./army-forge-types";
import { initialTtsOutputConfig, resetState, state } from "./state";
import {
  buildStateView,
  LIST_FIXTURE_IDS,
  loadCommonRulesFor,
  loadList,
  maskNanoids,
  shareLinkFor,
  stubArmyForgeFetch,
} from "./test-helpers";
import {
  eCampaignTraitCategory,
  eNetworkRequestState,
  iAppState,
  iUnitProfile,
} from "./types";
import {
  CURRENT_RULES_VERSION,
  extractIdFromUrl,
  generateLoadoutItemDefinition,
  generateOriginalLoadoutCsvHelperString,
  generateUnitOutput,
  getCampaignTraitCategory,
  getModelNameForOutput,
  getUnitNameForSavedShareableOutput,
  insertLineBreaksIntoString,
  isUnitHero,
  onGenerateDefinitions,
  onGenerateShareableId,
  removeQuantityStringFromStartOfString,
} from "./utils";

// F1: AoF Saurians, Frog-Mage with Ancient Palanquin + Enlightened Mage
const F1 = "xAhPsZKN9hXd";
// F2: GF Battle Brothers, campaign mode, combined/joined/custom name/upgrades
const F2 = "rzS5YWEN4vHF";

const stateViewFor = (
  id: string,
  configOverrides: Partial<iAppState["ttsOutputConfig"]> = {}
) => {
  const list = loadList(id);
  return buildStateView(list, loadCommonRulesFor(list), configOverrides);
};

const outputsFor = (stateView: iAppState) =>
  stateView.unitProfiles.flatMap((unit) =>
    unit.models.map((model) => ({
      unit: unit.originalName,
      selectionId: unit.originalSelectionId,
      ...generateUnitOutput(unit, model, stateView),
    }))
  );

const unitBySelectionId = (stateView: iAppState, selectionId: string) => {
  const unit = stateView.unitProfiles.find(
    (u) => u.originalSelectionId === selectionId
  );
  if (!unit) throw new Error(`no unit ${selectionId}`);
  return unit;
};

const BOOLEAN_TOGGLES = (
  Object.keys(initialTtsOutputConfig) as (keyof typeof initialTtsOutputConfig)[]
).filter((k) => typeof initialTtsOutputConfig[k] === "boolean");

describe("generateUnitOutput snapshots", () => {
  describe.each(LIST_FIXTURE_IDS)("fixture tts-%s", (id) => {
    it("default config", async () => {
      expect(outputsFor(await stateViewFor(id))).toMatchSnapshot();
    });

    // Most toggles don't touch most lists. Storing a marker for those keeps the
    // snapshot file small, and a toggle that starts (or stops) changing the output
    // still shows up as a snapshot diff.
    it.each(BOOLEAN_TOGGLES)("%s flipped", async (toggle) => {
      const defaults = outputsFor(await stateViewFor(id));
      const flipped = outputsFor(
        await stateViewFor(id, { [toggle]: !initialTtsOutputConfig[toggle] })
      );
      expect(
        JSON.stringify(flipped) === JSON.stringify(defaults)
          ? "[same as default config]"
          : flipped
      ).toMatchSnapshot();
    });
  });
});

describe("onGenerateDefinitions", () => {
  beforeEach(() => resetState());

  describe.each(LIST_FIXTURE_IDS)("fixture tts-%s", (id) => {
    it("maps the list into state", async () => {
      const list = loadList(id);
      const fetchMock = stubArmyForgeFetch(list, loadCommonRulesFor(list));
      state.armyListShareLink = shareLinkFor(id);

      await onGenerateDefinitions(state);

      expect(state.networkState.fetchArmyFromArmyForge).toBe(
        eNetworkRequestState.SUCCESS
      );
      expect(fetchMock.mock.calls.map((c) => c[0])).toMatchSnapshot();
      expect(
        maskNanoids({
          unitProfiles: state.unitProfiles,
          armySpecialRulesDict: state.armySpecialRulesDict,
          coreSpecialRulesDict: state.coreSpecialRulesDict,
          campaignTraitsDict: state.campaignTraitsDict,
          listName: state.listName,
          gameSystem: state.gameSystem,
        })
      ).toMatchSnapshot();
    });
  });

  it("passes isBeta=true for beta links", async () => {
    const list = loadList(F1);
    const fetchMock = stubArmyForgeFetch(list, loadCommonRulesFor(list));
    state.armyListShareLink = shareLinkFor(F1, true);

    await onGenerateDefinitions(state);

    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      `/.netlify/functions/get-army?armyId=${F1}&isBeta=true`,
      `/.netlify/functions/get-army?commonRulesId=4&isBeta=true`,
    ]);
  });

  it("alerts and goes back to IDLE when the link has no id", async () => {
    const fetchMock = stubArmyForgeFetch({}, {});
    state.armyListShareLink = "https://army-forge.onepagerules.com/share";

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith(
      "Could not find an Army Forge army ID. Please double check your Army Forge share link and try again."
    );
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.IDLE
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("alerts the upstream error message from the list request", async () => {
    stubArmyForgeFetch({ error: "Army Forge failed to export list. Sorry!" }, {}, {
      listStatus: 500,
    });
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith(
      "Army Forge failed to export list. Sorry!"
    );
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
    expect(state.unitProfiles).toEqual([]);
  });

  it("alerts the error JSON even on a 200", async () => {
    stubArmyForgeFetch({ error: "something upstream" }, {});
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith("something upstream");
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
  });

  it("alerts the generic message on a non-200 with no error field", async () => {
    stubArmyForgeFetch({}, {}, { listStatus: 404 });
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith(
      "Army Forge failed to export list. Sorry!"
    );
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
  });

  it("alerts when the common rules request fails", async () => {
    stubArmyForgeFetch(loadList(F1), {}, { commonRulesStatus: 500 });
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith("Failed to fetch common rules. Sorry!");
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
    expect(state.unitProfiles).toEqual([]);
  });

  it("doesn't request common rules for a game system it can't map", async () => {
    const list = { ...loadList(F1), gameSystem: "gfsq" };
    const fetchMock = stubArmyForgeFetch(list, {});
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      `/.netlify/functions/get-army?armyId=${F1}&isBeta=false`,
    ]);
    expect(alert).toHaveBeenCalledWith(
      "This list uses a game system the app doesn't support yet (gfsq)."
    );
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
  });

  it("doesn't treat Object.prototype names as game systems", async () => {
    const fetchMock = stubArmyForgeFetch(
      { ...loadList(F1), gameSystem: "toString" },
      {}
    );
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith(
      "This list uses a game system the app doesn't support yet (toString)."
    );
  });

  const upstreamUnavailable = {
    error: "Army Forge isn't responding right now. Try again in a few minutes.",
    code: "UPSTREAM_UNAVAILABLE",
  };

  it("explains when Army Forge is down", async () => {
    stubArmyForgeFetch(upstreamUnavailable, {}, { listStatus: 502 });
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith(
      "Army Forge isn't responding right now. Try again in a few minutes."
    );
    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
  });

  it("explains when the Army Forge beta site is down", async () => {
    stubArmyForgeFetch(upstreamUnavailable, {}, { listStatus: 502 });
    state.armyListShareLink = shareLinkFor(F1, true);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith(
      "The Army Forge beta site isn't responding. Beta lists can't be imported until it's back."
    );
  });

  it("explains when Army Forge goes down between the two requests", async () => {
    stubArmyForgeFetch(loadList(F1), upstreamUnavailable, {
      commonRulesStatus: 502,
    });
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(alert).toHaveBeenCalledWith(
      "Army Forge isn't responding right now. Try again in a few minutes."
    );
  });

  it("ends in ERROR, not SUCCESS, when mapping the list throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const list = { ...loadList(F1), specialRules: null };
    stubArmyForgeFetch(list, loadCommonRulesFor(loadList(F1)));
    state.armyListShareLink = shareLinkFor(F1);

    await onGenerateDefinitions(state);

    expect(state.networkState.fetchArmyFromArmyForge).toBe(
      eNetworkRequestState.ERROR
    );
    expect(state.unitProfiles).toEqual([]);
  });

  it("adds a gained rule that isn't already in the loadout (selected-upgrades merge)", async () => {
    // No live 3.6 list reaches this branch: every gain is a weapon or an item that
    // already shows up in `loadout`. Hand-build a bare ArmyBookRule gain instead.
    const list = loadList(F2);
    const unit = list.units[0];
    const gain = {
      name: "Synthetic Rule",
      label: "Synthetic Rules",
      type: "ArmyBookRule",
      count: 1,
    } as ArmyForgeTypes.IUpgradeGains;
    unit.selectedUpgrades = [
      ...unit.selectedUpgrades,
      {
        instanceId: "synthetic",
        upgrade: {} as ArmyForgeTypes.IUpgrade,
        option: { label: "Synthetic Rule", gains: [gain] } as any,
      },
    ];
    stubArmyForgeFetch(list, loadCommonRulesFor(list));
    state.armyListShareLink = shareLinkFor(F2);

    await onGenerateDefinitions(state);

    const loadout = unitBySelectionId(state, unit.selectionId).models[0]
      .loadout;
    const added = loadout[loadout.length - 1];
    expect(maskNanoids(added)).toEqual({
      id: "[nanoid]",
      includeInName: false,
      name: "Synthetic Rule",
      definition: "",
      quantity: 1,
      originalLoadout: { content: [gain] },
    });
  });
});

describe("onGenerateShareableId", () => {
  beforeEach(() => resetState());
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stamps the saved list with the rules version", async () => {
    const list = loadList(F2);
    stubArmyForgeFetch(list, loadCommonRulesFor(list));
    state.armyListShareLink = shareLinkFor(F2);
    await onGenerateDefinitions(state);

    // ky can't build a Request from a relative url under node, so stub ky itself
    const postSpy = vi
      .spyOn(ky, "post")
      .mockReturnValue({ json: async () => ({ listId: "abc" }) } as any);
    vi.stubGlobal("window", { location: { href: "http://localhost/" } });

    await onGenerateShareableId(state);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, options] = postSpy.mock.calls[0];
    expect(url).toBe("/.netlify/functions/save-list");
    expect((options as any).json.list_json.rulesVersion).toBe("3.6");
    expect(CURRENT_RULES_VERSION).toBe("3.6");
    expect(state.networkState.saveArmyListAsBBToDB).toBe(
      eNetworkRequestState.SUCCESS
    );
  });
});

describe("fixed bugs", () => {
  it("B1: Caster granted by two different items stacks", async () => {
    const stateView = await stateViewFor(F1);
    const frogMage = stateView.unitProfiles[0];
    expect(frogMage.originalName).toBe("Frog-Mage");
    const output = generateUnitOutput(frogMage, frogMage.models[0], stateView);
    // Caster(3) + Caster(1) from Ancient Palanquin + Caster(1) from Enlightened Mage
    expect(output.originalCasterValue).toBe(5);
    expect(output.ttsDescriptionOutput).toContain("Caster (5)");
    // Tough(6) + Tough(3) from Ancient Palanquin
    expect(output.originalToughValue).toBe(9);
    expect(output.ttsDescriptionOutput).toContain("Tough (9)");
  });

  it("B1: one rule reached twice through the same item counts once", () => {
    // the item's content holds Caster(1), and that content entry's own
    // specialRules repeat it
    const caster = { name: "Caster", type: "ArmyBookRule", rating: 1 };
    const stateView = {
      armySpecialRulesDict: [{ name: "Caster", description: "casts" }],
      coreSpecialRulesDict: [{ name: "Caster", description: "casts" }],
      ttsOutputConfig: initialTtsOutputConfig,
    } as unknown as iAppState;
    const unit = {
      originalName: "Mage",
      originalModelCountInUnit: 1,
      models: [
        {
          name: "Mage",
          qua: 4,
          def: 4,
          originalSpecialRules: [],
          campaignTraits: [],
          xp: 0,
          loadout: [
            {
              name: "Staff",
              definition: "(Caster(1))",
              quantity: 1,
              includeInName: false,
              originalLoadout: {
                name: "Staff",
                type: "ArmyBookItem",
                content: [{ ...caster, specialRules: [caster] }],
              },
            },
          ],
        },
      ],
    } as unknown as iUnitProfile;
    expect(
      generateUnitOutput(unit, unit.models[0], stateView).originalCasterValue
    ).toBe(1);
  });

  it("B3: isUnitHero finds a 3.6 hero by name (no key)", async () => {
    const stateView = await stateViewFor(F1);
    expect(isUnitHero(stateView.unitProfiles[0])).toBe(true);
    expect(isUnitHero(stateView.unitProfiles[1])).toBe(false);
  });

  it("B3: isUnitHero still finds a pre-3.6 hero by key", () => {
    const unit = {
      models: [{ originalSpecialRules: [{ key: "hero", name: "Held" }] }],
    } as unknown as iUnitProfile;
    expect(isUnitHero(unit)).toBe(true);
  });

  it("B3: a joined hero's saved name says joined to", async () => {
    const stateView = await stateViewFor(F2);
    const masterDestroyer = unitBySelectionId(stateView, "_bRm3");
    expect(
      getUnitNameForSavedShareableOutput(masterDestroyer, stateView)
    ).toMatch(
      /^#\d+ Master Destroyer \(joined to #\d+ This is a custom name for some assault brothers \(Assault Brothers\)\)$/
    );
  });

  it("B3: combined units still say combined with", async () => {
    const stateView = await stateViewFor(F2);
    expect(
      getUnitNameForSavedShareableOutput(
        unitBySelectionId(stateView, "1ExGD"),
        stateView
      )
    ).toMatch(/\(combined with #\d+ Battle Brothers\)$/);
  });
});

describe("extractIdFromUrl", () => {
  it("reads the id from a live link", () => {
    expect(
      extractIdFromUrl("https://army-forge.onepagerules.com/share?id=abc123")
    ).toEqual({ id: "abc123", isBeta: false });
  });
  it("flags beta links", () => {
    expect(
      extractIdFromUrl(
        "https://army-forge-beta.onepagerules.com/share?id=abc123"
      )
    ).toEqual({ id: "abc123", isBeta: true });
  });
  it("stops at the next query param", () => {
    expect(
      extractIdFromUrl(
        "https://army-forge.onepagerules.com/share?id=abc_12-3&name=Battle_Brothers"
      )
    ).toEqual({ id: "abc_12-3", isBeta: false });
  });
  it("returns null without an id", () => {
    expect(
      extractIdFromUrl("https://army-forge.onepagerules.com/share?name=x")
    ).toEqual({ id: null, isBeta: false });
  });
});

describe("removeQuantityStringFromStartOfString", () => {
  it("strips a single-digit quantity prefix, leaving the space for the caller to trim", () => {
    expect(removeQuantityStringFromStartOfString("3x Warriors")).toBe(
      " Warriors"
    );
  });
  it("leaves other strings alone", () => {
    expect(removeQuantityStringFromStartOfString("Warriors")).toBe("Warriors");
    expect(removeQuantityStringFromStartOfString("10x Warriors")).toBe(
      "10x Warriors"
    );
    expect(removeQuantityStringFromStartOfString("3xWarriors")).toBe(
      "3xWarriors"
    );
  });
});

describe("generateLoadoutItemDefinition", () => {
  const base = { count: 1, originalCount: 1 };
  const statLine = {
    range: 24,
    attacks: 2,
    specialRules: [
      { name: "AP", rating: 1 },
      { name: "Reliable" },
    ],
  };

  it.each(["ArmyBookWeapon", "ArmyBookRule", "ArmyBookDefense"] as const)(
    "%s builds range, attacks and rules",
    (type) => {
      expect(
        generateLoadoutItemDefinition({
          ...base,
          ...statLine,
          name: "Thing",
          label: "Thing (24'', A2, AP(1), Reliable)",
          type,
        } as any)
      ).toBe("(24'', A2, AP(1), Reliable)");
    }
  );

  it("handles a melee weapon with no rules", () => {
    expect(
      generateLoadoutItemDefinition({
        ...base,
        name: "Strike",
        label: "Strike (A2)",
        type: "ArmyBookWeapon",
        range: 0,
        attacks: 2,
        specialRules: [],
      } as any)
    ).toBe("(A2)");
  });

  it("ArmyBookItem strips the name from the label", () => {
    expect(
      generateLoadoutItemDefinition({
        ...base,
        name: "Combat Shield",
        label: "Combat Shield (Armor(2))",
        type: "ArmyBookItem",
      } as any)
    ).toBe("(Armor(2))");
  });

  it("ArmyBookItem with a null label joins the content names", () => {
    expect(
      generateLoadoutItemDefinition({
        ...base,
        name: "Ancient Palanquin",
        label: null,
        type: "ArmyBookItem",
        content: [{ name: "Magic Pulse" }, { name: "Caster" }],
      } as any)
    ).toBe("(Magic Pulse, Caster)");
  });
});

describe("getModelNameForOutput", () => {
  const unit = (overrides: Partial<iUnitProfile>) =>
    ({
      originalName: "Assault Brothers",
      originalModelCountInUnit: 5,
      ...overrides,
    } as iUnitProfile);
  const model = { name: "Assault Brother" } as any;
  const config = (
    overrides: Partial<iAppState["ttsOutputConfig"]> = {}
  ) => ({ ...initialTtsOutputConfig, ...overrides });

  it("completely replaces the name with the singular custom name", () => {
    expect(
      getModelNameForOutput(
        unit({ customName: "Red Guards", customNameSingular: "Red Guard" }),
        model,
        config({ completelyReplaceNameWithCustomName: true })
      )
    ).toBe("Red Guard");
  });

  it("puts the custom name in brackets for multi-model units", () => {
    expect(
      getModelNameForOutput(
        unit({ customName: "Red Guards" }),
        model,
        config({ swapCustomNameBracketingForUnitsWithMultipleModels: true })
      )
    ).toBe("Assault Brother (Red Guards)");
  });

  it("uses the original name for multi-model units without a custom name", () => {
    expect(
      getModelNameForOutput(
        unit({}),
        model,
        config({ swapCustomNameBracketingForUnitsWithMultipleModels: true })
      )
    ).toBe("Assault Brothers");
  });

  it("puts the model name in brackets otherwise", () => {
    expect(
      getModelNameForOutput(
        unit({ customName: "Red Guards", originalModelCountInUnit: 1 }),
        model,
        config()
      )
    ).toBe("Red Guards (Assault Brother)");
  });

  it("falls back to the original name", () => {
    expect(
      getModelNameForOutput(
        unit({ originalModelCountInUnit: 1 }),
        model,
        config()
      )
    ).toBe("Assault Brothers");
  });
});

describe("getUnitNameForSavedShareableOutput", () => {
  it("names plain, custom-named, combined and joined units", async () => {
    const stateView = await stateViewFor(F2);
    expect(
      stateView.unitProfiles.map((u) =>
        getUnitNameForSavedShareableOutput(u, stateView)
      )
    ).toMatchSnapshot();
  });

  it("uses the custom name with the original in brackets", async () => {
    const stateView = await stateViewFor(F2);
    const name = getUnitNameForSavedShareableOutput(
      unitBySelectionId(stateView, "iq-qg"),
      stateView
    );
    expect(name).toMatch(
      /^#\d+ This is a custom name for some assault brothers \(Assault Brothers\)$/
    );
  });
});

describe("insertLineBreaksIntoString", () => {
  it("leaves short strings alone", () => {
    expect(insertLineBreaksIntoString("Strider")).toBe("Strider");
  });

  it("breaks long strings at a space so no line passes 54 characters", () => {
    const input =
      "Once a model has taken as many wounds as its Tough value, it is killed and removed from play.";
    const result = insertLineBreaksIntoString(input);
    expect(result).toMatchSnapshot();
    expect(result.replace(/\r\n/g, " ")).toBe(input);
    for (const line of result.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(54);
    }
  });
});

describe("getCampaignTraitCategory", () => {
  const trait = (type: number) =>
    ({ type } as ArmyForgeTypes.ICommonRuleTrait);

  it("maps the Army Forge trait type", () => {
    expect(getCampaignTraitCategory(undefined)).toBe(
      eCampaignTraitCategory.TRAIT
    );
    expect(getCampaignTraitCategory(trait(0))).toBe(
      eCampaignTraitCategory.TRAIT
    );
    expect(getCampaignTraitCategory(trait(1))).toBe(
      eCampaignTraitCategory.INJURY
    );
    expect(getCampaignTraitCategory(trait(2))).toBe(
      eCampaignTraitCategory.TALENT
    );
    expect(getCampaignTraitCategory(trait(3))).toBe(
      eCampaignTraitCategory.SKILL_SET
    );
    expect(getCampaignTraitCategory(trait(99))).toBe(
      eCampaignTraitCategory.TRAIT
    );
  });
});

describe("generateOriginalLoadoutCsvHelperString", () => {
  it("lists loadout counts", () => {
    const frogMage = loadList(F1).units[0];
    expect(generateOriginalLoadoutCsvHelperString(frogMage)).toBe(
      "1x Ancient Palanquin, 1x Enlightened Mage, 1x Sorcerous Blast, 1x Strike"
    );
  });

  it("appends single-rule upgrades", () => {
    const unit = loadList(F1).units[1];
    unit.selectedUpgrades = [
      {
        instanceId: "synthetic",
        upgrade: {} as ArmyForgeTypes.IUpgrade,
        option: {
          label: "Banners",
          gains: [{ name: "Banner", type: "ArmyBookRule" }],
        } as any,
      },
    ];
    expect(generateOriginalLoadoutCsvHelperString(unit)).toBe(
      `${unit.loadout.map((l) => `${l.count}x ${l.name}`).join(", ")}, 1x Banner`
    );
  });
});
