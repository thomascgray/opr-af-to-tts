import * as _ from "lodash";
import { eGameSystemInitials } from "./army-forge-types";
import ky from "ky";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import * as ArmyForgeTypes from "./army-forge-types";
import {
  eNetworkRequestState,
  iAppState,
  iTotalShareableOutput,
  iUnitProfile,
  iUnitProfileModel,
  iUnitProfileModelTTSOutput,
} from "./types";
import { state } from "./state";

export const getUrlSlugForGameSystem = (
  gameSystemInitials: eGameSystemInitials
) => {
  switch (gameSystemInitials) {
    case eGameSystemInitials.GF:
      return "grimdark-future";
    case eGameSystemInitials.GFF:
      return "grimdark-future-firefight";
    case eGameSystemInitials.AOF:
      return "age-of-fantasy";
    case eGameSystemInitials.AOFS:
      return "age-of-fantasy-skirmish";
    case eGameSystemInitials.AOFR:
      return "age-of-fantasy-regiments";
  }
};

export const removeQuantityStringFromStartOfString = (str: string) => {
  if (/^\dx /.test(str)) {
    return str.substring(2);
  } else {
    return str;
  }
};

export const extractIdFromUrl = (url: string) => {
  const idRegex = /id=([^&]+)/;
  const match = idRegex.exec(url);
  return match ? match[1] : null;
};

export const generateLoadoutItemDefinition = (
  loadoutItem: ArmyForgeTypes.IUpgradeGains
) => {
  if (loadoutItem.type === "ArmyBookWeapon") {
    const chunks: string[] = [];
    const w = loadoutItem as ArmyForgeTypes.IUpgradeGainsWeapon;
    if (w.range) {
      chunks.push(`${w.range}''`);
    }
    if (w.attacks) {
      chunks.push(`A${w.attacks}`);
    }
    (w.specialRules || []).forEach((sr) => {
      let srString = `${sr.name}`;
      if (sr.rating) {
        srString += `(${sr.rating})`;
      }
      chunks.push(srString);
    });
    return `(${chunks.join(", ")})`;
  }
  if (loadoutItem.type === "ArmyBookItem") {
    return loadoutItem.label.replace(loadoutItem.name, "").trim();
  }

  if (loadoutItem.type === "ArmyBookRule") {
    const chunks: string[] = [];
    const w = loadoutItem as ArmyForgeTypes.IUpgradeGainsWeapon;
    if (w.range) {
      chunks.push(`${w.range}''`);
    }
    if (w.attacks) {
      chunks.push(`A${w.attacks}`);
    }
    (w.specialRules || []).forEach((sr) => {
      let srString = `${sr.name}`;
      if (sr.rating) {
        srString += `(${sr.rating})`;
      }
      chunks.push(srString);
    });
    return `(${chunks.join(", ")})`;
  }

  // otherwise its ArmyBookDefense
  const chunks: string[] = [];
  const w = loadoutItem as ArmyForgeTypes.IUpgradeGainsWeapon;
  if (w.range) {
    chunks.push(`${w.range}''`);
  }
  if (w.attacks) {
    chunks.push(`A${w.attacks}`);
  }
  (w.specialRules || []).forEach((sr) => {
    let srString = `${sr.name}`;
    if (sr.rating) {
      srString += `(${sr.rating})`;
    }
    chunks.push(srString);
  });
  return `(${chunks.join(", ")})`;
};

