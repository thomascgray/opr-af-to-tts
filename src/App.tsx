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

const TOOLTIP_COLOUR_RED = "e84118";

interface iSpecialRule {
  name: string;
  value?: number;
}

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
  individualSpecialRules: string[];
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
  armySpecialRulesDict: {
    name: string;
    definition: string;
  }[];
  armySpecialRulesDictNames: string[];
  unitProfiles: iUnitProfile[];
}

const state = proxy<iAppState>({
  armyListRawText: `++ my cool tau dudes - DAO Union [GF 1030pts] ++

Battle Suit Elite [1] Q3+ D3+ | 200pts | Ambush, Flying, Hero, Tough(6)
Bash (A4, AP(1)), 3x Heavy Suit-Gun (24", A1, AP(1)), Suit-Fuse (12", A1, AP(4), Deadly(3))

Grunt Squad [5] Q5+ D4+ | 105pts | Good Shot
5x CCWs (A1), 5x Pulse Rifles (30", A1, AP(1))

2x Grunt Squad [5] Q5+ D4+ | 90pts | Good Shot
5x CCWs (A1), 5x Pulse Shotguns (12", A2, AP(1))

Battle Suits [3] Q4+ D3+ | 420pts | Ambush, Flying, Tough(3), Shield Drone, 1x Energy Shield(Shield Wall), 2x Spotter Drone(Spotting Laser)
3x Bashes (A2), Suit-Gun (24", A1, AP(1)), Suit-Burst (18", A2, Rending), Suit-Flamer (12", A3), Suit-Missiles (30", A2, AP(2), Lock-On), Suit-Plasma (24", A2, AP(4)), Suit-Frag (24", A1, Blast(3), Indirect), 2x Plasma Sword (A2, AP(1), Rending)

Gun Drones [5] Q5+ D4+ | 125pts | Fearless, Flying, Good Shot
5x Tasers (A1), 5x Twin Pulse-Guns (18", A2, Rending)`,
  armySpecialRulesRawText: `AP: Targets get -X to Defense rolls when blocking hits.

Ambush: This model may be kept in reserve instead of deploying. At the start of any round after the first, you may place the model anywhere, over 9” away from enemy units. If both player have Ambush, they roll-off to see who deploys first, and then alternate in placing them.

Blast: Ignores cover and multiplies hits by X, but can’t deal more than one hit per model in the target unit.

Deadly: Assign each wound to one model, and multiply it by X. Note that these wounds don't carry over to other models if the target is killed.

Defense: Gets +X to Defense rolls.

Fearless: Gets +1 to morale tests.

Flying: May move through all obstacles, and may ignore terrain effects.

Good Shot: This model shoots at Quality 4+.

Hero: May be deployed as part of one friendly unit, which may use its Quality value for morale tests. When taking hits, you must use the unit’s Defense value, until all non-hero models are killed.

Indirect: May target enemies that are not in line of sight, and ignores cover from sight obstructions, but gets -1 to hit rolls when shooting after moving.

Lock-On: Ignores all negative modifiers to hit rolls and range.

Rending: Unmodified results of 6 to hit count as having AP(4), and ignore the regeneration rule.

Shield Drone: This model and its unit count as having the Stealth special rule.

Shield Wall: Attacks targeting units where all models have this rule count as having AP(-1), to a min. of AP(0).

Spotting Laser: Once per activation, before attacking, this model may pick one enemy unit within 30” in line of sight and roll one die, on a 4+ place a marker on it. Friendly units may remove markers from their target to get +X to hit rolls when shooting, where X is the number of removed markers.

Stealth: Enemies get -1 to hit rolls when shooting at this unit.

Tough: This model must take X wounds before being killed. If a model with tough joins a unit without it, then it is removed last when the unit takes wounds. Note that you must continue to put wounds on the tough model with most wounds in the unit until it is killed, before starting to put them on the next tough model (heroes must be assigned wounds last).`,
  armySpecialRulesDict: [],
  armySpecialRulesDictNames: [],
  unitProfiles: [],
});

const updateWeaponQuantity = (upId: string, wpId: string, quantity: number) => {
  const unitProfile = state.unitProfiles.find((up) => up.id === upId);
  if (unitProfile) {
    const weapon = unitProfile.weapons.find((wp) => wp.id === wpId);
    if (weapon) {
      weapon.quantity = quantity;
    }
  }
};

const updateSpecialRuleQuantity = (
  upId: string,
  srId: string,
  quantity: number
) => {
  const unitProfile = state.unitProfiles.find((up) => up.id === upId);
  if (unitProfile) {
    const specialRule = unitProfile.specialRules.find((wp) => wp.id === srId);
    if (specialRule) {
      specialRule.quantity = quantity;
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
          // the army list
          const armyList = formatRawTextIntoLines(stateView.armyListRawText);
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

      <div className="flex flex-row space-x-2">
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

                        <input
                          className="w-10"
                          min={0}
                          onChange={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            updateSpecialRuleQuantity(
                              unitProfile.id,
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

        <div className="space-y-3 w-2/3">
          {stateView.unitProfiles.map((unit) => {
            const activeWeapons = unit.weapons.filter((w) => w.quantity > 0);
            const activeSpecialRules = unit.specialRules.filter(
              (s) => s.quantity > 0
            );

            const activeWeaponNamesCommaSeparated = activeWeapons
              .map((x) => x.name)
              .join(", ");

            const activeSpecialRulesList = activeSpecialRules
              .map((sr) => {
                const definition = stateView.armySpecialRulesDict.find(
                  (x) => x.name === sr.name
                )?.definition;
                return `${sr.name}: ${definition}`;
              })
              .join("\r\n");

            const activeWeaponsList = activeWeapons
              .map((w) => {
                return `[b]${w.name}[/b] [sub]${w.definition}[/sub]`;
              })
              .join("\r\n");
            return (
              <div key={unit.id + "tts"} className="bg-slate-300 p-4 space-y-1">
                <textarea
                  value={`${unit.name}
[7ed6df][sup]${activeWeaponNamesCommaSeparated}[/sup][-]
[sub][2ecc71][i]QUA[/i][-]     [3498db][i]DEF[/i][-][/sub]
[2ecc71][b]${unit.qua}[/b]+[-]      [3498db][b]${unit.def}[/b]+[-]`}
                  className="block whitespace-pre text-xs w-full h-20"
                />
                <textarea
                  value={`${activeWeaponsList}
----------
${activeSpecialRulesList}`}
                  className="block whitespace-pre text-xs w-full h-20"
                />

                <textarea value={``} />

                {unit.individualSpecialRules
                  .filter((isp) =>
                    stateView.armySpecialRulesDictNames.includes(isp)
                  )
                  .map((isp) => {
                    return (
                      <span key={isp} className="block text-xs">
                        {isp}:{" "}
                        {
                          stateView.armySpecialRulesDict.find(
                            (x) => x.name === isp
                          )?.definition
                        }
                      </span>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
