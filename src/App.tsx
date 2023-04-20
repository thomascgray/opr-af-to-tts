import { useState } from "react";
import * as _ from "lodash";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import { proxy, useSnapshot } from "valtio";

// taken from https://stackoverflow.com/a/25060605
const splitNoParen = (s: string) => {
  var left = 0,
    right = 0,
    // @ts-ignore
    A = [],
    M = s.match(/([^()]+)|([()])/g),
    // @ts-ignore
    L = M.length,
    next,
    str = "";
  for (var i = 0; i < L; i++) {
    // @ts-ignore
    next = M[i];
    if (next === "(") ++left;
    else if (next === ")") ++right;
    if (left !== 0) {
      str += next;
      if (left === right) {
        A[A.length - 1] += str;
        left = right = 0;
        str = "";
      }
      // @ts-ignore
    } else A = A.concat(next.match(/([^,]+)/g));
  }
  return A;
};

const formatRawTextIntoLines = (text: string) => {
  return text.split(/\r?\n|\r|\n/g).filter((line) => line !== "");
};

const removeQuantityStringFromStartOfString = (str: string) => {
  if (/^\dx /.test(str)) {
    return str.substring(2);
  } else {
    return str;
  }
};

const extractQuaDef = (str: string) => {
  let regex = /[QD]\d+/g;
  let matches = str.match(regex);
  let values = [];

  if (matches) {
    for (let i = 0; i < matches.length; i++) {
      let match = matches[i];
      let value = match.substring(1);
      values.push(parseInt(value));
    }
  }

  return values;
};

const cleanFirstLineOfUnitProfile = (val: string) => {
  val = val.replace(/\[\d\]/g, "|");
  return val;
};

const cleanSecondLineOfUnitProfile = (val: string) => {
  return val;
};

// this just gets all the keywords out of a some crazy nested bracket string. see tests
export const getAllIndividualSpecialRulesFromString = (line: string) => {
  const individualSpecialRules = line
    .split(/[\(\),]/gm)
    .filter((x) => x !== "")
    .map((x) => x.trim())
    .filter((x) => Number.isNaN(+x))
    .map((x) => removeQuantityStringFromStartOfString(x))
    // .map((x) => x.replaceAll(/\(\)/gm, "a"))
    .map((x) => x.trim());
  return individualSpecialRules;
};

// this gets the top level special rules, like "Ambush" or "Flying" or "Tough(3)"
// it wont go a bracket level deeper, so given "A(B,C(D)), E", it will return "A(B,C(D))" and "E"
export const getTopLevelSpecialRulesFromString = (line: string) => {
  return splitNoParen(line)
    .map((x) => x.trim())
    .map((x) => removeQuantityStringFromStartOfString(x))
    .map((x) => x.trim())
    .map((x) => x.replace(/\(\)/gm, ""));
};

interface iUnitProfile {
  id: string;
  originalName: string;
  models: {
    id: string;
    name: string;
    originalName: string;
    qua: number;
    def: number;
    isGenerated: boolean;
    weapons: {
      id: string;
      name: string;
      definition: string;
      quantity: number;
    }[];
    individualSpecialRules: string[];
    specialRules: {
      id: string;
      name: string;
      definition: string;
      quantity: number;
    }[];
  }[];
}

interface iAppState {
  armyListRawText: string;
  armySpecialRulesRawText: string;
  armySpecialRulesDict: {
    name: string;
    definition: string;
  }[];
  armySpecialRulesDictNames: string[];
  unitProfiles: iUnitProfile[];
}

const state = proxy<iAppState>({
  armyListRawText: ``,
  armySpecialRulesRawText: ``,
  armySpecialRulesDict: [],
  armySpecialRulesDictNames: [],
  unitProfiles: [],
});

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
      const weapon = model.weapons.find((wp) => wp.id === wpId);
      if (weapon) {
        weapon.quantity = quantity;
      }
    }
  }
};

