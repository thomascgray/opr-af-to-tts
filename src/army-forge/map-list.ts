import * as _ from "lodash";
import pluralize from "pluralize";
import { nanoid } from "nanoid";
import * as ArmyForgeTypes from "../army-forge-types";
import {
  eCampaignTraitCategory,
  iAppState,
  iCampaignTraitOnModel,
  iUnitProfile,
  iUnitProfileModel,
} from "../types";

export interface MappedArmyList {
  unitProfiles: iUnitProfile[];
  armySpecialRulesDict: iAppState["armySpecialRulesDict"];
  coreSpecialRulesDict: iAppState["coreSpecialRulesDict"];
  campaignTraitsDict: ArmyForgeTypes.ICommonRuleTrait[];
  listName: string;
  gameSystem: ArmyForgeTypes.eGameSystemInitials;
}

export const getCampaignTraitCategory = (
  trait: ArmyForgeTypes.ICommonRuleTrait | undefined
): eCampaignTraitCategory => {
  if (!trait) return eCampaignTraitCategory.TRAIT;
  switch (trait.type) {
    case 1:
      return eCampaignTraitCategory.INJURY;
    case 2:
      return eCampaignTraitCategory.TALENT;
    case 3:
      return eCampaignTraitCategory.SKILL_SET;
    default:
      return eCampaignTraitCategory.TRAIT;
  }
};

export const removeQuantityStringFromStartOfString = (str: string) => {
  if (/^\dx /.test(str)) {
    return str.substring(2);
  } else {
    return str;
  }
};

export const generateLoadoutItemDefinition = (
  loadoutItem: ArmyForgeTypes.IUpgradeGains
) => {
  if (loadoutItem.type === "ArmyBookItem") {
    let label = loadoutItem.label;
    if (label == null) {
      // for some reason, sometimes things dont have labels. if thats the case, try and build it from the raw content, just smashing together names
      label = loadoutItem.content!.map((c) => c.name).join(", ");
      label = `(${label})`;
    }
    return label.replace(loadoutItem.name, "").trim();
  }

  // ArmyBookWeapon, ArmyBookRule and ArmyBookDefense share the stat-line format
  const chunks: string[] = [];
  if (loadoutItem.range) {
    chunks.push(`${loadoutItem.range}''`);
  }
  if (loadoutItem.attacks) {
    chunks.push(`A${loadoutItem.attacks}`);
  }
  (loadoutItem.specialRules || []).forEach((sr) => {
    let srString = `${sr.name}`;
    if (sr.rating) {
      srString += `(${sr.rating})`;
    }
    chunks.push(srString);
  });
  return `(${chunks.join(", ")})`;
};

export const generateOriginalLoadoutCsvHelperString = (
  unit: ArmyForgeTypes.ISelectedUnit
) => {
  const baseChunks = unit.loadout.map((l) => {
    return `${l.count}x ${l.name}`;
  });
  unit.selectedUpgrades
    .filter((su) => {
      return (
        su.option.gains.length === 1 &&
        su.option.gains[0].type === "ArmyBookRule"
      );
    })
    .forEach((su) => {
      baseChunks.push(`1x ${pluralize.singular(su.option.label)}`);
    });

  return baseChunks.join(", ");
};

/**
 * As of 08/06/2024 it seems like we dont need to do this?
 * OK, more testing - without this the DAO Shield drones aren't working. so we DO need this... in some capcity
 * basically, i think we need to add the upgrade to the loadout if its NOT a weapon, and its not already in the loadout
 * that leaves things like special rules (DAO Shield Drones) and Items (DAO Gun drones)
 *
 */

/**
 * 29/07/2024
 * ok so see https://github.com/thomascgray/opr-af-to-tts/issues/47 but tl;dr theres 2 kinds of upgrades?
 * (see the screenshot we added on the issue) and the typescript types were a bit fucked
 * basically, the originalLoadout below, it turns out sometimes DOESNT have ids??? and also sometimes doesnt event have a KEY?!
 * so we try and do id, then key, then name
 * this is obviously a hack but the types just seem fucked? i think dno im working this out at 1am lol
 * but anyway, the original bug was because `undefined` was matching `undefined` inside the idsAlreadyInLoadout
 * i also renamed idsAlreadyInLoadout to identifiersAlreadyInLoadout because lets be sensible
 */
