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

  const t = (key: string, links?: string[]) => {
    let val = _.get(currentLanguage, key);
    if (!val) {
      return "[[MISSING TRANSLATION]]";
    }
    if (links && links.length > 0) {
      // Replace each {{linkN}}...{{/linkN}} with an actual link
      links.forEach((url, index) => {
        const openTag = `{{link${index + 1}}}`;
        const closeTag = `{{/link${index + 1}}}`;
        const linkHtml = `<a class="text-blue-700 underline dark:text-blue-400 visited:text-purple-700 dark:visited:text-purple-400" href="${url}" target="_blank" rel="noopener noreferrer">`;
        const closingTag = "</a>";

        // Find the text between the opening and closing tags
        const regex = new RegExp(`${openTag}(.*?)${closeTag}`);
        val = val.replace(regex, `${linkHtml}$1${closingTag}`);
      });
    }

    return val;
  };

  return {
    currentLanguageId,
    currentLanguage,
    t,
  };
};
