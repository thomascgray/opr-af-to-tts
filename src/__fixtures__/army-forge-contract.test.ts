import { describe, expect, it } from "vitest";
import { listFixtureFiles, readFixture } from "../test-helpers";

// Checks the saved Army Forge responses against the shapes the app reads. There is
// no published schema; when `npm run fixtures:refresh` pulls in data that fails here,
// Army Forge has changed shape and the code (and src/army-forge-types.ts) needs a look.

type Problems = string[];

const isNumericString = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" && !isNaN(Number(v));

const typeName = (v: unknown) =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v;

const check = (
  problems: Problems,
  path: string,
  value: unknown,
  ok: boolean,
  expected: string
) => {
  if (!ok) {
    problems.push(
      `${path}: expected ${expected}, got ${typeName(value)} ${JSON.stringify(
        value
      )?.slice(0, 80)}`
    );
  }
};

const LOADOUT_TYPES = [
  "ArmyBookWeapon",
  "ArmyBookItem",
  "ArmyBookRule",
  "ArmyBookDefense",
];

const checkRule = (p: Problems, path: string, rule: any) => {
  check(p, `${path}.name`, rule?.name, typeof rule?.name === "string", "string");
  check(
    p,
    `${path}.key`,
    rule?.key,
    rule?.key === undefined || typeof rule?.key === "string",
    "absent or string"
  );
  const r = rule?.rating;
  check(
    p,
    `${path}.rating`,
    r,
    r === undefined || r === null || typeof r === "number" || isNumericString(r),
    "absent, null, number or numeric string"
  );
};

const checkRuleArray = (p: Problems, path: string, rules: any) => {
  if (rules === undefined) return;
  if (!Array.isArray(rules)) {
    check(p, path, rules, false, "absent or array");
    return;
  }
  rules.forEach((r, i) => checkRule(p, `${path}[${i}]`, r));
};

const checkLoadoutEntry = (p: Problems, path: string, entry: any) => {
  check(
    p,
    `${path}.type`,
    entry?.type,
    LOADOUT_TYPES.includes(entry?.type),
    LOADOUT_TYPES.join(" | ")
  );
  check(p, `${path}.name`, entry?.name, typeof entry?.name === "string", "string");
  check(p, `${path}.count`, entry?.count, typeof entry?.count === "number", "number");
  checkRuleArray(p, `${path}.specialRules`, entry?.specialRules);
  if (entry?.content !== undefined) {
    if (!Array.isArray(entry.content)) {
      check(p, `${path}.content`, entry.content, false, "absent or array");
    } else {
      entry.content.forEach((c: any, i: number) => {
        const cPath = `${path}.content[${i}]`;
        checkRule(p, cPath, c);
        checkRuleArray(p, `${cPath}.specialRules`, c?.specialRules);
      });
    }
  }
};

const checkList = (list: any): Problems => {
  const p: Problems = [];
  check(p, "gameSystem", list.gameSystem, typeof list.gameSystem === "string", "string");
  check(p, "units", list.units, Array.isArray(list.units), "array");
  check(p, "specialRules", list.specialRules, Array.isArray(list.specialRules), "array");

  (list.units || []).forEach((u: any, i: number) => {
    const path = `units[${i}]`;
    for (const key of ["name", "selectionId", "id"]) {
      check(p, `${path}.${key}`, u[key], typeof u[key] === "string", "string");
    }
    for (const key of ["size", "quality", "defense", "xp"]) {
      check(p, `${path}.${key}`, u[key], typeof u[key] === "number", "number");
    }
    check(
      p,
      `${path}.joinToUnit`,
      u.joinToUnit,
      u.joinToUnit === null || typeof u.joinToUnit === "string",
      "string or null"
    );
    check(p, `${path}.combined`, u.combined, typeof u.combined === "boolean", "boolean");
    check(
      p,
      `${path}.customName`,
      u.customName,
      u.customName === undefined || typeof u.customName === "string",
      "absent or string"
    );
    check(
      p,
      `${path}.traits`,
      u.traits,
      u.traits === undefined ||
        (Array.isArray(u.traits) &&
          u.traits.every((t: unknown) => typeof t === "string")),
      "absent or array of strings"
    );
    checkRuleArray(p, `${path}.rules`, u.rules);
    if (!Array.isArray(u.loadout)) {
      check(p, `${path}.loadout`, u.loadout, false, "array");
    } else {
      u.loadout.forEach((l: any, j: number) =>
        checkLoadoutEntry(p, `${path}.loadout[${j}]`, l)
      );
    }
    (u.selectedUpgrades || []).forEach((su: any, j: number) => {
      check(
        p,
        `${path}.selectedUpgrades[${j}].option.gains`,
        su?.option?.gains,
        Array.isArray(su?.option?.gains),
        "array"
      );
    });
  });
  return p;
};

const checkCommonRules = (data: any): Problems => {
  const p: Problems = [];
  check(p, "rules", data.rules, Array.isArray(data.rules), "array");
  check(p, "traits", data.traits, Array.isArray(data.traits), "array");
  (data.traits || []).forEach((t: any, i: number) => {
    check(p, `traits[${i}].name`, t?.name, typeof t?.name === "string", "string");
    check(
      p,
      `traits[${i}].type`,
      t?.type,
      [0, 1, 2, 3].includes(t?.type),
      "0, 1, 2 or 3"
    );
  });
  return p;
};

const fixtures = listFixtureFiles().filter(
  (f) =>
    !f.endsWith(".synthetic.json") &&
    (/^tts-.+\.json$/.test(f) || /^common-rules-\d+\.json$/.test(f))
);

describe("Army Forge contract", () => {
  it("has fixtures to check", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it("reports the JSON path of a bad field", () => {
    const list = readFixture("tts-rzS5YWEN4vHF.json");
    list.units[4].loadout[1].content = [{ name: "Armor", rating: "two" }];
    expect(checkList(list)).toEqual([
      'units[4].loadout[1].content[0].rating: expected absent, null, number or numeric string, got string "two"',
    ]);
  });

  it.each(fixtures)("%s matches the shapes the app reads", (file) => {
    const data = readFixture(file);
    const problems = file.startsWith("tts-")
      ? checkList(data)
      : checkCommonRules(data);
    expect(problems.map((problem) => `${file} ${problem}`)).toEqual([]);
  });
});
