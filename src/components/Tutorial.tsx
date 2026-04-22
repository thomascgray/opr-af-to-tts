import { Trans, useTranslation } from "react-i18next";

export const Tutorial = () => {
  const { t } = useTranslation();

  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">{t("tutorial.header")}</summary>
      <div className="p-2 bg-stone-100 dark:bg-slate-600 space-y-2">
        <ol className="list-decimal ml-4">
          <li>{t("tutorial.instructions.item1")}</li>
          <li>{t("tutorial.instructions.item2")}</li>
          <li>{t("tutorial.instructions.item3")}</li>
          <li>{t("tutorial.instructions.item4")}</li>
          <li>{t("tutorial.instructions.item5")}</li>
          <li>{t("tutorial.instructions.item6")}</li>
          <ul className="list-disc ml-4">
            <li>{t("tutorial.instructions.item6a")}</li>
            <li>{t("tutorial.instructions.item6b")}</li>
            <li>{t("tutorial.instructions.item6c")}</li>
          </ul>
          <li>
            <Trans
              i18nKey="tutorial.instructions.item7"
              components={[
                <a
                  target="_blank"
                  className="text-blue-700 underline visited:text-purple-700 dark:visited:text-purple-400"
                  href="https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810"
                />,
              ]}
            />
          </li>
        </ol>
        <p>
          <span className="font-bold">{t("tutorial.hint.label")}</span>
          <br />
          {t("tutorial.hint.text")}
        </p>
      </div>
    </details>
  );
};