export const mergeSelectedUpgradesIntoLoadout = (
  unit: ArmyForgeTypes.ISelectedUnit,
  loadout: iUnitProfileModel["loadout"]
) => {
  const identifiersAlreadyInLoadout = loadout.map((li) =>
    li.originalLoadout.id
      ? li.originalLoadout.id
      : li.originalLoadout.key
      ? li.originalLoadout.key
      : li.originalLoadout.name
  );

  unit.selectedUpgrades.forEach((su) => {
    su.option.gains.forEach((g) => {
      // if we already have the thing in loadout, or if its a weapon, we don't need to add it
      if (
        identifiersAlreadyInLoadout.includes(
          g.id ? g.id : g.key ? g.key : g.name
        ) ||
        g.type === "ArmyBookWeapon"
      ) {
        // maaaaaybe we need to do something with quantity here?
      } else {
        loadout.push({
          id: nanoid(),
          includeInName: false,
          name: pluralize.singular(g.label),
          definition: "",
          quantity: 1,
          // this originalLoadout is a bit of a hack, and makes things get added up.
          // it has no type or name, only the option's gains as `content`
          originalLoadout: {
            content: su.option.gains,
          } as ArmyForgeTypes.IUpgradeGains,
        });
      }
    });
  });
};

const mapUnit = (
  unit: ArmyForgeTypes.ISelectedUnit,
  campaignTraitsDict: ArmyForgeTypes.ICommonRuleTrait[]
): iUnitProfile => {
  const unitProfile: iUnitProfile = {
    id: nanoid(),
    originalName: unit.name,
    originalModelCountInUnit: unit.size,
    customName: unit.customName,
    originalSelectionId: unit.selectionId,
    originalJoinToUnit: unit.joinToUnit,
    originalLoadoutCsvHelperString: generateOriginalLoadoutCsvHelperString(unit),
    customNameSingular: unit.customName
      ? pluralize.singular(unit.customName)
      : undefined,
    originalUnit: unit,
    models: [
      {
        id: nanoid(),
        isGenerated: true,
        xp: unit.xp || 0,
        campaignTraits: (unit.traits || []).map(
          (traitName): iCampaignTraitOnModel => {
            const dictEntry = campaignTraitsDict.find(
              (t) => t.name.toLowerCase() === traitName.toLowerCase()
            );
            return {
              id: nanoid(),
              name: traitName,
              category: getCampaignTraitCategory(dictEntry),
              skillSet: dictEntry?.skillSet ?? undefined,
              description:
                dictEntry?.description ||
                "[[Campaign trait description missing in Army Forge data!]]",
              includeInOutput: true,
              originalTrait: dictEntry,
            };
          }
        ),
        name: pluralize.singular(
          removeQuantityStringFromStartOfString(unit.name).trim()
        ),
        originalName: unit.name,
        qua: parseInt(String(unit.quality)),
        def: parseInt(String(unit.defense)),
        originalSpecialRules: unit.rules || [],
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

  mergeSelectedUpgradesIntoLoadout(unit, unitProfile.models[0].loadout);

  return unitProfile;
};

/**
 * Turns an Army Forge list plus its game system's common rules into the app's
 * own data. Pure apart from nanoid ids.
 */
export const mapArmyForgeListToUnitProfiles = (
  list: ArmyForgeTypes.ListState,
  commonRules: ArmyForgeTypes.ICommonRulesResponse
): MappedArmyList => {
  const coreSpecialRulesDict = [...commonRules.rules];
  const campaignTraitsDict = commonRules.traits || [];

  return {
    listName: list.name,
    gameSystem: list.gameSystem,
    coreSpecialRulesDict,
    campaignTraitsDict,
    armySpecialRulesDict: [
      ...coreSpecialRulesDict,
      ...list.specialRules.map((sr) => ({ ...sr })),
    ],
    unitProfiles: _.sortBy(list.units, ["sortId"]).map((unit) =>
      mapUnit(unit, campaignTraitsDict)
    ),
  };
};