export const onGenerateDefinitions = async (stateView: Readonly<iAppState>) => {
  state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.PENDING;
  const id = extractIdFromUrl(stateView.armyListShareLink);
  let data: ArmyForgeTypes.ListState | undefined = undefined;
  let coreRulesResponseData;
  if (!id) {
    return;
  }

  try {
    // get the army list
    data = await fetch(`/.netlify/functions/get-army?armyId=${id}`).then(
      (res) => res.json()
    );
    if (!data) {
      state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.ERROR;
      return;
    }
    // then get the core rules for the game we're playing
    const gameSystemUrlSlug = getUrlSlugForGameSystem(data.gameSystem);
    coreRulesResponseData = await fetch(
      `https://army-forge-studio.onepagerules.com/api/public/game-systems/${gameSystemUrlSlug}/common-rules`
    ).then((res) => res.json());

    state.gameSystem = data.gameSystem;
    state.coreSpecialRulesDict = coreRulesResponseData.map((c: any) => {
      return {
        name: c.name,
        description: c.description,
      };
    });
    // @ts-ignore
    if (data && data.error) {
      state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.ERROR;
      return;
    }
    state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.SUCCESS;
  } catch (e) {
    state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.ERROR;
  }

  if (!data) {
    return;
  }

  const unitProfiles: iUnitProfile[] = data.units.map((unit) => {
    const unitProfile: iUnitProfile = {
      id: nanoid(),
      originalName: unit.name,
      originalModelCountInUnit: unit.size,
      customName: unit.customName,
      originalSelectionId: unit.selectionId,
      originalJoinToUnit: unit.joinToUnit,
      customNameSingular: unit.customName
        ? pluralize.singular(unit.customName)
        : undefined,
      originalUnit: unit,
      models: [
        {
          id: nanoid(),
          isGenerated: true,
          xp: unit.xp || 0,
          traits: unit.traits || [],
          name: pluralize.singular(
            removeQuantityStringFromStartOfString(unit.name).trim()
          ),
          originalName: unit.name,
          qua: parseInt(unit.quality),
          def: parseInt(unit.defense),
          originalSpecialRules: unit.specialRules || [],
          loadout: _.uniqBy(unit.loadout, "label").map((loadoutItem) => {
            return {
              id: nanoid(),
              includeInName: false,
              name: pluralize.singular(loadoutItem.name),
              definition: generateLoadoutItemDefinition(loadoutItem),
              quantity: Math.floor(Math.max(loadoutItem.count / unit.size, 1)),
              originalLoadout: loadoutItem,
            };
          }),
        },
      ],
    };

    // some of the upgrades that a unit can take DON'T appear in the loadout
    // by default. however, for these upgrades we DO want them to in "our" loadout
    // so that they can be selected on and off. therefore, we do this sort-of
    // hack where we manually insert them into the units loadout
    unit.selectedUpgrades
      .filter((su) => {
        return (
          su.option.gains.length === 1 &&
          su.option.gains[0].type === "ArmyBookRule"
        );
      })
      .forEach((su) => {
        unitProfile.models[0].loadout.push({
          id: nanoid(),
          includeInName: false,
          name: pluralize.singular(su.option.label),
          definition: "",
          quantity: 1,
          originalLoadout: {
            // @ts-ignore again, loadouts CAN have `content`
            content: su.option.gains,
          },
        });
      });

    return unitProfile;
  });

  state.armySpecialRulesDict = [
    ...stateView.coreSpecialRulesDict,
    // @ts-ignore interface doesn't include new specialRules array
    ...data.specialRules.map((sr) => {
      return {
        name: sr.name,
        description: sr.description,
      };
    }),
  ];

  state.unitProfiles = unitProfiles;
};

export const onGenerateShareableId = async (stateView: Readonly<iAppState>) => {
  state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.PENDING;
  state.shareableLinkForTTS = undefined;

  const totalOutput: iTotalShareableOutput = {
    gameSystem: stateView.gameSystem || ArmyForgeTypes.eGameSystemInitials.GF,
    units: [],
  };

  _.sortBy(stateView.unitProfiles, ["originalUnit.sortId"]).forEach(
    (unitProfile, unitIndex) => {
      let thisUnitsModelDefinitions: iUnitProfileModelTTSOutput[] = [];
      const unitId = nanoid();

      unitProfile.models.forEach((model) => {
        const { name, loadoutCSV, ttsNameOutput, ttsDescriptionOutput } =
          generateUnitOutput(unitProfile, model, stateView);

        thisUnitsModelDefinitions.push({
          name,
          loadoutCSV,
          ttsNameOutput,
          ttsDescriptionOutput,
        });
      });

      totalOutput.units.push({
        name: getUnitNameForSavedShareableOutput(unitProfile),
        modelDefinitions: thisUnitsModelDefinitions,
        unitId,
      });
    }
  );

  let data;
  state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.PENDING;

  try {
    data = await ky
      .post("/.netlify/functions/save-list", {
        json: {
          list_json: totalOutput,
        },
      })
      .json();

    const { listId } = data as any;
    state.shareableLinkForTTS = `${window.location.href}.netlify/functions/save-list?listId=${listId}`;
    state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.SUCCESS;
  } catch (e) {
    console.error(e);
    state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.ERROR;
  }
};

