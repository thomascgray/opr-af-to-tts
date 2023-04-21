import * as _ from "lodash";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import { proxy, useSnapshot } from "valtio";
import * as ArmyForgeTypes from "./army-forge-types";
import { iUnitProfile, iAppState } from "./types";
import { coreSpecialRules } from "./data";

const state = proxy<iAppState>({
  armyListShareLink: "",
  armySpecialRulesDict: [],
  armySpecialRulesDictNames: [],
  unitProfiles: [],
});

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

const updateWeaponQuantity = (
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

const duplicateModel = (upId: string, mId: string) => {
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

const deleteModel = (upId: string, mId: string) => {
  const unit = state.unitProfiles.find((up) => up.id === upId);
  if (unit) {
    const modelIndex = unit.models.findIndex((m) => m.id === mId);
    unit.models.splice(modelIndex, 1);
  }
};

function App() {
  const stateView = useSnapshot(state, { sync: true });

  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-bold">Grimdark Future Army Forge to TTS</h1>
      <div className="inputs flex flex-row space-x-5">
        <div className="w-full">
          <label>
            <span>Army Forge Share Link</span>
            <input
              value={stateView.armyListShareLink}
              onChange={(e) => {
                state.armyListShareLink = e.currentTarget.value;
              }}
              type="text"
              className="border border-solid border-stone-500 w-full py-1 px-2"
            />
          </label>
        </div>
      </div>

      <button
        onClick={onGenerate}
        className="border disabled:hover:scale-100 disabled:opacity-50 border-stone-600 px-4 py-2 bg-stone-500 text-white hover:scale-105  active:scale-95"
      >
        Generate
      </button>

      <details className="text-sm mt-4">
        <summary className="cursor-pointer">Tutorial</summary>
        <p>
          Army list definitions keep track of the whole "pool" of Weapons and
          Special Rules associated with an entire unit - <em>not</em> which
          Weapons and Special Rules are associated with which individual,
          distinct models.
        </p>
        <p>
          Therefore, we need to define <em>which</em> distinct models have{" "}
          <em>which</em> Weapons and Special Rules, so that we can generate the
          correct name and description for TTS.
        </p>
        <p>
          The left column lets you change quantities of items and create
          duplicates of the base "distinct model", allowing you to create a
          single entry for each <em>distinct</em> model in your army.
        </p>
        <p>
          The right column then prints out 2 paragraphs of text for each
          distinct model - these go in the TTS objects "Name" and "Description"
          field, respectively.
        </p>
      </details>

      <hr className="my-5" />

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

                  const x = equippedLoadoutItems
                    // @ts-ignore loadouts can definitely have content
                    .map((l) => l.originalLoadout.content || [])
                    .flat()
                    .map((c) => c.specialRules || [])
                    .flat()
                    .filter((sr) => sr.type === "ArmyBookRule");

                  console.log("x", JSON.stringify(x, null, 2));

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
                      name: `${x.name} ()`,
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
                      return `[eb4d4b]${w.name}[-]
[sup]${w.definition}[/sup]`;
                    })
                    .join("\r\n");

                  const activeSpecialRulesFromItemsList =
                    loadoutActiveSpecialRules
                      // .filter((l) => l.originalType === "ArmyBookRule")
                      .map((w) => {
                        return `[f0932b]${w.name}[-]
[sup]${w.definition}[/sup]`;
                      })
                      .join("\r\n");

                  return (
                    <div key={unit.id} className="flex flex-row space-x-2">
                      <div className="editor-panel space-y-3 w-1/3">
                        <div className="flex flex-row justify-between relative">
                          <h3 className="text-base">
                            {model.name}
                            <br />
                            <small className="text-[#eb4d4b] font-bold">
                              {activeWeaponNamesCommaSeparated}
                            </small>
                          </h3>
                          {!model.isGenerated && (
                            <button
                              onClick={() => {
                                deleteModel(unit.id, model.id);
                              }}
                              title="Delete this distinct model definition"
                              className="bg-stone-500 absolute top-0 right-0 text-white rounded-full hover:scale-105  active:scale-95"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

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
[sup][eb4d4b]${activeWeaponNamesCommaSeparated}[-][/sup]
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
// [sup][f0932b]${modelSpecialRules}[-][/sup]
// todo now that we have structured data, we can make sure only the right models with the loadsouts
// have those special rules associated with them