const updateSpecialRuleQuantity = (
  upId: string,
  mId: string,
  srId: string,
  quantity: number
) => {
  const unit = state.unitProfiles.find((up) => up.id === upId);
  if (unit) {
    const model = unit.models.find((m) => m.id === mId);
    if (model) {
      const specialRule = model.specialRules.find((wp) => wp.id === srId);
      if (specialRule) {
        specialRule.quantity = quantity;
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
        <div className="w-1/2">
          <label className="block h-20">
            <span className="block font-bold">Army List Input</span>
            <span className="block text-sm text-stone-500">
              On{" "}
              <a
                className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                href="https://army-forge.onepagerules.com/"
              >
                Army Forge
              </a>{" "}
              → Menu (at top right) → "Share as Text" → Paste into the box below
            </span>
          </label>
          <textarea
            value={stateView.armyListRawText}
            onChange={(e) => (state.armyListRawText = e.currentTarget.value)}
            className="border border-stone-600 w-full h-40 text-xs"
          ></textarea>
        </div>

        <div className="w-1/2">
          <label className="block h-20">
            <span className="block font-bold">Army Special Rules Input</span>
            <span className="block text-sm text-stone-500">
              On{" "}
              <a
                className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                href="https://army-forge.onepagerules.com/"
              >
                Army Forge
              </a>{" "}
              → View List (the "eye" icon, top right) → manually select and copy{" "}
              <em>all</em> the text underneath "Special Rules" → Paste into the
              box below
            </span>
          </label>
          <textarea
            value={stateView.armySpecialRulesRawText}
            onChange={(e) =>
              (state.armySpecialRulesRawText = e.currentTarget.value)
            }
            className="border border-stone-600 w-full h-40 text-xs"
          ></textarea>
        </div>
      </div>

      <button
        disabled={stateView.armyListRawText === ""}
        onClick={() => {
          // the army list
          const armyList = formatRawTextIntoLines(
            stateView.armyListRawText
          ).filter((x) => x !== "# Joined to:"); // remove random join to lines

          armyList.shift();
          const rawUnitProfiles = _.chunk(armyList, 2);

          // the special rules
          const armySpecialRules = formatRawTextIntoLines(
            stateView.armySpecialRulesRawText
          ).map((line) => {
            const i = line.indexOf(":");
            const name = line.substring(0, i).trim();
            const definition = line.substring(i + 1).trim();
            return {
              name,
              definition,
            };
          });

          state.armySpecialRulesDict = armySpecialRules;
          state.armySpecialRulesDictNames = armySpecialRules.map((x) => x.name);

          const unitProfiles = rawUnitProfiles.map(
            (rawUnitProfile): iUnitProfile => {
              const firstLineParsed = cleanFirstLineOfUnitProfile(
                rawUnitProfile[0]
              );
              const [unitName, unitQuaDef, unitPoints, unitSpecialsRaw] =
                firstLineParsed.split("|");

              //  work out all the specials from the the first row after the points
              const unitSpecials =
                getTopLevelSpecialRulesFromString(unitSpecialsRaw);

              const [unitQua, unitDef] = extractQuaDef(unitQuaDef);

              const secondLineParsed = cleanSecondLineOfUnitProfile(
                rawUnitProfile[1]
              );

              const weapons = splitNoParen(secondLineParsed)
                .map((x) => x.trim())
                .map((x) => removeQuantityStringFromStartOfString(x))
                .map((x) => x.trim());

              // we also need to get all the specials out of the weapons

              // return the final profile
              return {
                id: nanoid(),
                originalName: unitName,
                models: [
                  {
                    id: nanoid(),
                    isGenerated: true,
                    name: pluralize.singular(
                      removeQuantityStringFromStartOfString(unitName).trim()
                    ),
                    originalName: unitName,
                    qua: unitQua,
                    def: unitDef,
                    weapons: weapons.map((weapon) => {
                      const i = weapon.indexOf("(");
                      const weaponName = weapon.substring(0, i).trim();
                      const weaponDefinition = weapon.substring(i).trim();
                      return {
                        id: nanoid(),
                        name: pluralize.singular(weaponName),
                        definition: weaponDefinition,
                        quantity: 1,
                      };
                    }),
                    individualSpecialRules:
                      getAllIndividualSpecialRulesFromString(unitSpecialsRaw),
                    specialRules: unitSpecials.map((specialRule) => {
                      return {
                        id: nanoid(),
                        name: specialRule,
                        definition: "",
                        quantity: 1,
                      };
                    }),
                  },
                ],
              };
            }
          );

          state.unitProfiles = [...unitProfiles];
        }}
        className="border disabled:hover:scale-100 disabled:opacity-50 border-stone-600 px-4 py-2 bg-stone-500 text-white hover:scale-105  active:scale-95"
      >
        Generate
      </button>

      <details className="text-sm mt-4">
        <summary className="cursor-pointer">Tutorial</summary>
        <p>
          Army list definitions keep track of the whole "pool" of Weapons and
          Special Rules associated with an entire unit - <em>not</em> which
          Weapons and Special Rules are associated with individual, distinct
          models.
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
                  const activeWeapons = model.weapons.filter(
                    (w) => w.quantity > 0
                  );
                  const activeSpecialRules = model.specialRules.filter(
                    (s) => s.quantity > 0
                  );

                  const activeWeaponNamesCommaSeparated = activeWeapons
                    .map((x) => {
                      if (x.quantity > 1) {
                        return `${x.quantity}x ${x.name}`;
                      }
                      return `${x.name}`;
                    })
                    .join(", ");

                  const activeSpecialRulesNamesCommaSeparated =
                    activeSpecialRules
                      .map((x) => {
                        if (x.quantity > 1) {
                          return `${x.quantity}x ${x.name}`;
                        }
                        return `${x.name}`;
                      })
                      .join(", ");

                  const activeSpecialRulesList = activeSpecialRules
                    .map((sr) => {
                      const definition = stateView.armySpecialRulesDict.find(
                        (x) => x.name === sr.name
                      )?.definition;
                      return `${sr.name}: ${definition}`;
                    })
                    .join(", ");

                  const fullSpecialRulesForThisUnit =
                    model.individualSpecialRules
                      .filter((isp) =>
                        activeSpecialRules.find((sr) => sr.name.includes(isp))
                      )
                      .filter((isp) =>
                        stateView.armySpecialRulesDictNames.includes(isp)
                      )
                      .map((isp) => {
                        return `[f0932b]${isp}[-]
[sup]${
                          stateView.armySpecialRulesDict.find(
                            (x) => x.name === isp
                          )?.definition
                        }[/sup]`;
                      })
                      .join("\r\n");

                  const activeWeaponsList = activeWeapons
                    .map((w) => {
                      return `[eb4d4b]${w.name}[-]
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
                            <br />
                            <small className="text-[#f0932b] font-bold">
                              {activeSpecialRulesNamesCommaSeparated}
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
                          {model.weapons.map((weapon) => {
                            return (
                              <div
                                key={weapon.id}
                                className="flex flex-row items-center justify-between bg-stone-300 py-1 px-2"
                              >
                                <span className="flex flex-row items-center space-x-1 ">
                                  <span className="font-bold">
                                    {weapon.name}
                                  </span>
                                  <span className="">{weapon.definition}</span>
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
                                      weapon.id,
                                      value
                                    );
                                  }}
                                  value={weapon.quantity}
                                  type="number"
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* special abilities */}

                        <div className="space-y-1">
                          {model.specialRules.map((specialRule) => {
                            return (
                              <div
                                key={specialRule.id}
                                className="flex flex-row items-center justify-between bg-stone-300 py-1 px-2"
                              >
                                <span className="flex flex-row items-center space-x-1">
                                  <span className="font-bold">
                                    {specialRule.name}
                                  </span>
                                  <span>{specialRule.definition}</span>
                                </span>

                                <input
                                  className="w-10 p-1"
                                  min={0}
                                  onChange={(e) => {
                                    const value = parseInt(
                                      e.currentTarget.value
                                    );
                                    updateSpecialRuleQuantity(
                                      unit.id,
                                      model.id,
                                      specialRule.id,
                                      value
                                    );
                                  }}
                                  value={specialRule.quantity}
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
                            onFocus={(e) => e.target.select()}
                            value={`[b]${model.name}[/b]
[sup][eb4d4b]${activeWeaponNamesCommaSeparated}[-][/sup]
[sup][f0932b]${activeSpecialRulesNamesCommaSeparated}[-][/sup]
[2ecc71][b]${model.qua}[/b]+[-] / [3498db][b]${model.def}[/b]+[-]`}
                            className="block whitespace-pre text-xs w-full h-10 overflow-x-hidden"
                          />
                          <textarea
                            onFocus={(e) => e.target.select()}
                            value={`${activeWeaponsList}
${fullSpecialRulesForThisUnit}`}
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
