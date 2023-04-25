import * as _ from "lodash";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import { useSnapshot } from "valtio";
import * as ArmyForgeTypes from "./army-forge-types";
import { eNetworkRequestState, iUnitProfile } from "./types";
import { coreSpecialRules } from "./data";
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

const onGenerate = async () => {
  state.networkState.fetchArmyList = eNetworkRequestState.PENDING;
  const id = extractIdFromUrl(state.armyListShareLink);
  let data: ArmyForgeTypes.ListState | undefined = undefined;

  if (id) {
    try {
      data = await fetch(`/.netlify/functions/get-army?armyId=${id}`).then(
        (res) => res.json()
      );
      // @ts-ignore
      if (data && data.error) {
        state.networkState.fetchArmyList = eNetworkRequestState.ERROR;
        return;
      }
      state.networkState.fetchArmyList = eNetworkRequestState.SUCCESS;
    } catch (e) {
      state.networkState.fetchArmyList = eNetworkRequestState.ERROR;
    }
  } else {
    state.networkState.fetchArmyList = eNetworkRequestState.IDLE;
  }
  if (!data) {
    return;
  }

  const unitProfiles: iUnitProfile[] = data.units.map((unit) => {
    return {
      id: nanoid(),
      originalName: unit.name,
      originalModelCountInUnit: unit.size,
      originalUnit: unit,
      models: [
        {
          id: nanoid(),
          isGenerated: true,
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
              quantity: Math.max(loadoutItem.count / unit.size, 1),
              originalLoadout: loadoutItem,
            };
          }),
        },
      ],
    };
  });

  state.armySpecialRulesDict = [
    ...coreSpecialRules,
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

function App() {
  const stateView = useSnapshot(state, { sync: true });

  const TTS_WEAPON_COLOUR =
    stateView.ttsOutputConfig.modelWeaponOutputColour.replace("#", "");
  const TTS_SPECIAL_RULES_COLOUR =
    stateView.ttsOutputConfig.modelSpecialRulesOutputColour.replace("#", "");

  return (
    <div className="container mx-auto mb-28">
      <h1 className="text-xl font-bold">OPR Army Forge to TTS</h1>
      <span className="block text-xs text-stone-500">
        This tool is very very beta/WIP! If you find any bugs, please report
        them on the{" "}
        <a
          target="_blank"
          className="text-blue-700 underline visited:text-purple-700"
          href="https://github.com/thomascgray/grimdarkfuture-roster-to-tts/issues"
        >
          github issues page
        </a>
        .
      </span>

      <div className="inputs flex flex-row space-x-5">
        <div className="w-full">
          <label className="">
            <span className="block">Army Forge Share Link</span>
            <span className="block text-xs text-stone-500">
              <a
                target="_blank"
                className="text-blue-700 underline visited:text-purple-700"
                href="https://army-forge.onepagerules.com/"
              >
                Army Forge
              </a>
              → army listing → menu at the top right → click "Share as Link" →
              paste that link into the box below
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
        onClick={onGenerate}
        className={classnames(
          " bg-stone-500 border-stone-600 text-white border px-4 py-2 hover:scale-105 active:scale-95",
          {
            "opacity-80":
              stateView.networkState.fetchArmyList ===
              eNetworkRequestState.PENDING,
          }
        )}
      >
        <span className="flex flex-row space-x-2 items-center">
          {stateView.networkState.fetchArmyList ===
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

      <div className="flex flex-row space-x-2 mt-6">
        <div className="text-sm w-1/2">
          <Tutorial />
        </div>
        <div className="text-sm w-1/2">
          <OutputOptions />
        </div>
      </div>

      <hr className="my-5" />

      <div className="flex flex-col space-y-2">
        {_.sortBy(stateView.unitProfiles, ["originalUnit.sortId"]).map(
          (unit) => {
            return (
              <fieldset
                className="border border-solid border-stone-300 p-4 text-xs"
                key={unit.id}
              >
                <legend className="px-2 space-x-2 bg-white">
                  <span className="text-lg">{unit.originalName}</span>
                  <span className="text-sm">
                    {unit.originalModelCountInUnit} model
                    {unit.originalModelCountInUnit > 1 ? "s" : ""}
                  </span>
                </legend>

                <div className="flex flex-col space-y-2">
                  {unit.models.map((model) => {
                    const equippedLoadoutItems = model.loadout.filter(
                      (w) => w.quantity > 0
                    );

                    let modelNameString = `${model.name}`;
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
                    }

                    const modelSpecialRules = [
                      ...model.originalSpecialRules,
                      ...model.loadout
                        .filter(
                          (l) => l.originalLoadout.type === "ArmyBookItem"
                        )
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

                    const loadoutActiveSpecialRules = _.uniqBy(
                      _.flattenDeep([
                        // get all the special rules from the loadout
                        ...equippedLoadoutItems.map(
                          (l) => l.originalLoadout.specialRules || []
                        ),
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
                      const specialRule = stateView.armySpecialRulesDict.find(
                        (sr) => sr.name === x.name
                      );
                      let definition = "";
                      if (
                        stateView.ttsOutputConfig
                          .useShorterVersionOfCoreSpecialRules &&
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
                      };
                    });

                    const activeSpecialRulesFromNotLoadout = _.uniqBy(
                      _.flattenDeep([
                        // get all the special rules from the loadout
                        ...unit.models.map((m) => m.originalSpecialRules || []),
                      ]),
                      "key"
                    ).map((x) => {
                      const specialRule = stateView.armySpecialRulesDict.find(
                        (sr) => sr.name === x.name
                      );
                      let definition = "";
                      if (
                        stateView.ttsOutputConfig
                          .useShorterVersionOfCoreSpecialRules &&
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
                        })),
                    ])
                      .map((w) => {
                        return `[${TTS_WEAPON_COLOUR}]${w.name}[-]
[sup]${w.definition}[/sup]`;
                      })
                      .join("\r\n");

                    const activeSpecialRulesFromItemsList =
                      loadoutActiveSpecialRules
                        .map((w) => {
                          if (
                            stateView.ttsOutputConfig
                              .includeFullSpecialRulesText
                          ) {
                            return `[${TTS_SPECIAL_RULES_COLOUR}]${w.name}[-]
[sup]${w.definition}[/sup]`;
                          } else {
                            return `[${TTS_SPECIAL_RULES_COLOUR}]${w.name}[-]`;
                          }
                        })
                        .join("\r\n");

                    const activeSpecialRulesFromNotItemsList =
                      activeSpecialRulesFromNotLoadout
                        .map((w) => {
                          if (
                            stateView.ttsOutputConfig
                              .includeFullSpecialRulesText
                          ) {
                            return `[${TTS_SPECIAL_RULES_COLOUR}]${w.name}[-]
[sup]${w.definition}[/sup]`;
                          } else {
                            return `[${TTS_SPECIAL_RULES_COLOUR}]${w.name}[-]`;
                          }
                        })
                        .join("\r\n");

                    return (
                      <div key={model.id} className="relative">
                        <h3 className="text-base">
                          <small className="text-[#e74c3c] font-bold">
                            {activeWeaponNamesCommaSeparated}
                          </small>
                        </h3>
                        {!model.isGenerated && (
                          <button
                            onClick={() => {
                              deleteModel(unit.id, model.id);
                            }}
                            title="Delete this distinct model definition"
                            className="border border-solid border-red-500 p-1 absolute top-0 right-0 text-red-600 rounded-full hover:scale-105 active:scale-95"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </button>
                        )}
                        <div className="flex flex-row space-x-2">
                          <div className="editor-panel space-y-3 w-1/3">
                            {/* weapons */}
                            <div className="space-y-1 ">
                              {model.loadout.map((loadoutItem) => {
                                return (
                                  <div
                                    key={loadoutItem.id}
                                    className="flex flex-row items-center justify-between bg-stone-300 py-1 px-2"
                                  >
                                    <span className="flex flex-row items-center space-x-1 ">
                                      <span className="font-bold">
                                        {loadoutItem.name}
                                      </span>
                                      <span>{loadoutItem.definition}</span>
                                    </span>

                                    <span className="flex flex-row items-center space-x-2">
                                      <input
                                        className="w-10 p-1"
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
                              onClick={() => duplicateModel(unit.id, model.id)}
                              className="text-sm border border-stone-600 px-3 py-1 bg-stone-500 text-white hover:scale-105  active:scale-95"
                            >
                              Duplicate this model definition
                            </button>
                          </div>

                          <div className="output-panel space-y-3 w-2/3">
                            <div
                              key={model.id + "tts"}
                              className="bg-stone-300 p-4 space-y-1"
                            >
                              <textarea
                                onChange={() => {}}
                                onFocus={(e) => e.target.select()}
                                value={`[b]${modelNameString}[/b]
[sup][${TTS_WEAPON_COLOUR}]${activeWeaponNamesCommaSeparated}[-][/sup]
[sup][${TTS_SPECIAL_RULES_COLOUR}]${modelSpecialRules}[-][/sup]
[2ecc71][b]${model.qua}[/b]+[-] / [3498db][b]${model.def}[/b]+[-]`}
                                className="block whitespace-pre text-xs w-full h-10 overflow-x-hidden"
                              />
                              <textarea
                                onChange={() => {}}
                                onFocus={(e) => e.target.select()}
                                value={`${activeWeaponsList}
${activeSpecialRulesFromItemsList}
${activeSpecialRulesFromNotItemsList}`}
                                className="block whitespace-pre text-xs w-full h-10 overflow-x-hidden"
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
      </div>
    </div>
  );
}

export default App;
