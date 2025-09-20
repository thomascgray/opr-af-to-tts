import useLocalStorageState from "use-local-storage-state";
import {
  BrazilFlag,
  GermanyFlag,
  PolandFlag,
  TürkiyeFlag,
  UnitedKingdomFlag,
} from "./icons";
import { useState } from "react";
import classNames from "classnames";

const LANGUAGES = [
  {
    id: "en",
    flag: () => <UnitedKingdomFlag />,
  },
  {
    id: "de",
    flag: () => <GermanyFlag />,
  },
  {
    id: "pl",
    flag: () => <PolandFlag />,
  },
  {
    id: "pt-br",
    flag: () => <BrazilFlag />,
  },
  {
    id: "tr",
    flag: () => <TürkiyeFlag />,
  },
];

const RenderFlagBadge = ({ id, flag }: { id: string; flag: any }) => {
  return (
    <span className="flex gap-3 items-center">
      {flag()}
      <span className="font-bold uppercase">{id}</span>
    </span>
  );
};

export const LanguagePicker = () => {
  const [currentLanguageId, setCurrentLanguageId] =
    useLocalStorageState<string>("tombolaopraftotts_currentLanguage", {
      defaultValue: "en",
    });

  const currentLanguage = LANGUAGES.find((l) => l.id === currentLanguageId)!;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative min-w-[120px] h-[32px] flex flex-col">
      <div className="flex flex-col gap-2 text-white absolute top-0 right-0">
        {!isExpanded && (
          <button
            onClick={() => {
              setIsExpanded(true);
            }}
            className="bg-stone-400 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 px-2 py-1 min-w-[120px] flex justify-around rounded-md shadow-md"
          >
            <RenderFlagBadge
              id={currentLanguage.id}
              flag={currentLanguage.flag}
            />
          </button>
        )}

        {isExpanded && (
          <>
            {LANGUAGES.map((language) => {
              const isSelected = language.id === currentLanguageId;
              return (
                <button
                  key={language.id}
                  onClick={() => {
                    setCurrentLanguageId(language.id);
                    setIsExpanded(false);
                  }}
                  className={classNames(
                    "bg-stone-400 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 px-2 py-1 min-w-[120px] flex justify-around rounded-md shadow-md",
                    {
                      "outline outline-4 outline-offset-1 outline-teal-400":
                        isSelected,
                    }
                  )}
                >
                  <RenderFlagBadge id={language.id} flag={language.flag} />
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
