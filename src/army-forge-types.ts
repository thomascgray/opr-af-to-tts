export enum eGameSystemInitials {
  GF = "gf",
  GFF = "gff",
  AOF = "aof",
  AOFS = "aofs",
  AOFR = "aofr",
}

// These types describe the /api/tts and /api/rules/common/<n> responses. There is no
// published schema. The fields the app reads are checked against live data by
// src/__fixtures__/army-forge-contract.test.ts; keep the two in step.

// 3.6 sends ratings as numbers; older data sent numeric strings
export type Rating = string | number;

export interface ListState {
  creationTime?: string;
  name: string;
  pointsLimit?: number;
  units: ISelectedUnit[];
  specialRules: IArmySpecialRule[];
  undoUnitRemove?: ISelectedUnit[];
  selectedUnitId?: string;
  points?: number;
  unitPreview?: ISelectedUnit;
  campaignMode?: boolean;
  competitive?: boolean;
  id?: string;
  key?: string;
  // a string outside eGameSystemInitials is possible: army books also list
  // game systems 7 to 10 (Quest / Star Quest), which the app doesn't map
  gameSystem: eGameSystemInitials;
}

export interface IArmySpecialRule {
  id?: string;
  name: string;
  description: string;
}

export interface ISpecialRule {
  id?: string;
  key?: string; // gone from 3.6 data, present in older lists
  name: string;
  rating?: Rating | null;
  label?: string;
  type?: string; // rules inside a weapon's specialRules carry "ArmyBookRule"
  condition?: string;
  modify?: boolean;
}

export interface IGroupedSpecialRule extends ISpecialRule {
  count?: number;
}

export interface IUnit {
  id: string;
  armyId: string;
  sortId?: number; // not in 3.6 data; the stable sort keeps list order
  category?: string;
  name: string;
  size: number;
  cost: number;
  quality: number;
  defense: number;
  rules?: ISpecialRule[];
  upgrades: string[];
  weapons: IUpgradeGains[]; // IUpgradeGainsWeapon[]; //IEquipment[];
  disabledUpgradeSections?: string[];
}
export interface IUnitSelectionData {
  selectionId: string;
  customName?: string;
  selectedUpgrades: {
    instanceId: string;
    upgrade: IUpgrade;
    option: IUpgradeOption;
  }[];
  loadout: IUpgradeGains[];
  combined: boolean;
  joinToUnit: string | null;
  xp: number;
  traits?: string[]; // Trait names only
  notes: string | null;
}

export interface ISelectedUnit extends IUnit, IUnitSelectionData {}

type UpgradeType = "replace" | "upgrade" | "upgradeRule" | "attachment";

export interface IUpgrade {
  //id: string;
  uid: string;
  label?: string;
  type: UpgradeType;
  affects?: "any" | "all" | number;
  select?: string | number;
  replaceWhat?: string[];
  model?: boolean;
  attachment?: boolean;
  attachModel?: boolean;
  options?: IUpgradeOption[];
  isCommandGroup: boolean;
  isHeroUpgrade?: boolean;
}

export interface IUpgradeOption {
  id: string;
  parentSectionId: string;
  cost: number;
  label: string;
  isModel?: boolean;
  gains: IUpgradeGains[]; // IEquipment[] | ISpecialRule[];
  replacedWhat?: string[];
  type: "ArmyBookUpgradeOption";
}

export type UpgradeGainsType =
  | "ArmyBookRule"
  | "ArmyBookWeapon"
  | "ArmyBookItem"
  | "ArmyBookDefense";

// One shape for loadout entries, upgrade gains and the `content` of items, since
// Army Forge nests them freely (an item's content holds weapons and rules)
export interface IUpgradeGains {
  name: string;
  label: string;
  count: number;
  originalCount?: number;
  type: UpgradeGainsType;
  dependencies?: IUpgradeDependency[];
  range?: number;
  attacks?: number;
  rating?: Rating | null;
  specialRules?: ISpecialRule[];
  content?: IUpgradeGains[];
  quantity?: number | null;
  isModel?: boolean;
  id?: string; // the fact this can be undefined is from my testing
  key?: string; // and the fact this is here at all is the same
}

export interface IUpgradeGainsItem extends IUpgradeGains {
  type: "ArmyBookItem";
  content: IUpgradeGains[];
}

export interface IUpgradeGainsWeapon extends IUpgradeGains {
  type: "ArmyBookWeapon";
  attacks: number;
  range: number;
  specialRules: ISpecialRule[];
}

export interface IUpgradeGainsRule extends IUpgradeGains {
  type: "ArmyBookRule" | "ArmyBookDefense";
  condition?: string;
  modify?: boolean;
}
export interface IUpgradePackage {
  hint: string;
  uid: string;
  sections: IUpgrade[];
}

export interface IUpgradeDependency {
  upgradeInstanceId: string;
  count: number;
  type: UpgradeType;
}

export interface ICommonRule {
  id: string;
  name: string;
  description: string;
  hasRating?: boolean; // gone from 3.6 data
}

export interface ICommonRulesResponse {
  rules: ICommonRule[];
  traits?: ICommonRuleTrait[];
}

// Campaign-mode traits from /api/rules/common/<n> → `traits` array.
// Response carries many null-heavy fields (aliasedRuleId, archived, category, coreType,
// costFormula, defaultRating, enabledGameSystems, generation, hasRating, params,
// rangedWoundFormula, ratingValues, replaceWith, ruleGenEnabled, ruleType, tags, targetType,
// variants, weaponWeight, weight, woundFormula) — ignored here, add as optional if ever needed.
export interface ICommonRuleTrait {
  id: string;
  name: string;
  description: string;
  type: 0 | 1 | 2 | 3; // 0=Trait, 1=Injury, 2=Talent, 3=Skill Set
  skillSet?: string | null;
  campaign: boolean;
}
