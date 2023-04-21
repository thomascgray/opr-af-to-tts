export interface ListState {
  creationTime: string;
  name: string;
  pointsLimit?: number;
  units: ISelectedUnit[];
  undoUnitRemove?: ISelectedUnit[];
  selectedUnitId?: string;
  points: number;
  unitPreview?: ISelectedUnit;
  campaignMode?: boolean;
  competitive?: boolean;
  id?: string;
  key?: string;
  gameSystem: string;
}

export interface ISpecialRule {
  key: string;
  name: string;
  rating: string;
  condition?: string;
  modify?: boolean;
}

export interface IGroupedSpecialRule extends ISpecialRule {
  count?: number;
}

export interface IUnit {
  id: string;
  armyId: string;
  sortId: number;
  category?: string;
  name: string;
  size: number;
  cost: number;
  quality: string;
  defense: string;
  specialRules?: ISpecialRule[];
  upgrades: string[];
  equipment: IUpgradeGains[]; // IUpgradeGainsWeapon[]; //IEquipment[];
  disabledUpgradeSections: string[];
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
  joinToUnit?: string;
  xp: number;
  traits: string[]; // Trait names only
  notes: string;
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

export interface IUpgradeGains {
  id: string;
  name: string;
  label: string;
  count: number;
  originalCount: number;
  type: "ArmyBookRule" | "ArmyBookWeapon" | "ArmyBookItem" | "ArmyBookDefense"; // TODO: Add these
  dependencies?: IUpgradeDependency[];
  attacks?: number;
  specialRules?: IUpgradeGainsRule[];
  isModel?: boolean;
}

export interface IUpgradeGainsItem extends IUpgradeGains {
  content: IUpgradeGains[];
}

export interface IUpgradeGainsWeapon extends IUpgradeGains {
  type: "ArmyBookWeapon";
  attacks: number;
  range: number;
  specialRules: IUpgradeGainsRule[];
}

export interface IUpgradeGainsRule extends IUpgradeGains {
  type: "ArmyBookRule" | "ArmyBookDefense";
  key: string;
  condition: string;
  modify: boolean; // ?
  rating: string;
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
