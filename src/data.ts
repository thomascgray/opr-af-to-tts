export const coreSpecialRules = [
  {
    name: "Aircraft",
    description:
      "This model doesn't physically interact with other models and terrain, can't seize objectives, and can't be moved into contact with. Units targeting aircraft get -12'' range and -1 to hit rolls. When activated, this model must always move 18''-36'' in a straight line (without turning), and if it goes off-table, then its activation ends, and it must be placed on any table edge again.",
  },
  {
    name: "Ambush",
    description:
      "This model may be kept in reserve instead of deploying. At the start of any round after the first, you may place the model anywhere, over 9'' away from enemy units. If both player have Ambush, they roll-off to see who deploys first, and then alternate in placing them.",
    shortDescription:
      "May be kept in reserve instead of deploying, and then deployed at the start of any round after the first (at least 9'' away from enemy units).",
  },
  {
    name: "AP",
    description: "Targets get -X to Defense rolls when blocking hits.",
  },
  {
    name: "Artillery",
    description: "Counts as having Defense 2+ against shooting attacks",
  },
  {
    name: "Blast",
    description:
      "Ignores cover and multiplies hits by X, but can't deal more than one hit per model in the target unit.",
  },
  {
    name: "Deadly",
    description:
      "Assign each wound to one model, and multiply it by X. Note that these wounds don't carry over to other models if the target is killed.",
  },
  {
    name: "Fast",
    description:
      "Moves +2'' when using Advance, and +4'' when using Rush/Charge.",
  },
  {
    name: "Fear",
    description:
      "Always counts as having dealt +D3 wounds when checking who won melee.",
  },
  {
    name: "Fearless",
    description: "Gets +1 to morale tests.",
  },
  {
    name: "Flying",
    description:
      "May move through all obstacles, and may ignore terrain effects.",
  },
  {
    name: "Furious",
    description: "Gets +1 attack with a weapon of your choice when charging.",
  },
  {
    name: "Hero",
    description:
      "May be deployed as part of one friendly unit, which may use its Quality value for morale tests. When taking hits, you must use the unit's Defense value, until all non-hero models are killed.",
    shortDescription:
      "May be deployed as part of a unit, which may then use this model's Quality value for morale tests.",
  },
  {
    name: "Immobile",
    description: "May only use Hold actions.",
  },
  {
    name: "Impact",
    description:
      "Deals X melee hits when charging (must be in striking range).",
  },
  {
    name: "Indirect",
    description:
      "May target enemies that are not in line of sight, and ignores cover from sight obstructions, but gets -1 to hit rolls when shooting after moving.",
  },
  {
    name: "Lock-On",
    description: "Ignores all negative modifiers to hit rolls and range.",
  },
  {
    name: "Phalanx",
    description:
      "Enemies charging units where all models have this rule don't count as having charged (for special rules), and they must take a dangerous terrain test before attacking (only roll up to as many dice as models with phalanx).",
  },
  {
    name: "Poison",
    description: "Unmodified results of 6 to hit are multiplied by 3.",
  },
  {
    name: "Psychic",
    description:
      "May cast one spell during its activation, at any point before attacking. Pick a spell and a target in line of sight, and roll D6+X. If the result is equal or higher than the number in brackets, you may resolve the effects. Enemy psychics within 18'' and line of sight of the caster may roll D6+X at the same time, and if the result is higher the spell is blocked. Psychics may only either try to cast or try to block a spell each round.",
    shortDescription:
      "May cast one spell during its activation, at any point before attacking. See Psychic rule for details.",
  },
  {
    name: "Regeneration",
    description: "When taking a wound, roll one die. On a 5+ it is ignored.",
  },
  {
    name: "Relentless",
    description:
      "For each unmodified roll of 6 to hit when shooting, this model may roll 1 extra attack. This rule doesn't apply to newly generated attacks.",
  },
  {
    name: "Rending",
    description:
      "Unmodified results of 6 to hit count as having AP(4), and ignore the regeneration rule.",
  },
  {
    name: "Scout",
    description:
      "This model may be deployed after all other units, and may then move by up to 12'', ignoring terrain. If both of the players have Scout, they roll-off to see who deploys first, and then alternate in placing and moving them.",
    shortDescription:
      "May be deployed after all other units, and may then move by up to 12'', ignoring terrain.",
  },
  {
    name: "Slow",
    description:
      "Moves -2'' when using Advance, and -4'' when using Rush/Charge.",
  },
  {
    name: "Sniper",
    description:
      "Shoots at Quality 2+, and may pick one model in a unit as its target, which is resolved as if it's a unit of 1.",
  },
  {
    name: "Stealth",
    description: "Enemies get -1 to hit rolls when shooting at this unit.",
  },
  {
    name: "Strider",
    description: "This model may ignore the effects of difficult terrain.",
  },
  {
    name: "Tough",
    description:
      "This model must take X wounds before being killed. If a model with tough joins a unit without it, then it is removed last when the unit takes wounds. Note that you must continue to put wounds on the tough model with most wounds in the unit until it is killed, before starting to put them on the next tough model (heroes must be assigned wounds last).",
    shortDescription: "This model takes X wounds before being killed.",
  },
  {
    name: "Transport",
    description:
      "May transport up to X other models. Units embark by moving into contact, and may use any action to disembark, but only move by up to 6''. Units may also be deployed inside of a transport. If a unit is inside a transport when it is destroyed, then it takes a dangerous terrain test, is immediately Pinned, and surviving models must be placed within 6'' of the transport before it is removed.",
  },
  {
    name: "Wizard",
    description:
      "May cast one spell during its activation, at any point before attacking. Pick a spell and a target in line of sight, and roll D6+X. If the result is equal or higher than the number in brackets, you may resolve the effects. Enemy wizards within 18'' and line of sight of the caster may roll D6+X at the same time, and if the result is higher the spell is blocked. Wizards may only either try to cast or try to block a spell each round.",
    shortDescription:
      "May cast one spell during its activation, at any point before attacking. See Wizard rule for details.",
  },
];
