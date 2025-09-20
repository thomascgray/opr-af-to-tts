import { usei18n } from "../usei18n";

export const Tutorial = () => {
  const { t } = usei18n();

  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">{t("tutorialHeader")}</summary>
      <div className="p-2 bg-stone-100 dark:bg-slate-600 space-y-2">
        <ol className="list-decimal ml-4">
          <li>{t("tutorialInstruction1")}</li>
          <li>{t("tutorialInstruction2")}</li>
          <li>{t("tutorialInstruction3")}</li>
          <li>{t("tutorialInstruction4")}</li>
          <li>{t("tutorialInstruction5")}</li>
          <li>{t("tutorialInstruction6")}</li>
          <ul className="list-disc ml-4">
            <li>{t("tutorialInstruction6a")}</li>
            <li>{t("tutorialInstruction6b")}</li>
            <li>{t("tutorialInstruction6c")}</li>
          </ul>
          <li
            dangerouslySetInnerHTML={{
              __html: t("tutorialInstruction7", [
                "https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810",
              ]),
            }}
          />
        </ol>
        <p>
          <span className="font-bold">{t("hint")}</span>
          <br />
          <span>{t("hintInstruction1")}</span>
        </p>
      </div>
    </details>
  );
};
