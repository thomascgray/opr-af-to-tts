import * as _ from "lodash";
import * as ArmyForgeTypes from "../army-forge-types";
import {
  eCampaignTraitCategory,
  iAppState,
  iUnitProfile,
  iUnitProfileModel,
  iUnitProfileModelTTSOutput,
} from "../types";
import { getModelNameForOutput, insertLineBreaksIntoString } from "./names";

type LoadoutEntry = iUnitProfileModel["loadout"][number];

// A rule as Army Forge sends it, wherever it was found (unit, item, item content)
type RawRule = Pick<ArmyForgeTypes.ISpecialRule, "name" | "key" | "rating"> & {
  type?: string;
  shouldHaveRatingInMainOutput?: boolean;
};

interface ActiveRule {
  name: string;
  definition: string;
  rating: ArmyForgeTypes.Rating | null | undefined;
  shouldHaveRatingInMainOutput?: boolean;
}

interface SummedRule extends Omit<ActiveRule, "rating"> {
  rating: number; // NaN when the rule has no rating
}

/**
 * How a rule is looked up in armySpecialRulesDict. The loadout path and the unit
 * path have always used different lookups; each keeps its own until someone checks
 * that one lookup gives the same output for both.
 * - keyThenName: case-insensitive on key, falling back to name
 * - exactName: case-sensitive on name
 */
type RuleMatchMode = "keyThenName" | "exactName";

const resolveRuleDefinition = (
  rule: RawRule,
  stateView: Readonly<iAppState>,
  matchMode: RuleMatchMode
): string => {
  const dict = stateView.armySpecialRulesDict;
  let specialRule: iAppState["armySpecialRulesDict"][number] | undefined;
  if (matchMode === "keyThenName") {
    specialRule = dict.find((sr) =>
      !_.isNil(rule.key)
        ? sr.name.toLowerCase() === rule.key.toLowerCase()
        : sr.name.toLowerCase() === rule.name.toLowerCase()
    );
    // if we've not found it, sometimes the keys are fucky. just search by name again and hope for the best
    if (_.isNil(specialRule)) {
      specialRule = dict.find(
        (sr) => sr.name.toLowerCase() === rule.name.toLowerCase()
      );
    }
  } else {
    specialRule = dict.find((sr) => sr.name === rule.name);
  }

  if (!specialRule?.description) {
    return "[[Rule description missing in Army Forge data!]]";
  }
  const referenced = findReferencedRules(
    specialRule.description,
    [rule.name, specialRule.name],
    dict
  );
  return [
    specialRule.description,
    ...referenced.map((sr) => `${sr.name}: ${sr.description}`),
  ].join("\n");
};

// Army Forge's tooltip appends the text of any rule a description names, e.g.
// "Takedown Strike" ends "...and Takedown." and the tooltip explains Takedown. It
// leaves out rules from the core rulebook (AP, Deadly), which showWhenReferenced
// tracks. Longer names are matched first and blanked out, so "Enhanced Hold the
// Line" doesn't also drag in "Hold the Line". One level deep only.
const findReferencedRules = (
  description: string,
  ownNames: string[],
  dict: Readonly<iAppState["armySpecialRulesDict"]>
) => {
  // first entry per name wins, same as the exactName lookup above
  const candidates = _.uniqBy(dict, "name")
    .filter(
      (sr) =>
        sr.showWhenReferenced &&
        !!sr.description &&
        !ownNames.includes(sr.name)
    )
    .sort((a, b) => b.name.length - a.name.length);

  let remaining = description;
  return candidates.filter((sr) => {
    const pattern = new RegExp(
      `(?<!\\w)${_.escapeRegExp(sr.name)}(?!\\w)`,
      "g"
    );
    if (!pattern.test(remaining)) return false;
    remaining = remaining.replace(pattern, " ");
    return true;
  });
};

const isCoreSpecialRule = (name: string, stateView: Readonly<iAppState>) =>
  stateView.coreSpecialRulesDict.some((csr) => csr.name === name);

