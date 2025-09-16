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

// to get the data hit https://army-forge.onepagerules.com/api/rules/common/3 where the number is the game system. ask Adam @ army forge for the right one
// import commonRules from "./data/common-rules.json";
// import commonRulesSkirmish from "./data/common-rules-skirmish.json";
// import commonRulesRegiments from "./data/common-rules-regiments.json";

interface iCommonRule {
  id: number;
  name: string;
  description: string;
  hasRating: boolean;
}
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
  const idMatch = idRegex.exec(url);
  const isBeta = url.includes("army-forge-beta.onepagerules.com");
  return [idMatch ? idMatch[1] : null, isBeta];
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
    let label = loadoutItem.label;
    if (label == null) {
      // for some reason, sometimes things dont have labels. if thats the case, try and build it from the raw content, just smashing together names
      // @ts-ignore
      label = loadoutItem.content.map((c) => c.name).join(", ");
      label = `(${label})`;
    }
    return label.replace(loadoutItem.name, "").trim();
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
  state.unitProfiles = [];
  const [id, isBeta] = extractIdFromUrl(stateView.armyListShareLink);
  let data: ArmyForgeTypes.ListState | undefined = undefined;
  let relevantCoreSpecialRules: iCommonRule[];
  if (!id) {
    alert(
      "Could not find an Army Forge army ID. Please double check your Army Forge share link and try again."
    );
    state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.IDLE;
    return;
  }

  try {
    // get the army list
    const response = await fetch(`/.netlify/functions/get-army?armyId=${id}&isBeta=${isBeta}`);
    data = await response.json();
    if (response.status !== 200) {
      alert("Army Forge failed to export list. Sorry!");
    }
    if (!data) {
      state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.ERROR;
      return;
    }

    // then get the core rules for the game we're playing
    const gameSystemUrlSlug = getUrlSlugForGameSystem(data.gameSystem);
    const gameSystemMappingCommonRules = {
      "grimdark-future": 2,
      "grimdark-future-firefight": 3,
      "age-of-fantasy": 4,
      "age-of-fantasy-skirmish": 5,
      "age-of-fantasy-regiments": 6,
    };

    // get the common special rules for whatever army forge game system we're playing
    const commonRulesId = gameSystemMappingCommonRules[gameSystemUrlSlug];
    const commonRulesResponse = await fetch(
      `https://army-forge.onepagerules.com/api/rules/common/${commonRulesId}`
    );
    const commonRulesData = await commonRulesResponse.json();

    state.listName = data.name;

    relevantCoreSpecialRules = [...commonRulesData.rules] as iCommonRule[];

    state.gameSystem = data.gameSystem;
    state.coreSpecialRulesDict = relevantCoreSpecialRules;
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
  state.armySpecialRulesDict = [
    ...state.coreSpecialRulesDict,
    // @ts-ignore interface doesn't include new specialRules array
    ...data.specialRules.map((sr) => {
      return {
        ...sr,
      };
    }),
  ];

  const unitProfiles: iUnitProfile[] = _.sortBy(data.units, ["sortId"]).map(
    (unit) => {
      const unitProfile: iUnitProfile = {
        id: nanoid(),
        originalName: unit.name,
        originalModelCountInUnit: unit.size,
        customName: unit.customName,
        originalSelectionId: unit.selectionId,
        originalJoinToUnit: unit.joinToUnit,
        originalLoadoutCsvHelperString:
          generateOriginalLoadoutCsvHelperString(unit),
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
            originalSpecialRules: unit.rules || [],
            loadout: _.uniqBy(unit.loadout, "label").map((loadoutItem) => {
              return {
                id: nanoid(),
                includeInName: false,
                name: pluralize.singular(loadoutItem.name),
                definition: generateLoadoutItemDefinition(loadoutItem),
                quantity: Math.floor(
                  Math.max(loadoutItem.count / unit.size, 1)
                ),
                originalLoadout: loadoutItem,
              };
            }),
          },
        ],
      };

      /**
       * As of 08/06/2024 it seems like we dont need to do this?
       * OK, more testing - without this the DAO Shield drones aren't working. so we DO need this... in some capcity
       * basically, i think we need to add the upgrade to the loadout if its NOT a weapon, and its not already in the loadout
       * that leaves things like special rules (DAO Shield Drones) and Items (DAO Gun drones)
       *
       */

      /**
       * 29/07/2024
       * ok so see https://github.com/thomascgray/opr-af-to-tts/issues/47 but tl;dr theres 2 kinds of upgrades?
       * (see the screenshot we added on the issue) and the typescript types were a bit fucked
       * basically, the originalLoadout below, it turns out sometimes DOESNT have ids??? and also sometimes doesnt event have a KEY?!
       * so we try and do id, then key, then name
       * this is obviously a hack but the types just seem fucked? i think dno im working this out at 1am lol
       * but anyway, the original bug was because `undefined` was matching `undefined` inside the idsAlreadyInLoadout
       * i also renamed idsAlreadyInLoadout to identifiersAlreadyInLoadout because lets be sensible
       */

      const identifiersAlreadyInLoadout = unitProfile.models[0].loadout
        .map((li) =>
          li.originalLoadout.id
            ? li.originalLoadout.id
            : li.originalLoadout.key
            ? li.originalLoadout.key
            : li.originalLoadout.name
        )
        .flat();

      unit.selectedUpgrades.forEach((su) => {
        su.option.gains.forEach((g) => {
          // if we already have the thing in loadout, or if its a weapon, we don't need to add it
          if (
            identifiersAlreadyInLoadout.includes(
              g.id ? g.id : g.key ? g.key : g.name
            ) ||
            g.type === "ArmyBookWeapon"
          ) {
            // maaaaaybe we need to do something with quantity here?
          } else {
            unitProfile.models[0].loadout.push({
              id: nanoid(),
              includeInName: false,
              name: pluralize.singular(g.label),
              definition: "",
              quantity: 1,
              originalLoadout: {
                // @ts-ignore again, loadouts CAN have `content`
                // this originalLoadout is a bit of a hack, and makes things get added up
                content: su.option.gains,
              },
            });
          }
        });
      });

      return unitProfile;
    }
  );

  state.unitProfiles = unitProfiles;

  state.shareableLinkForTTS = undefined;
};

