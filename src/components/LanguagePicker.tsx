import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FranceFlag, UnitedKingdomFlag } from "./icons";
import classNames from "classnames";

const LANGUAGES = [
  {
    id: "en",
    flag: () => <UnitedKingdomFlag className="w-5 h-5" />,
  },
  {
    id: "fr",
    flag: () => <FranceFlag className="w-5 h-5" />,
  },
];

export const LanguagePicker = () => {
  const { i18n } = useTranslation();
  const activeLanguageId = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  ).split("-")[0];

  const currentLanguage =
    LANGUAGES.find((l) => l.id === activeLanguageId) ?? LANGUAGES[0];

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-stone-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-stone-700 dark:text-white shadow-sm hover:bg-stone-50 dark:hover:bg-slate-600 transition-colors"
      >
        {currentLanguage.flag()}
        <span className="text-sm font-semibold uppercase">
          {currentLanguage.id}
        </span>
        <svg
          className={classNames(
            "w-3 h-3 text-stone-500 dark:text-stone-300 transition-transform",
            { "rotate-180": isOpen }
          )}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5 L6 8 L9.5 4.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 min-w-[140px] rounded-md border border-stone-200 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-lg overflow-hidden z-10">
          {LANGUAGES.map((language) => {
            const isSelected = language.id === activeLanguageId;
            return (
              <button
                key={language.id}
                onClick={() => {
                  i18n.changeLanguage(language.id);
                  setIsOpen(false);
                }}
                className={classNames(
                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  {
                    "bg-stone-100 dark:bg-slate-600 text-stone-900 dark:text-white":
                      isSelected,
                    "text-stone-700 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-slate-600":
                      !isSelected,
                  }
                )}
              >
                {language.flag()}
                <span className="flex-1 font-semibold uppercase">
                  {language.id}
                </span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-teal-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
