import { eGameSystemInitials } from "./army-forge-types";

export const getUrlSlugForGameSystem = (
  gameSystemInitials: eGameSystemInitials
) => {
  switch (gameSystemInitials) {
    case eGameSystemInitials.GF:
      return "grimdark-future";
    case eGameSystemInitials.GFF:
      return "grimdark-future-firefight";
    case eGameSystemInitials.AOF:
      return "age-of-fantasy";
    case eGameSystemInitials.AOFS:
      return "age-of-fantasy-skirmish";
    case eGameSystemInitials.AOFR:
      return "age-of-fantasy-regiments";
  }
};
