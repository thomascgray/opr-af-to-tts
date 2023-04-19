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
  // val = val.replace(/\[\d\]/g, "|");
  return val;
};

interface iUnitProfile {
  id: string;
  name: string;
  qua: number;
  def: number;
  isGenerated: boolean;
  weapons: {
    id: string;
    name: string;
    definition: string;
    quantity: number;
  }[];
  specialRules: {
    id: string;
    name: string;
    definition: string;
    quantity: number;
  }[];
}

interface iAppState {
  armyListRawText: string;
  armySpecialRulesRawText: string;
  unitProfiles: iUnitProfile[];
}

const state = proxy<iAppState>({
  armyListRawText: "",
  armySpecialRulesRawText: "",
  unitProfiles: [],
});

const updateWeaponQuantity = (upId: string, wpId: string, quantity: number) => {
  const unitProfile = state.unitProfiles.find((up) => up.id === upId);
  console.log("unitProfile", JSON.stringify(unitProfile, null, 2));
  if (unitProfile) {
    const weapon = unitProfile.weapons.find((wp) => wp.id === wpId);
    if (weapon) {
      weapon.quantity = quantity;
    }
  }
};

function App() {
  const stateView = useSnapshot(state);

  return (
    <div className="container mx-auto">
      <h1>OPR Grimdark Future</h1>
      <h2>Roster to TTS</h2>
      <div className="inputs flex flex-row space-x-5">
        <div className="w-1/2">
          <label className="block">Army List</label>
          <textarea
            value={stateView.armyListRawText}
            onChange={(e) => (state.armyListRawText = e.currentTarget.value)}
            className="border border-slate-600 w-full h-40 text-xs"
          ></textarea>
        </div>

        <div className="w-1/2">
          <label className="block">Army Special Rules</label>
          <textarea
            value={stateView.armySpecialRulesRawText}
            onChange={(e) =>
              (state.armySpecialRulesRawText = e.currentTarget.value)
            }
            className="border border-slate-600 w-full h-40 text-xs"
          ></textarea>
        </div>
      </div>

      <button
        onClick={() => {
          const armyList = formatRawTextIntoLines(stateView.armyListRawText);

          armyList.shift();
          const rawUnitProfiles = _.chunk(armyList, 2);

          const unitProfiles = rawUnitProfiles.map(
            (rawUnitProfile): iUnitProfile => {
              const firstLineParsed = cleanFirstLineOfUnitProfile(
                rawUnitProfile[0]
              );
              const [unitName, unitQuaDef, unitPoints, unitSpecialsRaw] =
                firstLineParsed.split("|");

              // some of these special rules are actually a word, then in brackets the special rules
              // that come with that word e.g "Jetpacks(Ambush, Flying)"
              // in that case, we should just use the special rules in the brackets
              // UNLESS that special Rule is "Tough" - then we need to keep "Tough"

              // special rules are crazy!
              // they can be
              // - a single word
              // - a single word followed by a number in brackets
              // - a single word followed by multiple
              const unitSpecials = unitSpecialsRaw.split(/[\(\),,]+/); // split on commas and either bracket character

              const [unitQua, unitDef] = extractQuaDef(unitQuaDef);

              const secondLineParsed = cleanSecondLineOfUnitProfile(
                rawUnitProfile[1]
              );

              const weapons = splitNoParen(secondLineParsed)
                .map((x) => x.trim())
                .map((x) => removeQuantityStringFromStartOfString(x))
                .map((x) => x.trim());

              return {
                id: nanoid(),
                isGenerated: true,
                name: pluralize.singular(
                  removeQuantityStringFromStartOfString(unitName).trim()
                ),
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
                specialRules: unitSpecials.map((specialRule) => {
                  return {
                    id: nanoid(),
                    name: removeQuantityStringFromStartOfString(specialRule),
                    definition: "",
                    quantity: 1,
                  };
                }),
              };
            }
          );

          state.unitProfiles = [...unitProfiles];
        }}
        className="border border-slate-600 px-4 py-2 bg-slate-500 text-white hover:scale-105  active:scale-95"
      >
        Generate
      </button>

      <hr className="my-5" />

      <div className="flex flex-row">
        <div className="space-y-3 w-1/3">
          {stateView.unitProfiles.map((unitProfile) => {
            return (
              <div key={unitProfile.id} className="bg-slate-300 p-2">
                <div className="flex flex-row justify-between">
                  <h3>{unitProfile.name}</h3>
                  {!unitProfile.isGenerated && (
                    <button
                      onClick={() => {
                        const i = state.unitProfiles.findIndex(
                          (x) => x.id === unitProfile.id
                        );
                        state.unitProfiles.splice(i, 1);
                      }}
                      className="bg-slate-600 text-white rounded-full hover:scale-105  active:scale-95"
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
                <div className="flex flex-row items-center space-x-2">
                  <p>Q{unitProfile.qua}+</p>
                  <p>D{unitProfile.def}+</p>
                </div>

                <div className="ml-4">
                  {unitProfile.weapons.map((weapon) => {
                    return (
                      <div
                        key={weapon.id}
                        className="space-y-1 flex flex-row items-center justify-between space-x-4"
                      >
                        <span className="flex flex-row items-center space-x-1 text-sm">
                          <span className="font-bold">{weapon.name}</span>
                          <span className="">{weapon.definition}</span>
                        </span>

                        <input
                          className="w-10"
                          min={0}
                          onChange={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            updateWeaponQuantity(
                              unitProfile.id,
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

                <div className="ml-4">
                  {unitProfile.specialRules.map((specialRule) => {
                    return (
                      <div
                        key={specialRule.id}
                        className="space-y-1 flex flex-row items-center justify-between space-x-4"
                      >
                        <span className="flex flex-row items-center space-x-1 text-sm">
                          <span className="font-bold">{specialRule.name}</span>
                          <span className="">{specialRule.definition}</span>
                        </span>
                        {/* 
                        <input
                          className="w-10"
                          min={0}
                          onChange={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            updateWeaponQuantity(
                              unitProfile.id,
                              specialRule.id,
                              value
                            );
                          }}
                          value={specialRule.quantity}
                          type="number"
                        /> */}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const i = state.unitProfiles.findIndex(
                      (x) => x.id === unitProfile.id
                    );
                    state.unitProfiles.splice(i + 1, 0, {
                      ..._.cloneDeep(state.unitProfiles[i]),
                      isGenerated: false,
                      id: nanoid(),
                    });
                  }}
                  className="text-sm border border-slate-600 px-3 py-1 bg-slate-500 text-white hover:scale-105  active:scale-95"
                >
                  Duplicate Model Profile
                </button>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 w-1/3"></div>
      </div>
    </div>
  );
}

export default App;