// this is absolutely atrocious lmao, forgive me
export const generateUnitOutput = (
  unit: iUnitProfile,
  model: iUnitProfileModel,
  stateView: Readonly<iAppState>
  // ttsOutputConfig: iAppState["ttsOutputConfig"]
): iUnitProfileModelTTSOutput => {
  const TTS_WEAPON_COLOUR =
    stateView.ttsOutputConfig.modelWeaponOutputColour.replace("#", "");
  const TTS_SPECIAL_RULES_COLOUR =
    stateView.ttsOutputConfig.modelSpecialRulesOutputColour.replace("#", "");

  const TTS_QUA_COLOUR = stateView.ttsOutputConfig.modelQuaOutputColour.replace(
    "#",
    ""
  );
  const TTS_DEF_COLOUR = stateView.ttsOutputConfig.modelDefOutputColour.replace(
    "#",
    ""
  );
  const TTS_TOUGH_COLOUR =
    stateView.ttsOutputConfig.modelToughOutputColour.replace("#", "");
  const TTS_CAMPAIGN_COLOUR =
    stateView.ttsOutputConfig.modelCampaignStuffOutputColour.replace("#", "");
  const equippedLoadoutItems = model.loadout.filter((w) => w.quantity > 0);

  let modelNameString = `[b]${getModelNameForOutput(
    unit,
    model,
    stateView.ttsOutputConfig
  )}[/b]`;
  let modelNamePlainWithLoudoutString = getModelNameForOutput(
    unit,
    model,
    stateView.ttsOutputConfig
  );
  const loadoutNames = equippedLoadoutItems
    .filter((l) => l.includeInName)
    .map((l) => {
      if (l.quantity > 1) {
        return `${l.quantity}x ${l.name}`;
      }
      return l.name;
    });
  if (loadoutNames.length >= 1) {
    modelNameString += ` w/ ${loadoutNames.join(", ")}`;
    modelNamePlainWithLoudoutString += ` w/ ${loadoutNames.join(", ")}`;
  }

  const modelSpecialRules = [
    ...model.originalSpecialRules,
    ...model.loadout
      .filter((l) => l.originalLoadout.type === "ArmyBookItem")
      // @ts-ignore loadouts can definitely have content
      .map((l) => l.originalLoadout.content)
      .flat(),
  ]
    .map((sr) => {
      if (sr.rating) {
        return `${sr.name}(${sr.rating})`;
      }
      return sr.name;
    })
    .join(", ");

  const activeSpecialRulesFromLoadout = _.uniqBy(
    _.flattenDeep([
      // get all the special rules from the loadout
      ...equippedLoadoutItems.map((l) => l.originalLoadout.specialRules || []),
      // get all the content from the loadout THAT is a special rule
      ...equippedLoadoutItems
        // @ts-ignore loadouts can definitely have content
        .map((l) => l.originalLoadout.content || [])
        .flat()
        .filter((c) => c.type === "ArmyBookRule"),
      // AND get all the special rules from all the contents individually
      ...equippedLoadoutItems
        // @ts-ignore loadouts can definitely have content
        .map((l) => l.originalLoadout.content || [])
        .flat()
        .map((c) => c.specialRules || [])
        .flat()
        .filter((sr) => sr.type === "ArmyBookRule"),
    ]),
    "key"
  ).map((x) => {
    const isCoreSpecialRule = stateView.coreSpecialRulesDict.some(
      (csr) => csr.name === x.name
    );
    if (
      !stateView.ttsOutputConfig.includeArmySpecialRules &&
      !isCoreSpecialRule
    ) {
      return null;
    }
    if (
      !stateView.ttsOutputConfig.includeCoreSpecialRules &&
      isCoreSpecialRule
    ) {
      return null;
    }
    const specialRule = stateView.armySpecialRulesDict.find(
      (sr) => sr.name === x.name
    );
    let definition = "";
    if (
      stateView.ttsOutputConfig.useShorterVersionOfCoreSpecialRules &&
      specialRule?.shortDescription
    ) {
      definition = specialRule?.shortDescription || "";
    } else {
      definition = specialRule?.description || "";
    }
    return {
      id: nanoid(),
      name: `${x.name}`,
      definition,
      rating: x.rating,
    };
  });

  const activeSpecialRulesFromNotLoadout = _.uniqBy(
    _.flattenDeep([
      // get all the special rules from the loadout
      ...unit.models.map((m) => m.originalSpecialRules || []),
    ]),
    "key"
  ).map((x) => {
    const isCoreSpecialRule = stateView.coreSpecialRulesDict.some(
      (csr) => csr.name === x.name
    );
    if (
      !stateView.ttsOutputConfig.includeArmySpecialRules &&
      !isCoreSpecialRule
    ) {
      return null;
    }
    if (
      !stateView.ttsOutputConfig.includeCoreSpecialRules &&
      isCoreSpecialRule
    ) {
      return null;
    }
    const specialRule = stateView.armySpecialRulesDict.find(
      (sr) => sr.name === x.name
    );
    let definition = "";
    if (
      stateView.ttsOutputConfig.useShorterVersionOfCoreSpecialRules &&
      specialRule?.shortDescription
    ) {
      definition = specialRule?.shortDescription || "";
    } else {
      definition = specialRule?.description || "";
    }
    return {
      id: nanoid(),
      name: `${x.name}`,
      definition,
      rating: x.rating,
    };
  });

  const activeWeaponNamesCommaSeparated = equippedLoadoutItems
    .map((x) => {
      if (x.quantity > 1) {
        return `${x.quantity}x ${x.name}`;
      }
      return `${x.name}`;
    })
    .join(", ");

  // this should somehow include things like gundrones, where its an ITEM that gives you weapons
  const activeWeaponsList = _.flattenDeep([
    ...equippedLoadoutItems.filter(
      (l) => l.originalLoadout.type === "ArmyBookWeapon"
    ),
    ...equippedLoadoutItems
      // @ts-ignore loadouts can definitely have content
      .map((l) => l.originalLoadout.content || [])
      .flat()
      .filter((c) => c.type === "ArmyBookWeapon")
      .map((ci) => ({
        name: ci.name,
        definition: ci.label.replace(ci.name, "").trim(),
        quantity: ci.quantity,
      })),
  ])
    .map((w) => {
      if (w.quantity > 1) {
        return `[${TTS_WEAPON_COLOUR}]${w.quantity}x ${w.name}[-]
[sup]${w.definition}[/sup]`;
      } else {
        return `[${TTS_WEAPON_COLOUR}]${w.name}[-]
[sup]${w.definition}[/sup]`;
      }
    })
    .join("\r\n");

  const allApplicableSpecialRules = _.sortBy(
    [...activeSpecialRulesFromLoadout, ...activeSpecialRulesFromNotLoadout],
    "name"
  );

  const allApplicableSpecialRulesWithAddedUpRatings: any[] = [];
  allApplicableSpecialRules.forEach((sr) => {
    if (sr === null) {
      return;
    }
    sr.rating = parseInt(sr.rating);
    const existing = allApplicableSpecialRulesWithAddedUpRatings.find(
      (x) => x.name === sr.name
    );
    if (existing) {
      existing.rating += parseInt(sr.rating);
    } else {
      allApplicableSpecialRulesWithAddedUpRatings.push(sr);
    }
  });

  // this currently contains more than 1 tough, so we need to make it so tough only
  // appears once, and add up the tough ratings
  const allApplicableSpecialRulesBBCode =
    allApplicableSpecialRulesWithAddedUpRatings
      .map((w) => {
        const isCoreSpecialRule = stateView.coreSpecialRulesDict.some(
          (csr) => csr.name === w.name
        );
        if (w === null) {
          return "";
        }
        let name = w.name;
        if (w.rating && w.name === "Tough") {
          name += ` (${w.rating})`;
        }
        if (isCoreSpecialRule) {
          if (stateView.ttsOutputConfig.includeFullCoreSpecialRulesText) {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]
[sup]${w.definition}[/sup]`;
          } else {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]`;
          }
        } else {
          if (stateView.ttsOutputConfig.includeFullArmySpecialRulesText) {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]
[sup]${w.definition}[/sup]`;
          } else {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]`;
          }
        }
      })
      .filter((x) => x !== "")
      .join("\r\n");

  // if the model has a Tough special rule, add its rating into the modelstringname
  let totalToughRating = 0;
  if (stateView.ttsOutputConfig.includeToughSpecialRuleRatingInName) {
    allApplicableSpecialRulesWithAddedUpRatings.forEach((sr) => {
      if (sr === null) {
        return;
      }
      if (sr.name === "Tough") {
        totalToughRating += parseInt(sr.rating);
      }
    });

    if (totalToughRating >= 1) {
      modelNameString += ` [${TTS_TOUGH_COLOUR}](${totalToughRating})[-]`;
    }
  }

  let nameLines = [
    `${modelNameString}`,
    `[${TTS_QUA_COLOUR}][b]${model.qua}[/b]+[-] / [${TTS_DEF_COLOUR}][b]${model.def}[/b]+[-]`,
    stateView.ttsOutputConfig.includeWeaponsListInName
      ? `[sup][${TTS_WEAPON_COLOUR}]${activeWeaponNamesCommaSeparated}[-][/sup]`
      : "",
    stateView.ttsOutputConfig.includeSpecialRulesListInName
      ? `[sup][${TTS_SPECIAL_RULES_COLOUR}]${modelSpecialRules}[-][/sup]`
      : "",
  ].filter((x) => x !== "");

  //   let campaignStuffText = "";
  //   if (state.ttsOutputConfig.includeCampaignXp) {
  //     campaignStuffText = `[${TTS_CAMPAIGN_COLOUR}]${model.xp}XP[-]`;
  //   }
  //   if (state.ttsOutputConfig.includeCampaignTraits) {
  //     if (state.ttsOutputConfig.includeCampaignTraitsFullText) {

  //     } else {
  //       campaignStuffText += `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]
  // [sup]${w.definition}[/sup]`;
  //       // campaignStuffText = `[${TTS_CAMPAIGN_COLOUR}]${model.traits.join()}XP[-]`;
  //     }

  //   }

  let descriptionFieldLines: string[] = [
    `${activeWeaponsList}`,
    `${allApplicableSpecialRulesBBCode}`,
  ];

  // loop through everything and remove all the small text
  if (stateView.ttsOutputConfig.disableSmallText) {
    nameLines = nameLines.map((n) =>
      n.replace(/\[sup\]/g, "").replace(/\[\/sup\]/g, "")
    );
    descriptionFieldLines = descriptionFieldLines.map((n) =>
      n.replace(/\[sup\]/g, "").replace(/\[\/sup\]/g, "")
    );
  }

  return {
    name: `${getUnitIndexForSelectionId(
      unit.originalSelectionId,
      stateView
    )}${modelNamePlainWithLoudoutString}`,
    loadoutCSV: activeWeaponNamesCommaSeparated,
    ttsNameOutput: nameLines.filter((x) => x !== "").join("\r\n"),
    ttsDescriptionOutput: descriptionFieldLines
      .filter((x) => x !== "")
      .join("\r\n"),
  };
};

