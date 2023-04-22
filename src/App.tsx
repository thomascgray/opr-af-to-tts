import * as _ from "lodash";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import { useSnapshot } from "valtio";
import * as ArmyForgeTypes from "./army-forge-types";
import { iUnitProfile } from "./types";
import { coreSpecialRules } from "./data";
import {
  state,
  updateWeaponQuantity,
  duplicateModel,
  deleteModel,
} from "./state";

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
  const id = extractIdFromUrl(state.armyListShareLink);
  let data: ArmyForgeTypes.ListState | undefined = undefined;
  if (id) {
    data = await fetch(`/.netlify/functions/get-army?armyId=${id}`).then(
      (res) => res.json()
    );
  }
  if (!data) {
    return;
  }

  const unitProfiles: iUnitProfile[] = data.units.map((unit) => {
    return {
      id: nanoid(),
      originalName: unit.name,
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
          loadout: unit.loadout.map((loadoutItem) => {
            return {
              id: nanoid(),
              name: pluralize.singular(loadoutItem.name),
              definition: generateLoadoutItemDefinition(loadoutItem),
              quantity: 1,
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

  return (
    <div className="container mx-auto mb-28">
      <h1 className="text-xl font-bold">Grimdark Future Army Forge to TTS</h1>
      <div className="inputs flex flex-row space-x-5">
        <div className="w-full">
          <label className="">
            <span className="block">Army Forge Share Link</span>
            <span className="block text-xs text-stone-500">
              Army Forge → Menu at the top right → Click "Share as Link" → Paste
              that link into the box below
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
        className="border disabled:hover:scale-100 disabled:opacity-50 border-stone-600 px-4 py-2 bg-stone-500 text-white hover:scale-105  active:scale-95"
      >
        Generate Definitions
      </button>

      <details className="text-sm mt-5">
        <summary className="cursor-pointer">How-To / Tutorial</summary>
        <div className="p-2 bg-stone-100 space-y-2">
          <p>
            Army list definitions keep track of the whole "pool" of Weapons and
            Special Rules associated with an entire unit - <em>not</em> which
            Weapons and Special Rules are associated with which individual,
            distinct models.
          </p>
          <p>
            Therefore, we need to define <em>which</em> distinct models have{" "}
            <em>which</em> Weapons and Special Rules, so that we can generate
            the correct name and description for TTS.
          </p>
          <p>
            Paste your Army Forge "Share a link" URL into the box above and
            click "Generate Definitions". This will generate, for each unit in
            your army, a TTS-aligned "name" and "description" definition that
            represents a model from that unit.
          </p>
          <p>
            The left column lets you change quantities of items and create
            duplicates of the base "distinct model", allowing you to create a
            single entry for each <em>distinct</em> model in your army.
          </p>
          <p>
            The right column then prints out 2 paragraphs of text for each
            distinct model - these go in the TTS objects "Name" and
            "Description" field, respectively.
          </p>
        </div>
      </details>

      <hr className="my-5" />

      <details className="text-sm my-5">
        <summary className="cursor-pointer">Output Options</summary>
        <div className="py-2 px-4 bg-stone-100 space-y-4">
          <label className="flex flex-row items-center space-x-4">
            <input
              checked={stateView.ui.includeFullSpecialRulesText}
              className="w-5 h-5"
              type="checkbox"
              onChange={(e) => {
                state.ui.includeFullSpecialRulesText =
                  !stateView.ui.includeFullSpecialRulesText;
              }}
            />
            <div>
              <p className="font-bold">Include Full Special Rules Text</p>
              <p className="text-xs">
                If enabled, the TTS output will include the full rules text for
                each special rule on a model. If disabled, only the rules name
                will be included.
              </p>
            </div>
          </label>
          <label className="flex flex-row items-center space-x-4">
            <input
              className="rounded-full"
              type="color"
              value={stateView.ui.modelWeaponOutputColour}
              onChange={(e) => {
                state.ui.modelWeaponOutputColour = e.currentTarget.value;
              }}
            />
            <div>
              <p>Model Weapon Output Colour</p>
              <p>
                The colour of the model's weapons details in the TTS output.
              </p>
            </div>
          </label>
          <label className="flex flex-row items-center space-x-4">
            <input
              className="rounded-full"
              type="color"
              value={stateView.ui.modelSpecialRulesOutputColour}
              onChange={() => {}}
            />
            <div>
              <p>Model Special Rules Output Colour</p>
              <p>
                The colour of the model's special rules details in the TTS
                output.
              </p>
            </div>
          </label>
        </div>
      </details>
      {/* {stateView.unitProfiles.length >= 1 && (
      )} */}

      <div className="flex flex-col space-y-2">
        {stateView.unitProfiles.map((unit) => {
          return (
            <fieldset
              className="border border-solid border-stone-600 p-4 text-xs"
              key={unit.id}
            >
              <legend className="px-2">
                {unit.originalName} - Qua: {unit.models[0].qua}+ / Def:{" "}
                {unit.models[0].def}+
              </legend>

              <div className="flex flex-col space-y-2">
                {unit.models.map((model) => {
                  const equippedLoadoutItems = model.loadout.filter(
                    (w) => w.quantity > 0
                  );

                  // todo should include special rules from ITEMS, not from WEAPONS
                  const modelSpecialRules = model.originalSpecialRules
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
                    const definition = stateView.armySpecialRulesDict.find(
                      (sr) => sr.name === x.name
                    )?.description;
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
                      return `[e74c3c]${w.name}[-]
[sup]${w.definition}[/sup]`;
                    })
                    .join("\r\n");

                  const activeSpecialRulesFromItemsList =
                    loadoutActiveSpecialRules
                      .map((w) => {
                        return `[f1c40f]${w.name}[-]
[sup]${w.definition}[/sup]`;
                      })
                      .join("\r\n");

                  return (
                    <div key={unit.id} className="relative">
                      <h3 className="text-base">
                        {model.name}
                        <br />
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
                              fill-rule="evenodd"
                              clip-rule="evenodd"
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
                              value={`[b]${model.name}[/b]
[sup][e74c3c]${activeWeaponNamesCommaSeparated}[-][/sup]
[sup][f1c40f]${modelSpecialRules}[-][/sup]
[2ecc71][b]${model.qua}[/b]+[-] / [3498db][b]${model.def}[/b]+[-]`}
                              className="block whitespace-pre text-xs w-full h-10 overflow-x-hidden"
                            />
                            <textarea
                              onChange={() => {}}
                              onFocus={(e) => e.target.select()}
                              value={`${activeWeaponsList}
  ${activeSpecialRulesFromItemsList}`}
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
        })}
      </div>
    </div>
  );
}

export default App;
