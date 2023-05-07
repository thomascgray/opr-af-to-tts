import * as _ from "lodash";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import { useSnapshot } from "valtio";
import * as ArmyForgeTypes from "./army-forge-types";
import {
  eNetworkRequestState,
  iAppState,
  iTotalShareableOutput,
  iUnitProfile,
  iUnitProfileModel,
  iUnitProfileModelTTSOutput,
} from "./types";
import {
  state,
  updateWeaponQuantity,
  updateWeaponIncludeInName,
  duplicateModel,
  deleteModel,
} from "./state";
import classnames from "classnames";
import { OutputOptions } from "./components/OutputOptions";
import { Tutorial } from "./components/Tutorial";
import { VersionHistory } from "./components/VersionHistory";
import ky from "ky";
import { getUrlSlugForGameSystem } from "./utils";

const removeQuantityStringFromStartOfString = (str: string) => {
  if (/^\dx /.test(str)) {
    return str.substring(2);
  } else {
    return str;
  }
};

const extractIdFromUrl = (url: string) => {
  const idRegex = /id=([^&]+)/;
  const match = idRegex.exec(url);
  return match ? match[1] : null;
};

const generateLoadoutItemDefinition = (
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

const onGenerateDefinitions = async () => {
  state.networkState.fetchArmyFromArmyForge = eNetworkRequestState.PENDING;
  const id = extractIdFromUrl(state.armyListShareLink);
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
    const gameSystemUrlSlug = getUrlSlugForGameSystem(data?.gameSystem);
    coreRulesResponseData = await fetch(
      `https://army-forge-studio.onepagerules.com/api/public/game-systems/${gameSystemUrlSlug}/common-rules`
    ).then((res) => res.json());

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
    ...state.coreSpecialRulesDict,
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

const onGenerateShareableId = async () => {
  state.networkState.saveArmyListAsBBToDB = eNetworkRequestState.PENDING;
  state.shareableLinkForTTS = undefined;

  const totalOutput: iTotalShareableOutput = {
    units: [],
  };

  _.sortBy(state.unitProfiles, ["originalUnit.sortId"]).forEach(
    (unitProfile, unitIndex) => {
      let thisUnitsModelDefinitions: iUnitProfileModelTTSOutput[] = [];
      const unitId = nanoid();

      unitProfile.models.forEach((model) => {
        const { name, loadoutCSV, ttsNameOutput, ttsDescriptionOutput } =
          generateUnitOutput(unitProfile, model, state.ttsOutputConfig);

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
const generateUnitOutput = (
  unit: iUnitProfile,
  model: iUnitProfileModel,
  ttsOutputConfig: iAppState["ttsOutputConfig"]
): iUnitProfileModelTTSOutput => {
  const TTS_WEAPON_COLOUR = ttsOutputConfig.modelWeaponOutputColour.replace(
    "#",
    ""
  );
  const TTS_SPECIAL_RULES_COLOUR =
    ttsOutputConfig.modelSpecialRulesOutputColour.replace("#", "");

  const TTS_QUA_COLOUR = ttsOutputConfig.modelQuaOutputColour.replace("#", "");
  const TTS_DEF_COLOUR = ttsOutputConfig.modelDefOutputColour.replace("#", "");
  const TTS_TOUGH_COLOUR = ttsOutputConfig.modelToughOutputColour.replace(
    "#",
    ""
  );
  const TTS_CAMPAIGN_COLOUR =
    ttsOutputConfig.modelCampaignStuffOutputColour.replace("#", "");
  const equippedLoadoutItems = model.loadout.filter((w) => w.quantity > 0);

  let modelNameString = `[b]${getModelNameForOutput(
    unit,
    model,
    ttsOutputConfig
  )}[/b]`;
  let modelNamePlainWithLoudoutString = getModelNameForOutput(
    unit,
    model,
    ttsOutputConfig
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
    const isCoreSpecialRule = state.coreSpecialRulesDict.some(
      (csr) => csr.name === x.name
    );
    if (!ttsOutputConfig.includeArmySpecialRules && !isCoreSpecialRule) {
      return null;
    }
    if (!ttsOutputConfig.includeCoreSpecialRules && isCoreSpecialRule) {
      return null;
    }
    const specialRule = state.armySpecialRulesDict.find(
      (sr) => sr.name === x.name
    );
    let definition = "";
    if (
      ttsOutputConfig.useShorterVersionOfCoreSpecialRules &&
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
    const isCoreSpecialRule = state.coreSpecialRulesDict.some(
      (csr) => csr.name === x.name
    );
    if (!ttsOutputConfig.includeArmySpecialRules && !isCoreSpecialRule) {
      return null;
    }
    if (!ttsOutputConfig.includeCoreSpecialRules && isCoreSpecialRule) {
      return null;
    }
    const specialRule = state.armySpecialRulesDict.find(
      (sr) => sr.name === x.name
    );
    let definition = "";
    if (
      ttsOutputConfig.useShorterVersionOfCoreSpecialRules &&
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
        const isCoreSpecialRule = state.coreSpecialRulesDict.some(
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
          if (ttsOutputConfig.includeFullCoreSpecialRulesText) {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]
[sup]${w.definition}[/sup]`;
          } else {
            return `[${TTS_SPECIAL_RULES_COLOUR}]${name}[-]`;
          }
        } else {
          if (ttsOutputConfig.includeFullArmySpecialRulesText) {
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
  if (state.ttsOutputConfig.includeToughSpecialRuleRatingInName) {
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
    ttsOutputConfig.includeWeaponsListInName
      ? `[sup][${TTS_WEAPON_COLOUR}]${activeWeaponNamesCommaSeparated}[-][/sup]`
      : "",
    ttsOutputConfig.includeSpecialRulesListInName
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
  if (ttsOutputConfig.disableSmallText) {
    nameLines = nameLines.map((n) =>
      n.replace(/\[sup\]/g, "").replace(/\[\/sup\]/g, "")
    );
    descriptionFieldLines = descriptionFieldLines.map((n) =>
      n.replace(/\[sup\]/g, "").replace(/\[\/sup\]/g, "")
    );
  }

  return {
    name: modelNamePlainWithLoudoutString,
    loadoutCSV: activeWeaponNamesCommaSeparated,
    ttsNameOutput: nameLines.filter((x) => x !== "").join("\r\n"),
    ttsDescriptionOutput: descriptionFieldLines
      .filter((x) => x !== "")
      .join("\r\n"),
  };
};

// accounts for custom names
const getUnitNameForLegend = (
  unit: iUnitProfile,
  ttsOutputConfig: iAppState["ttsOutputConfig"]
) => {
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

const getUnitNameForSavedShareableOutput = (unit: iUnitProfile) => {
  if (unit.customName) {
    return `${unit.customName} (${unit.originalName})`;
  }
  return unit.originalName;
};

const getModelNameForOutput = (
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

function App() {
  const stateView = useSnapshot(state, { sync: true });

  return (
    <div className="container mx-auto mt-4 mb-28">
      <div className="flex flex-row items-end space-x-2">
        <h1 className="text-4xl font-bold">OPR Army Forge to TTS</h1>
      </div>

      <span className="mt-1 block text-sm text-stone-500">
        This tool is under active development! If you find any bugs, please
        report them on the{" "}
        <a
          target="_blank"
          className="text-blue-700 underline visited:text-purple-700"
          href="https://github.com/thomascgray/grimdarkfuture-roster-to-tts/issues"
        >
          github issues page
        </a>
        . Thanks!
      </span>

      <VersionHistory />

      <div className="inputs flex flex-row space-x-5 mt-6">
        <div className="w-full">
          <label>
            <span className="block font-bold text-xl">
              Army Forge Share Link
            </span>
            <span className="block text-xs text-stone-500">
              <a
                target="_blank"
                className="text-blue-700 underline visited:text-purple-700"
                href="https://army-forge.onepagerules.com/"
              >
                Army Forge
              </a>
              → army listing → menu at the top right → click "Share as Link" →
              paste that link into the box below → define model definitions →
              hit "Generate shareable link for TTS" at the bottom of the screen
              → paste <em>that</em> URL into{" "}
              <a
                target="_blank"
                className="text-blue-700 underline visited:text-purple-700"
                href="https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810"
              >
                this mod
              </a>
            </span>
            <input
              placeholder="https://army-forge.onepagerules.com/share?id=XXX&name=XXX"
              value={stateView.armyListShareLink}
              onChange={(e) => {
                state.armyListShareLink = e.currentTarget.value;
              }}
              type="text"
              className="border my-2 border-solid border-stone-500 w-full py-1 px-2"
            />
          </label>
        </div>
      </div>

      <button
        onClick={onGenerateDefinitions}
        className={classnames(
          " bg-stone-500 border-stone-600 text-white border px-4 py-2 hover:scale-105 active:scale-95",
          {
            "opacity-80":
              stateView.networkState.fetchArmyFromArmyForge ===
              eNetworkRequestState.PENDING,
          }
        )}
      >
        <span className="flex flex-row space-x-2 items-center">
          {stateView.networkState.fetchArmyFromArmyForge ===
            eNetworkRequestState.PENDING && (
            <svg
              className="animate-spin"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          )}
          <span>Generate Definitions</span>
        </span>
      </button>

      <div className="text-sm mt-6 space-y-2">
        <Tutorial />
        <OutputOptions />
        {/* <OutputFAQ /> */}
      </div>

      {stateView.unitProfiles.length >= 1 && (
        <>
          <hr className="my-5" />

          <div className="flex flex-col space-y-10">
            {_.sortBy(stateView.unitProfiles, ["originalUnit.sortId"]).map(
              (unit) => {
                return (
                  <fieldset
                    className="p-4 text-xs bg-gradient-to-tl from-zinc-100 to-stone-100 shadow-xl border border-zinc-200"
                    key={unit.id}
                  >
                    <legend className="-ml-8 px-3 py-1 space-x-2 bg-white shadow-md border border-stone-200">
                      <span className="text-lg">
                        {getUnitNameForLegend(
                          unit as iUnitProfile,
                          stateView.ttsOutputConfig
                        )}
                      </span>
                      <span className="text-sm">
                        {unit.originalModelCountInUnit} model
                        {unit.originalModelCountInUnit > 1 ? "s" : ""}
                      </span>
                    </legend>

                    <div className="flex flex-col space-y-10">
                      {unit.models.map((model, modelIndex) => {
                        const { ttsNameOutput, ttsDescriptionOutput } =
                          generateUnitOutput(
                            unit as iUnitProfile,
                            model as iUnitProfileModel,
                            stateView.ttsOutputConfig
                          );
                        return (
                          <div key={model.id} className="relative">
                            <p className="text-sm">
                              Model Definition {modelIndex + 1}
                            </p>
                            {!model.isGenerated && (
                              <button
                                onClick={() => {
                                  deleteModel(unit.id, model.id);
                                }}
                                title="Delete this distinct model definition"
                                className="border border-solid border-red-500 p-1 absolute -top-3 right-0 bg-red-500 text-white rounded-full hover:scale-110 active:scale-95"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={4}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                            <div className="flex flex-row space-x-2">
                              <div className="editor-panel space-y-3 w-2/4">
                                {/* loadout items */}
                                <div className="space-y-1">
                                  {model.loadout.map((loadoutItem) => {
                                    return (
                                      <div
                                        key={loadoutItem.id}
                                        className={classnames(
                                          "flex flex-row items-center justify-between  py-1 px-2",
                                          {
                                            "bg-stone-100 text-stone-500":
                                              loadoutItem.quantity <= 0,
                                            "bg-stone-300 text-black":
                                              loadoutItem.quantity >= 1,
                                          }
                                        )}
                                      >
                                        <span className="flex flex-row items-center space-x-1 ">
                                          <span className="font-bold">
                                            {loadoutItem.name}
                                          </span>
                                          <span>{loadoutItem.definition}</span>
                                        </span>

                                        <span className="flex flex-row items-center space-x-2">
                                          <input
                                            className="w-12 p-1 text-lg font-bold text-center"
                                            min={0}
                                            onChange={(e) => {
                                              const value = parseInt(
                                                e.currentTarget.value
                                              );
                                              updateWeaponQuantity(
                                                unit.id,
                                                model.id,
                                                loadoutItem.id,
                                                value
                                              );
                                            }}
                                            value={loadoutItem.quantity}
                                            type="number"
                                          />
                                          <input
                                            className=""
                                            title="Check to include this item in the model name"
                                            checked={loadoutItem.includeInName}
                                            disabled={loadoutItem.quantity <= 0}
                                            onChange={(e) => {
                                              updateWeaponIncludeInName(
                                                unit.id,
                                                model.id,
                                                loadoutItem.id,
                                                !loadoutItem.includeInName
                                              );
                                            }}
                                            type="checkbox"
                                          />
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                <button
                                  onClick={() =>
                                    duplicateModel(unit.id, model.id)
                                  }
                                  className="text-sm border border-stone-600 px-3 py-1 bg-stone-500 text-white hover:scale-105  active:scale-95"
                                >
                                  Duplicate this model definition
                                </button>
                              </div>

                              <div className="output-panel w-2/4">
                                <div
                                  key={model.id + "tts"}
                                  className="bg-stone-300 px-4 pb-4 pt-3"
                                >
                                  <span className="block text-xs italic text-stone-600 mb-2">
                                    TTS output preview (name and description)
                                  </span>
                                  <textarea
                                    onChange={() => {}}
                                    rows={5}
                                    onFocus={(e) => e.target.select()}
                                    value={`${ttsNameOutput}
----------
${ttsDescriptionOutput}`}
                                    className="block font-mono whitespace-pre text-xs w-full overflow-x-hidden"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              }
            )}

            <hr className="my-5" />

            {/* after army builder */}
            <button
              disabled={stateView.unitProfiles.length <= 0}
              onClick={onGenerateShareableId}
              className={classnames(
                " bg-stone-500 disabled:opacity-60 border-stone-600 text-white border px-4 py-2 enabled:hover:scale-105 enabled:active:scale-95",
                {
                  "opacity-80":
                    stateView.networkState.saveArmyListAsBBToDB ===
                    eNetworkRequestState.PENDING,
                }
              )}
            >
              <span className="flex flex-row space-x-2 items-center">
                {stateView.networkState.saveArmyListAsBBToDB ===
                  eNetworkRequestState.PENDING && (
                  <svg
                    className="animate-spin"
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                )}
                <span>Generate shareable link for TTS</span>
              </span>
            </button>
            {stateView.shareableLinkForTTS && (
              <div className="block space-y-2">
                <p className="text-xs">
                  Copy and paste the link below into the TTS mod
                </p>
                <textarea
                  rows={1}
                  onChange={() => {}}
                  onFocus={(e) => e.target.select()}
                  value={stateView.shareableLinkForTTS}
                  className="block whitespace-pre text-lg w-full overflow-x-hidden bg-green-500 p-4 text-center text-white font-bold"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