// accounts for custom names
export const getUnitNameForLegend = (unit: iUnitProfile) => {
  if (unit.customName) {
    return (
      <>
        <span className="font-bold mr-1">{unit.customName}</span>
        <span>({unit.originalName})</span>
      </>
    );
  }
  return <span className="font-bold">{unit.originalName}</span>;
};

export const getUnitNameForSavedShareableOutput = (unit: iUnitProfile) => {
  if (unit.customName) {
    return `${unit.customName} (${unit.originalName})`;
  }
  return unit.originalName;
};

export const getModelNameForOutput = (
  unit: iUnitProfile,
  model: iUnitProfileModel,
  ttsOutputConfig: iAppState["ttsOutputConfig"]
) => {
  const {
    swapCustomNameBracketingForUnitsWithMultipleModels,
    completelyReplaceNameWithCustomName,
  } = ttsOutputConfig;

  if (completelyReplaceNameWithCustomName && unit.customNameSingular) {
    return unit.customNameSingular;
  }

  if (
    swapCustomNameBracketingForUnitsWithMultipleModels &&
    unit.originalModelCountInUnit > 1
  ) {
    if (unit.customName) {
      return `${model.name} (${unit.customName})`;
    }
    return unit.originalName;
  }
  if (unit.customName) {
    return `${unit.customName} (${model.name})`;
  }
  return unit.originalName;
};

export const getUnitIndexForSelectionId = (
  selectionId: string,
  stateView: Readonly<iAppState>
) => {
  const index = stateView.unitProfiles.findIndex((u) => {
    return u.originalSelectionId === selectionId;
  });

  return index + 1;
};

export const isUnitHero = (unit: iUnitProfile) => {
  return unit.models[0].originalSpecialRules.some((sr) => sr.key === "hero");
};