export const onGenerateShareableId = async (stateView: Readonly<iAppState>) => {
  state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.PENDING;
  state.shareableLinkForTTS = undefined;

  const totalOutput: iTotalShareableOutput = {
    gameSystem: stateView.gameSystem || ArmyForgeTypes.eGameSystemInitials.GF,
    units: [],
    listName: state.listName || "UNDEFINED",
  };

  stateView.unitProfiles.forEach((unitProfile, unitIndex) => {
    let thisUnitsModelDefinitions: iUnitProfileModelTTSOutput[] = [];
    const unitId = nanoid();

    unitProfile.models.forEach((model) => {
      const {
        name,
        loadoutCSV,
        ttsNameOutput,
        ttsDescriptionOutput,
        originalCasterValue = 0,
        originalToughValue = 0,
      } = generateUnitOutput(unitProfile, model, stateView);

      thisUnitsModelDefinitions.push({
        name,
        loadoutCSV,
        ttsNameOutput,
        ttsDescriptionOutput,
        originalToughValue,
        originalCasterValue,
      });
    });

    totalOutput.units.push({
      name: getUnitNameForSavedShareableOutput(unitProfile, stateView),
      modelDefinitions: thisUnitsModelDefinitions,
      selectionId: unitProfile.originalSelectionId,
      unitId,
    });
  });

  // now we loop over totalOutput.units and for any units that are combined or joined to another unit,
  // make that unit use the unit id of the one its joined to
  totalOutput.units.forEach((unit) => {
    const unitProfile = stateView.unitProfiles.find(
      (up) => up.originalSelectionId === unit.selectionId
    );
    if (!unitProfile) {
      return;
    }
    if (!unitProfile.originalJoinToUnit) {
      return;
    }
    const joinedToUnit = totalOutput.units.find(
      (u) => u.selectionId === unitProfile.originalJoinToUnit
    );
    if (!joinedToUnit) {
      return;
    }
    unit.unitId = joinedToUnit.unitId;
  });

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
  let totalToughRating = 0;
  let totalCasterRating = 0;

  // some special rules add to Defense (american spelling)
  let totalExtraDefense = 0;
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
      .map((l) => {
        return [
          // @ts-ignore loadouts can definitely have content
          ...l.originalLoadout.content,
          // @ts-ignore loadouts can definitely have content
          ...l.originalLoadout.content.map((c) => c.specialRules || []).flat(),
        ];
      })
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
        .filter(
          (c) => c.type === "ArmyBookRule" || c.type === "ArmyBookDefense"
        )
        .map((c) => {
          return {
            ...c,
            shouldHaveRatingInMainOutput: true,
          };
        }),
      // AND get all the special rules from all the contents individually
      ...equippedLoadoutItems
        // @ts-ignore loadouts can definitely have content
        .map((l) => l.originalLoadout.content || [])
        .flat()
        .map((c) => c.specialRules || [])
        .flat()
        .filter((sr) => sr.type === "ArmyBookRule"),

      // and get the new weird nested special rules i guess?
      ...equippedLoadoutItems
        .map((l) => [
          // @ts-ignore loadouts can definitely have content
          ...(l.originalLoadout.content || [])
            // @ts-ignore loadouts can definitely have content
            .map((c) => c.specialRules || [])
            .flat(),
        ])
        .flat(),
    ]),
    (x) => {
      return x.key || x.name;
    }
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
    let specialRule = stateView.armySpecialRulesDict.find((sr) =>
      !_.isNil(x.key)
        ? sr.name.toLowerCase() === x.key.toLowerCase()
        : sr.name.toLowerCase() === x.name.toLowerCase()
    );
    // if we've not found it, sometimes the keys are fucky. just search by name again and hope for the best
    if (_.isNil(specialRule)) {
      specialRule = stateView.armySpecialRulesDict.find(
        (sr) => sr.name.toLowerCase() === x.name.toLowerCase()
      );
    }
    let definition = "";
    if (
      stateView.ttsOutputConfig.useShorterVersionOfCoreSpecialRules &&
      specialRule?.shortDescription
    ) {
      definition =
        specialRule?.shortDescription ||
        "[[Rule short description missing in Army Forge data!]]";
    } else {
      definition =
        specialRule?.description ||
        "[[Rule description missing in Army Forge data!]]";
    }
    return {
      id: nanoid(),
      name: `${x.name}`,
      definition,
      rating: x.rating,
      shouldHaveRatingInMainOutput: x.shouldHaveRatingInMainOutput,
    };
  });

  const activeSpecialRulesFromNotLoadout = _.uniqBy(
    _.flattenDeep([
      // get all the special rules from the loadout
      ...unit.models.map((m) => m.originalSpecialRules || []),
    ]),
    (x) => {
      return x.key || x.name;
    }
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
      definition =
        specialRule?.shortDescription ||
        "[[Rule short description missing in Army Forge data!]]";
    } else {
      definition =
        specialRule?.description ||
        "[[Rule description missing in Army Forge data!]]";
    }
    return {
      id: nanoid(),
      name: `${x.name}`,
      definition,
      rating: x.rating,
      shouldHaveRatingInMainOutput: true,
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
  let fallbackDefinitionData: any = {};

  const activeWeaponsList = _.flattenDeep([
    ...equippedLoadoutItems.filter(
      (l) => l.originalLoadout.type === "ArmyBookWeapon"
    ),
    ...equippedLoadoutItems
      .map((l) => {
        fallbackDefinitionData = {
          ...fallbackDefinitionData,
          ...parseString(l.definition.slice(1, -1)),
        };
        // @ts-ignore loadouts can definitely have content
        return l.originalLoadout.content || [];
      })
      .flat()
      .filter((c) => {
        return c.type === "ArmyBookWeapon";
      })
      .map((ci) => {
        let { name, label, quantity } = ci;
        // if the quantity is null, then we're going to try to do a fallback lookup
        if (quantity == null) {
          label = fallbackDefinitionData[name];
          quantity = 1;
        }

        // if label is STILL null after trying to do a fallback lookup, then we're out of options
        if (label == null) {
          label = `[[Weapon definition missing in Army Forge data]]`;
        }

        return {
          name: ci.name,
          definition: label,
          quantity: quantity,
        };
      }),
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
      if (existing.rating && sr.rating) {
        existing.rating += parseInt(sr.rating);
      }
    } else {
      allApplicableSpecialRulesWithAddedUpRatings.push(sr);
    }
  });

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
        if (w.rating && w.rating !== "" && w.shouldHaveRatingInMainOutput) {
          name += ` (${w.rating})`;
        }
        if (isCoreSpecialRule) {
          if (stateView.ttsOutputConfig.includeFullCoreSpecialRulesText) {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]
[sup]${insertLineBreaksIntoString(w.definition)}[/sup]`;
          } else {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]`;
          }
        } else {
          if (stateView.ttsOutputConfig.includeFullArmySpecialRulesText) {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]
[sup]${insertLineBreaksIntoString(w.definition)}[/sup]`;
          } else {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]`;
          }
        }
      })
      .filter((x) => x !== "")
      .join("\r\n");

  allApplicableSpecialRulesWithAddedUpRatings.forEach((sr) => {
    if (sr === null) {
      return;
    }
    if (sr.name === "Tough") {
      totalToughRating += parseInt(sr.rating);
    }
    if (sr.name === "Caster") {
      totalCasterRating += parseInt(sr.rating);
    }
    // we COULD add up all the extra Defense, but Army Forge DOESNT do that, so i think it might prove confusing?
    // e.g army forge DOES add up all the extra Tough, but not Defense
    // if (sr.name === "Defense") {
    //   totalExtraDefense += parseInt(sr.rating);
    // }
  });

  let nameLines = [
    `${modelNameString}`,
    `[${TTS_QUA_COLOUR}][b]Q${model.qua}[/b]+[-] / [${TTS_DEF_COLOUR}][b]D${
      model.def + totalExtraDefense
    }[/b]+[-]`,
    stateView.ttsOutputConfig.includeWeaponsListInName
      ? `[sup][${TTS_WEAPON_COLOUR}]${activeWeaponNamesCommaSeparated}[-][/sup]`
      : "",
    stateView.ttsOutputConfig.includeSpecialRulesListInName
      ? `[sup][${TTS_SPECIAL_RULES_COLOUR}]${modelSpecialRules}[-][/sup]`
      : "",
  ].filter((x) => x !== "");

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

  // This model may ignores the penalties from shooting after
  return {
    name: `${modelNamePlainWithLoudoutString}`, // this is the MODEL name
    loadoutCSV: activeWeaponNamesCommaSeparated
      .replace(/[’]/g, "'")
      .replace(/[”]/g, "''")
      .replace(/["]/g, "''"),
    ttsNameOutput: nameLines.filter((x) => x !== "").join("\r\n"),
    ttsDescriptionOutput: descriptionFieldLines
      .filter((x) => x !== "")
      .join("\r\n")
      .replace(/[’]/g, "'")
      .replace(/[”]/g, "''")
      .replace(/["]/g, "''"),
    originalToughValue: totalToughRating,
    originalCasterValue: totalCasterRating,
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

export const getUnitNameForSavedShareableOutput = (
  unit: iUnitProfile,
  stateView: iAppState
) => {
  let name = "";
  if (unit.customName) {
    name = `${unit.customName} (${unit.originalName})`;
  } else {
    name = `${unit.originalName}`;
  }
  const armyUnitIndex = getUnitIndexForSelectionId(
    unit.originalSelectionId,
    stateView
  );
  name = `#${armyUnitIndex} ${name}`;

  const joinedTo = unit.originalJoinToUnit
    ? stateView.unitProfiles.find(
        (up) => up.originalSelectionId === unit.originalJoinToUnit
      )
    : undefined;

  if (joinedTo) {
    let joinText = isUnitHero(unit as iUnitProfile)
      ? "joined to"
      : "combined with";
    {
      isUnitHero(unit as iUnitProfile) ? "joined to" : "combined with";
    }

    let joinedToName = getUnitNameForSavedShareableOutput(joinedTo, stateView);

    name = `${name} (${joinText} ${joinedToName})`;
  }

  return name;
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

export const generateOriginalLoadoutCsvHelperString = (
  unit: ArmyForgeTypes.ISelectedUnit
) => {
  const baseChunks = unit.loadout.map((l) => {
    return `${l.count}x ${l.name}`;
  });
  unit.selectedUpgrades
    .filter((su) => {
      return (
        su.option.gains.length === 1 &&
        su.option.gains[0].type === "ArmyBookRule"
      );
    })
    .forEach((su) => {
      baseChunks.push(`1x ${pluralize.singular(su.option.label)}`);
    });

  return baseChunks.join(", ");
};

// courtesy of chatgpt lmao
// computationally expensive, but fuck it
// necessary for a handful of edge cases where tabletop simulator doesn't
// care for text inside description being around 56/57 characters long.
export const insertLineBreaksIntoString = (str: string) => {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += str.charAt(i);
    if ((i + 1) % 54 === 0) {
      var j = i;
      while (j >= 0 && result.charAt(j) !== " ") {
        j--;
      }
      if (j >= 0) {
        result = result.substring(0, j) + "\r\n" + result.substring(j + 1);
      }
    }
  }
  return result;
};

function parseString(str: string) {
  const result: Record<string, string> = {};
  let current = "";
  let level = 0; // This keeps track of whether we're inside parentheses.

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "(") {
      level++; // Entering parentheses.
    } else if (char === ")") {
      level--; // Exiting parentheses.
    } else if (char === "," && level === 0) {
      const key = current.split("(")[0].trim(); // Extract key (before parentheses).
      const value = current.substring(current.indexOf("(")).trim(); // Extract the value inside parentheses.
      result[key] = value;
      current = "";
      continue;
    }

    current += char; // Add the character to the current substring.
  }

  // Push the last part.
  if (current.trim()) {
    const key = current.split("(")[0].trim();
    const value = current.substring(current.indexOf("(")).trim();
    result[key] = value;
  }

  return result;

  return result;
}