// null when the output config hides this kind of rule (core or army)
const toActiveRule = (
  rule: RawRule,
  stateView: Readonly<iAppState>,
  matchMode: RuleMatchMode,
  shouldHaveRatingInMainOutput: boolean | undefined
): ActiveRule | null => {
  const isCore = isCoreSpecialRule(rule.name, stateView);
  if (!stateView.ttsOutputConfig.includeArmySpecialRules && !isCore) {
    return null;
  }
  if (!stateView.ttsOutputConfig.includeCoreSpecialRules && isCore) {
    return null;
  }
  return {
    name: `${rule.name}`,
    definition: resolveRuleDefinition(rule, stateView, matchMode),
    rating: rule.rating,
    shouldHaveRatingInMainOutput,
  };
};

const contentOf = (l: LoadoutEntry) => l.originalLoadout.content || [];

// Dedupes within one item only. The same rule can reach us twice through one item
// (in its content and again in that content's specialRules) and must count once,
// but two items that each grant Caster(1) must both count (bug B1: a Frog-Mage
// with Ancient Palanquin and Enlightened Mage is Caster(5), not Caster(4)).
const collectRulesFromLoadoutItem = (l: LoadoutEntry): RawRule[] =>
  _.uniqBy<RawRule>(
    [
      // the item's own special rules (weapons carry theirs here)
      ...(l.originalLoadout.specialRules || []),
      // the item's content THAT is a special rule
      ...contentOf(l)
        .filter(
          (c) => c.type === "ArmyBookRule" || c.type === "ArmyBookDefense"
        )
        .map((c) => ({ ...c, shouldHaveRatingInMainOutput: true })),
      // and the special rules nested inside each content entry
      ...contentOf(l).flatMap((c) => c.specialRules || []),
    ],
    (x) => x.key || x.name
  );

const collectLoadoutRules = (equippedLoadoutItems: LoadoutEntry[]): RawRule[] =>
  equippedLoadoutItems.flatMap(collectRulesFromLoadoutItem);

const collectUnitRules = (unit: iUnitProfile): RawRule[] =>
  _.uniqBy<RawRule>(
    unit.models.flatMap((m) => m.originalSpecialRules || []),
    (x) => x.key || x.name
  );

// Merges same-named rules, adding their ratings (Tough(3) + Tough(3) = Tough(6))
const sumRatings = (rules: ActiveRule[]): SummedRule[] => {
  const summed: SummedRule[] = [];
  rules.forEach((rule) => {
    const rating = parseInt(String(rule.rating));
    const existingIndex = summed.findIndex((x) => x.name === rule.name);
    if (existingIndex === -1) {
      summed.push({ ...rule, rating });
      return;
    }
    const existing = summed[existingIndex];
    if (existing.rating && rating) {
      summed[existingIndex] = { ...existing, rating: existing.rating + rating };
    }
  });
  return summed;
};

const totalRating = (rules: SummedRule[], name: string) =>
  rules
    .filter((sr) => sr.name === name)
    .reduce((total, sr) => total + sr.rating, 0);

// splits "Rifle (24'', A1), Pistol (12'', A1)" into { Rifle: "(24'', A1)", ... }
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
}

