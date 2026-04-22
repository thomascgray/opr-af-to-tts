import { useTranslation } from "react-i18next";

export const OutputFAQ = () => {
  const { t } = useTranslation();
  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">{t("outputFaq.header")}</summary>
      <div className="p-2 bg-stone-100 dark:bg-slate-600 space-y-2">
        <ul className="list-disc ml-4">
          <li>{t("outputFaq.unitUpgradesNote")}</li>
        </ul>
      </div>
    </details>
  );
};
