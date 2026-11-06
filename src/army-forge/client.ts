import {
  eGameSystemInitials,
  ICommonRulesResponse,
  ListState,
} from "../army-forge-types";

// to get the data hit https://army-forge.onepagerules.com/api/rules/common/3 where the number is the game system. ask Adam @ army forge for the right one
export const COMMON_RULES_ID_BY_GAME_SYSTEM: Record<eGameSystemInitials, number> =
  {
    [eGameSystemInitials.GF]: 2,
    [eGameSystemInitials.GFF]: 3,
    [eGameSystemInitials.AOF]: 4,
    [eGameSystemInitials.AOFS]: 5,
    [eGameSystemInitials.AOFR]: 6,
  };

export const extractIdFromUrl = (
  url: string
): { id: string | null; isBeta: boolean } => {
  const idMatch = /id=([^&]+)/.exec(url);
  return {
    id: idMatch ? idMatch[1] : null,
    isBeta: url.includes("army-forge-beta.onepagerules.com"),
  };
};

export type ArmyForgeErrorKind =
  | "listFailed"
  | "commonRulesFailed"
  // get-army answered 502 UPSTREAM_UNAVAILABLE: Army Forge is down or sent HTML
  | "upstreamUnavailable"
  | "unsupportedGameSystem";

/**
 * A failed request the user should hear about. `upstreamMessage` is the `error`
 * field from the get-army function, shown as-is when present.
 */
export class ArmyForgeError extends Error {
  constructor(
    public readonly kind: ArmyForgeErrorKind,
    public readonly upstreamMessage?: string,
    public readonly isBeta = false
  ) {
    super(upstreamMessage || kind);
    this.name = "ArmyForgeError";
  }
}

export class UnsupportedGameSystemError extends ArmyForgeError {
  constructor(public readonly gameSystem: string) {
    super("unsupportedGameSystem");
    this.name = "UnsupportedGameSystemError";
  }
}

// must match netlify/functions/get-army
const UPSTREAM_UNAVAILABLE = "UPSTREAM_UNAVAILABLE";

const getJson = async (
  url: string,
  kind: ArmyForgeErrorKind,
  isBeta: boolean
) => {
  const response = await fetch(url);
  const data = await response.json();
  if (data?.code === UPSTREAM_UNAVAILABLE) {
    throw new ArmyForgeError("upstreamUnavailable", data.error, isBeta);
  }
  if (response.status !== 200 || !data || data.error) {
    throw new ArmyForgeError(kind, data?.error, isBeta);
  }
  return data;
};

export const fetchArmyList = (id: string, isBeta: boolean): Promise<ListState> =>
  getJson(
    `/.netlify/functions/get-army?armyId=${id}&isBeta=${isBeta}`,
    "listFailed",
    isBeta
  );

export const getCommonRulesId = (gameSystem: string): number | undefined =>
  Object.prototype.hasOwnProperty.call(COMMON_RULES_ID_BY_GAME_SYSTEM, gameSystem)
    ? COMMON_RULES_ID_BY_GAME_SYSTEM[gameSystem as eGameSystemInitials]
    : undefined;

export const fetchCommonRules = (
  gameSystem: eGameSystemInitials,
  isBeta: boolean
): Promise<ICommonRulesResponse> => {
  const commonRulesId = getCommonRulesId(gameSystem);
  if (commonRulesId === undefined) {
    // army books also list systems 7 to 10 (Quest / Star Quest); asking for
    // commonRulesId=undefined used to end in a vague 500
    return Promise.reject(new UnsupportedGameSystemError(gameSystem));
  }
  return getJson(
    `/.netlify/functions/get-army?commonRulesId=${commonRulesId}&isBeta=${isBeta}`,
    "commonRulesFailed",
    isBeta
  );
};
