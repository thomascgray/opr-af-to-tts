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
  val = val.replace(/\[\d+\]/g, "|");
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
  armySpecialRulesDict: {
    name: string;
    definition: string;
  }[];
  armySpecialRulesDictNames: string[];
  unitProfiles: iUnitProfile[];
}

const state = proxy<iAppState>({
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
        <div className="w-full">
          <label>
            <span>Army Forge Share Link</span>
            <input
              type="text"
              className="border border-solid border-stone-500 w-full"
            />
          </label>
        </div>
      </div>

      <button
        onClick={() => {
          const rawArmyData = {
            id: "s7EwJKKX",
            name: "Battle Brothers",
            units: [
              {
                id: "FJRVn9S",
                cost: 55,
                name: "Master Brother",
                size: 1,
                defense: 3,
                quality: 3,
                specialRules: [
                  { key: "fearless", name: "Fearless", rating: "" },
                  { key: "hero", name: "Hero", rating: "" },
                  { key: "tough", name: "Tough", rating: "3" },
                ],
                armyId: "78qp9l5alslt6yj8",
                sortId: 0,
                xp: 0,
                notes: null,
                traits: [],
                combined: false,
                joinToUnit: "q9CZl",
                selectionId: "7J1K5",
                loadout: [
                  {
                    id: "FN2DE",
                    name: "CCW",
                    label: "CCW",
                    attacks: 1,
                    specialRules: [],
                    count: 1,
                    originalCount: 1,
                    type: "ArmyBookWeapon",
                  },
                  {
                    id: "oU3Uc",
                    name: "Heavy Rifle",
                    label: "Heavy Rifle",
                    range: 24,
                    attacks: 1,
                    specialRules: [
                      { key: "ap", name: "AP", rating: "1", modify: false },
                    ],
                    count: 1,
                    originalCount: 1,
                    type: "ArmyBookWeapon",
                  },
                  {
                    name: "Captain",
                    type: "ArmyBookItem",
                    label: "Captain (Advanced Tactics)",
                    content: [
                      {
                        key: "advanced-tactics",
                        name: "Advanced Tactics",
                        type: "ArmyBookRule",
                        label: "Advanced Tactics",
                        rating: "",
                        count: 1,
                        dependencies: [],
                      },
                    ],
                    count: 1,
                    dependencies: [],
                    isModel: false,
                  },
                ],
              },
              {
                id: "rsouUXt",
                cost: 145,
                name: "Battle Brothers",
                size: 5,
                defense: 3,
                quality: 3,
                specialRules: [
                  { key: "fearless", name: "Fearless", rating: "" },
                ],
                armyId: "78qp9l5alslt6yj8",
                sortId: 4,
                xp: 0,
                notes: null,
                traits: [],
                combined: false,
                joinToUnit: null,
                selectionId: "q9CZl",
                loadout: [
                  {
                    id: "dzEXV",
                    name: "CCWs",
                    label: "CCWs",
                    attacks: 1,
                    specialRules: [],
                    count: 5,
                    originalCount: 5,
                    type: "ArmyBookWeapon",
                  },
                  {
                    uid: "wWjig",
                    label: "Heavy Rifles",
                    range: 24,
                    attacks: 1,
                    specialRules: [
                      { key: "ap", name: "AP", rating: "1", modify: false },
                    ],
                    name: "Heavy Rifles",
                    count: 4,
                    originalCount: 5,
                    type: "ArmyBookWeapon",
                    dependencies: [
                      {
                        upgradeInstanceId: "URg9IfXxW",
                        count: 1,
                        type: "replace",
                      },
                    ],
                  },
                  {
                    name: "Plasma Rifle",
                    type: "ArmyBookWeapon",
                    label: 'Plasma Rifle (24", A1, AP(4))',
                    range: 24,
                    attacks: 1,
                    condition: "",
                    specialRules: [
                      {
                        key: "ap",
                        name: "AP",
                        type: "ArmyBookRule",
                        label: "AP(4)",
                        modify: false,
                        rating: "4",
                        condition: "",
                      },
                    ],
                    count: 1,
                    dependencies: [],
                  },
                ],
              },
              {
                id: "y59VWP0",
                cost: 165,
                name: "Support Brothers",
                size: 3,
                defense: 3,
                quality: 3,
                specialRules: [
                  { key: "fearless", name: "Fearless", rating: "" },
                  { key: "relentless", name: "Relentless", rating: "" },
                ],
                armyId: "78qp9l5alslt6yj8",
                sortId: 5,
                xp: 0,
                notes: null,
                traits: [],
                combined: false,
                joinToUnit: null,
                selectionId: "dBUCe",
                loadout: [
                  {
                    id: "UFSiL",
                    name: "CCWs",
                    label: "CCWs",
                    attacks: 1,
                    specialRules: [],
                    count: 3,
                    originalCount: 3,
                    type: "ArmyBookWeapon",
                  },
                  {
                    name: "Missile Launcher",
                    type: "ArmyBookWeapon",
                    label:
                      'Missile Launcher (30", A1, AP(2), Deadly(3), Lock-On)',
                    range: 30,
                    attacks: 1,
                    condition: "",
                    specialRules: [
                      {
                        key: "ap",
                        name: "AP",
                        type: "ArmyBookRule",
                        label: "AP(2)",
                        modify: false,
                        rating: "2",
                      },
                      {
                        key: "deadly",
                        name: "Deadly",
                        type: "ArmyBookRule",
                        label: "Deadly(3)",
                        modify: false,
                        rating: "3",
                      },
                      {
                        key: "lock-on",
                        name: "Lock-On",
                        type: "ArmyBookRule",
                        label: "Lock-On",
                        modify: false,
                        rating: "",
                      },
                    ],
                    count: 1,
                    dependencies: [],
                  },
                  {
                    name: "Plasma Cannon",
                    type: "ArmyBookWeapon",
                    label: "Plasma Cannon (30”, A1, Blast(3), AP(4))",
                    range: 30,
                    attacks: 1,
                    specialRules: [
                      {
                        key: "blast",
                        name: "Blast",
                        type: "ArmyBookRule",
                        label: "Blast(3)",
                        rating: "3",
                      },
                      {
                        key: "ap",
                        name: "AP",
                        type: "ArmyBookRule",
                        label: "AP(4)",
                        rating: "4",
                      },
                    ],
                    count: 1,
                    dependencies: [],
                  },
                  {
                    name: "Heavy Fusion Rifle",
                    type: "ArmyBookWeapon",
                    label: 'Heavy Fusion Rifle (18", A1, AP(4), Deadly(6))',
                    range: 18,
                    attacks: 1,
                    condition: "",
                    specialRules: [
                      {
                        key: "ap",
                        name: "AP",
                        type: "ArmyBookRule",
                        label: "AP(4)",
                        modify: false,
                        rating: "4",
                      },
                      {
                        key: "deadly",
                        name: "Deadly",
                        type: "ArmyBookRule",
                        label: "Deadly(6)",
                        modify: false,
                        rating: "6",
                      },
                    ],
                    count: 1,
                    dependencies: [],
                  },
                ],
              },
              {
                id: "G163lhb",
                cost: 185,
                name: "Heavy Exo-Suit",
                size: 1,
                defense: 2,
                quality: 3,
                specialRules: [
                  { key: "fear", name: "Fear", rating: "" },
                  { key: "fearless", name: "Fearless", rating: "" },
                  { key: "tough", name: "Tough", rating: "6" },
                ],
                armyId: "78qp9l5alslt6yj8",
                sortId: 17,
                xp: 0,
                notes: null,
                traits: [],
                combined: false,
                joinToUnit: null,
                selectionId: "jiN4_",
                loadout: [
                  {
                    id: "efIjR",
                    name: "Stomp",
                    label: "Stomp",
                    attacks: 2,
                    specialRules: [
                      { key: "ap", name: "AP", rating: "1", modify: false },
                    ],
                    count: 1,
                    originalCount: 1,
                    type: "ArmyBookWeapon",
                  },
                  {
                    name: "Heavy Rifle Array",
                    type: "ArmyBookWeapon",
                    label: "Heavy Rifle Array (24”, A6, AP(1))",
                    range: 24,
                    attacks: 6,
                    specialRules: [
                      {
                        key: "ap",
                        name: "AP",
                        type: "ArmyBookRule",
                        label: "AP(1)",
                        rating: "1",
                      },
                    ],
                    count: 1,
                    dependencies: [],
                    isModel: false,
                  },
                  {
                    name: "Twin Gravity Cannon",
                    type: "ArmyBookWeapon",
                    label: 'Twin Gravity Cannon (24", A2, Blast(3), Rending)',
                    range: 24,
                    attacks: 2,
                    condition: "",
                    specialRules: [
                      {
                        key: "blast",
                        name: "Blast",
                        type: "ArmyBookRule",
                        label: "Blast(3)",
                        modify: false,
                        rating: "3",
                      },
                      {
                        key: "rending",
                        name: "Rending",
                        type: "ArmyBookRule",
                        label: "Rending",
                        modify: false,
                        rating: "",
                      },
                    ],
                    count: 1,
                    dependencies: [],
                  },
                ],
              },
            ],
            points: 750,
            gameSystem: "gf",
            competitive: true,
            pointsLimit: 750,
            unitPreview: null,
            campaignMode: false,
            selectedUnitId: "q9CZl",
            undoUnitRemove: [
              {
                id: "rsouUXt",
                xp: 0,
                cost: 145,
                name: "Battle Brothers",
                size: 5,
                notes: null,
                armyId: "78qp9l5alslt6yj8",
                sortId: 4,
                traits: [],
                defense: 3,
                loadout: [
                  {
                    id: "dzEXV",
                    name: "CCWs",
                    type: "ArmyBookWeapon",
                    count: 5,
                    label: "CCWs",
                    attacks: 1,
                    specialRules: [],
                    originalCount: 5,
                  },
                  {
                    uid: "wWjig",
                    name: "Heavy Rifles",
                    type: "ArmyBookWeapon",
                    count: 5,
                    label: "Heavy Rifles",
                    range: 24,
                    attacks: 1,
                    specialRules: [
                      { key: "ap", name: "AP", modify: false, rating: "1" },
                    ],
                    originalCount: 5,
                  },
                ],
                quality: 3,
                combined: false,
                upgrades: ["A1", "D1"],
                equipment: [
                  {
                    id: "dzEXV",
                    name: "CCWs",
                    type: "ArmyBookWeapon",
                    count: 5,
                    label: "CCWs",
                    attacks: 1,
                    specialRules: [],
                    originalCount: 5,
                  },
                  {
                    uid: "wWjig",
                    name: "Heavy Rifles",
                    type: "ArmyBookWeapon",
                    count: 5,
                    label: "Heavy Rifles",
                    range: 24,
                    attacks: 1,
                    specialRules: [
                      { key: "ap", name: "AP", modify: false, rating: "1" },
                    ],
                    originalCount: 5,
                  },
                ],
                joinToUnit: null,
                selectionId: "z-iI5",
                specialRules: [
                  { key: "fearless", name: "Fearless", rating: "" },
                ],
                selectedUpgrades: [],
                disabledUpgradeSections: [],
              },
            ],
            specialRules: [
              {
                id: 130,
                name: "War Chant",
                aliasedRuleId: null,
                description:
                  "For each unmodified result of 6 to hit when attacking in melee, the hero and its unit may roll 2 extra attacks. This rule doesn’t apply to newly generated attacks.",
                hasRating: false,
              },
              {
                id: 124,
                name: "Advanced Tactics",
                aliasedRuleId: null,
                description:
                  'Once per activation, before attacking, pick one other friendly unit within 12” of this model, which may move by up to 6".',
                hasRating: false,
              },
              {
                id: 127,
                name: "Shield Wall",
                aliasedRuleId: null,
                description:
                  "Attacks targeting units where all models have this rule count as having AP(-1), to a min. of AP(0).",
                hasRating: false,
              },
              {
                id: 126,
                name: "Repair",
                aliasedRuleId: null,
                description:
                  "Once per activation, if within 2” of a unit with Tough, roll one die. On a 2+ you may repair D3 wounds from the target.",
                hasRating: false,
              },
              {
                id: 129,
                name: "Veteran Walker",
                aliasedRuleId: null,
                description:
                  "This model gets +1 to its attack rolls for melee and shooting.",
                hasRating: false,
              },
              {
                id: 128,
                name: "Veteran Infantry",
                aliasedRuleId: null,
                description:
                  "This model gets +1 to hit rolls in melee and shooting.",
                hasRating: false,
              },
              {
                id: 125,
                name: "Medical Training",
                aliasedRuleId: null,
                description:
                  "This model and its unit get the Regeneration rule.",
                hasRating: false,
              },
            ],
          };

          const unitProfiles: iUnitProfile[] = rawArmyData.units.map((unit) => {
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
                  qua: unit.quality,
                  def: unit.defense,
                  weapons: unit.loadout.map((weapon) => {
                    // const i = weapon.indexOf("(");
                    // const weaponName = weapon.substring(0, i).trim();
                    // const weaponDefinition = weapon.substring(i).trim();
                    return {
                      id: nanoid(),
                      name: pluralize.singular(weapon.name),
                      definition: `${weapon.attacks}`,
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
          });

          // const unitProfiles = rawUnitProfiles.map(
          //   (rawUnitProfile): iUnitProfile => {
          //     const firstLineParsed = cleanFirstLineOfUnitProfile(
          //       rawUnitProfile[0]
          //     );
          //     const [unitName, unitQuaDef, unitPoints, unitSpecialsRaw] =
          //       firstLineParsed.split("|");

          //     console.log("unitName", unitName);
          //     console.log("unitQuaDef", unitQuaDef);
          //     console.log("unitPoints", unitPoints);
          //     console.log("unitSpecialsRaw", unitSpecialsRaw);
          //     //  work out all the specials from the the first row after the points
          //     const unitSpecials =
          //       getTopLevelSpecialRulesFromString(unitSpecialsRaw);

          //     const [unitQua, unitDef] = extractQuaDef(unitQuaDef);

          //     const secondLineParsed = cleanSecondLineOfUnitProfile(
          //       rawUnitProfile[1]
          //     );

          //     const weapons = splitNoParen(secondLineParsed)
          //       .map((x) => x.trim())
          //       .map((x) => removeQuantityStringFromStartOfString(x))
          //       .map((x) => x.trim());

          //     // we also need to get all the specials out of the weapons

          //     // return the final profile

          //   }
          // );

          // state.unitProfiles = [...unitProfiles];
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