const buildWeaponsBlock = (
  equippedLoadoutItems: LoadoutEntry[],
  weaponColour: string
) => {
  // this should somehow include things like gundrones, where its an ITEM that gives you weapons.
  // item content weapons often have no stat line of their own, so look it up by
  // name in every equipped item's definition
  const fallbackDefinitionData = equippedLoadoutItems.reduce<
    Record<string, string>
  >(
    (acc, l) => ({ ...acc, ...parseString(l.definition.slice(1, -1)) }),
    {}
  );

  const contentWeapons = equippedLoadoutItems
    .flatMap(contentOf)
    .filter((c) => c.type === "ArmyBookWeapon")
    .map((ci) => {
      let { label, quantity } = ci;
      // if the quantity is null, then we're going to try to do a fallback lookup
      if (quantity == null) {
        label = fallbackDefinitionData[ci.name];
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
    });

  return [
    ...equippedLoadoutItems.filter(
      (l) => l.originalLoadout.type === "ArmyBookWeapon"
    ),
    ...contentWeapons,
  ]
    .map((w) => {
      if (w.quantity > 1) {
        return `[${weaponColour}]${w.quantity}x ${w.name}[-]
[sup]${w.definition}[/sup]`;
      } else {
        return `[${weaponColour}]${w.name}[-]
[sup]${w.definition}[/sup]`;
      }
    })
    .join("\r\n");
};

const buildRulesBlock = (
  rules: SummedRule[],
  stateView: Readonly<iAppState>,
  specialRulesColour: string
) =>
  rules
    .map((w) => {
      let name = w.name;
      if (w.rating && w.shouldHaveRatingInMainOutput) {
        name += ` (${w.rating})`;
      }
      const includeFullText = isCoreSpecialRule(w.name, stateView)
        ? stateView.ttsOutputConfig.includeFullCoreSpecialRulesText
        : stateView.ttsOutputConfig.includeFullArmySpecialRulesText;
      if (includeFullText) {
        return `[${specialRulesColour}]${name}[-]
[sup]${w.definition
          .split("\n")
          .map(insertLineBreaksIntoString)
          .join("\r\n")}[/sup]`;
      }
      return `[${specialRulesColour}]${name}[-]`;
    })
    .join("\r\n");

// Campaign traits block: 4 categories in fixed order. Per-category master toggles
// AND per-trait includeInOutput flags must both be on. Global includeCampaignTraits
// suppresses the entire block.
const buildCampaignBlock = (
  model: iUnitProfileModel,
  stateView: Readonly<iAppState>,
  campaignColour: string
) => {
  if (!stateView.ttsOutputConfig.includeCampaignTraits) return "";
  const traits = model.campaignTraits || [];
  if (traits.length === 0) return "";

  const categoryOrder: {
    category: eCampaignTraitCategory;
    configFlag: keyof iAppState["ttsOutputConfig"];
  }[] = [
    {
      category: eCampaignTraitCategory.SKILL_SET,
      configFlag: "includeCampaignSkillSets",
    },
    {
      category: eCampaignTraitCategory.TRAIT,
      configFlag: "includeCampaignTraitsCategory",
    },
    {
      category: eCampaignTraitCategory.INJURY,
      configFlag: "includeCampaignInjuries",
    },
    {
      category: eCampaignTraitCategory.TALENT,
      configFlag: "includeCampaignTalents",
    },
  ];

  return categoryOrder
    .map(({ category, configFlag }) => {
      if (!stateView.ttsOutputConfig[configFlag]) return "";
      const inCategory = traits.filter(
        (t) => t.category === category && t.includeInOutput
      );
      if (inCategory.length === 0) return "";
      return inCategory
        .map((t) => {
          const header = `[${campaignColour}]Campaign Trait - ${t.name}[-]`;
          if (!stateView.ttsOutputConfig.includeCampaignTraitsFullText) {
            return header;
          }
          return `${header}
[sup]${insertLineBreaksIntoString(t.description)}[/sup]`;
        })
        .join("\r\n");
    })
    .filter((x) => x !== "")
    .join("\r\n");
};

// The comma-separated rules list for the name field. It reads the whole loadout,
// not only equipped items, and doesn't merge ratings.
const buildNameLineRulesList = (model: iUnitProfileModel) =>
  [
    ...model.originalSpecialRules,
    ...model.loadout
      .filter((l) => l.originalLoadout.type === "ArmyBookItem")
      .flatMap((l): RawRule[] => [
        ...l.originalLoadout.content!,
        ...l.originalLoadout.content!.flatMap((c) => c.specialRules || []),
      ]),
  ]
    .map((sr) => {
      if (sr.rating) {
        return `${sr.name}(${sr.rating})`;
      }
      return sr.name;
    })
    .join(", ");

const buildNameLines = (
  modelNameString: string,
  model: iUnitProfileModel,
  activeWeaponNamesCommaSeparated: string,
  stateView: Readonly<iAppState>,
  colours: { qua: string; def: string; weapon: string; specialRules: string }
) =>
  [
    modelNameString,
    `[${colours.qua}][b]Q${model.qua}[/b]+[-] / [${colours.def}][b]D${model.def}[/b]+[-]`,
    stateView.ttsOutputConfig.includeWeaponsListInName
      ? `[sup][${colours.weapon}]${activeWeaponNamesCommaSeparated}[-][/sup]`
      : "",
    stateView.ttsOutputConfig.includeSpecialRulesListInName
      ? `[sup][${colours.specialRules}]${buildNameLineRulesList(
          model
        )}[-][/sup]`
      : "",
  ].filter((x) => x !== "");

const stripSmallText = (s: string) =>
  s.replace(/\[sup\]/g, "").replace(/\[\/sup\]/g, "");

const normaliseQuotes = (s: string) =>
  s.replace(/[’]/g, "'").replace(/[”]/g, "''").replace(/["]/g, "''");

// this is absolutely atrocious lmao, forgive me
export const generateUnitOutput = (
  unit: iUnitProfile,
  model: iUnitProfileModel,
  stateView: Readonly<iAppState>
): iUnitProfileModelTTSOutput => {
  const config = stateView.ttsOutputConfig;
  const colours = {
    weapon: config.modelWeaponOutputColour.replace("#", ""),
    specialRules: config.modelSpecialRulesOutputColour.replace("#", ""),
    qua: config.modelQuaOutputColour.replace("#", ""),
    def: config.modelDefOutputColour.replace("#", ""),
    campaign: config.modelCampaignStuffOutputColour.replace("#", ""),
  };
  const equippedLoadoutItems = model.loadout.filter((w) => w.quantity > 0);

  let modelNamePlainWithLoudoutString = getModelNameForOutput(
    unit,
    model,
    config
  );
  let modelNameString = `[b]${modelNamePlainWithLoudoutString}[/b]`;
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

  const activeRules = [
    ...collectLoadoutRules(equippedLoadoutItems).map((x) =>
      toActiveRule(x, stateView, "keyThenName", x.shouldHaveRatingInMainOutput)
    ),
    ...collectUnitRules(unit).map((x) =>
      toActiveRule(x, stateView, "exactName", true)
    ),
  ].filter((x): x is ActiveRule => x !== null);

  const summedRules = sumRatings(_.sortBy(activeRules, "name"));

  // we COULD add up all the extra Defense, but Army Forge DOESNT do that, so i think it might prove confusing?
  // e.g army forge DOES add up all the extra Tough, but not Defense

  const activeWeaponNamesCommaSeparated = equippedLoadoutItems
    .map((x) => {
      if (x.quantity > 1) {
        return `${x.quantity}x ${x.name}`;
      }
      return `${x.name}`;
    })
    .join(", ");

  const campaignXpBBCode =
    config.includeCampaignXp && (model.xp || 0) > 0
      ? `[${colours.campaign}]Campaign XP: ${model.xp}[-]`
      : "";

  let nameLines = buildNameLines(
    `${modelNameString}`,
    model,
    activeWeaponNamesCommaSeparated,
    stateView,
    colours
  );
  let descriptionFieldLines: string[] = [
    buildWeaponsBlock(equippedLoadoutItems, colours.weapon),
    buildRulesBlock(summedRules, stateView, colours.specialRules),
    buildCampaignBlock(model, stateView, colours.campaign),
    campaignXpBBCode,
  ];

  // loop through everything and remove all the small text
  if (config.disableSmallText) {
    nameLines = nameLines.map(stripSmallText);
    descriptionFieldLines = descriptionFieldLines.map(stripSmallText);
  }

  return {
    name: `${modelNamePlainWithLoudoutString}`, // this is the MODEL name
    loadoutCSV: normaliseQuotes(activeWeaponNamesCommaSeparated),
    ttsNameOutput: nameLines.filter((x) => x !== "").join("\r\n"),
    ttsDescriptionOutput: normaliseQuotes(
      descriptionFieldLines.filter((x) => x !== "").join("\r\n")
    ),
    originalToughValue: totalRating(summedRules, "Tough"),
    originalCasterValue: totalRating(summedRules, "Caster"),
  };
};
