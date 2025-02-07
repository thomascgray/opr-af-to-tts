import useLocalStorageState from "use-local-storage-state";
import { i18n } from "./i18n";
import * as _ from "lodash";
export const usei18n = () => {
  const [currentLanguageId] = useLocalStorageState(
    "tombolaopraftotts_currentLanguage",
    {
      defaultValue: "en",
    }
  );

  //   @ts-ignore
  const currentLanguage = i18n[currentLanguageId];

  const t = (key: string) => {
    const val = _.get(currentLanguage, key);
    if (val) {
      return val;
    }
    return "[[MISSING TRANSLATION]]";
  };

  return {
    currentLanguageId,
    currentLanguage,
    t,
  };
};
