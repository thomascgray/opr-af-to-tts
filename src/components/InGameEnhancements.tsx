import { useTranslation } from "react-i18next";

export const InGameEnhancements = () => {
  const { t } = useTranslation();

  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">
        {t("inGameEnhancements.header")}
      </summary>
      <div className="p-2 bg-stone-100 dark:bg-slate-600 space-y-4">
        <p>{t("inGameEnhancements.intro")}</p>

        <section className="space-y-1">
          <h3 className="font-bold text-base">
            {t("inGameEnhancements.statBars.heading")}
          </h3>
          <p>{t("inGameEnhancements.statBars.body")}</p>
          <ul className="list-disc ml-4">
            <li>{t("inGameEnhancements.statBars.item1")}</li>
            <li>{t("inGameEnhancements.statBars.item2")}</li>
            <li>{t("inGameEnhancements.statBars.item3")}</li>
          </ul>
        </section>

        <section className="space-y-1">
          <h3 className="font-bold text-base">
            {t("inGameEnhancements.contextMenu.heading")}
          </h3>
          <p>{t("inGameEnhancements.contextMenu.body")}</p>
          <ul className="list-disc ml-4">
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.contextMenu.toggleMenu.name")}
              </span>{" "}
              — {t("inGameEnhancements.contextMenu.toggleMenu.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.contextMenu.activated.name")}
              </span>{" "}
              — {t("inGameEnhancements.contextMenu.activated.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.contextMenu.shakenStunned.name")}
              </span>{" "}
              — {t("inGameEnhancements.contextMenu.shakenStunned.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.contextMenu.measuring.name")}
              </span>{" "}
              — {t("inGameEnhancements.contextMenu.measuring.desc")}
            </li>
          </ul>
        </section>

        <section className="space-y-1">
          <h3 className="font-bold text-base">
            {t("inGameEnhancements.hotkeys.heading")}
          </h3>
          <p>{t("inGameEnhancements.hotkeys.body")}</p>
          <table className="text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-300 dark:border-slate-400">
                <th className="py-1 pr-4 font-bold">
                  {t("inGameEnhancements.hotkeys.col.key")}
                </th>
                <th className="py-1 pr-4 font-bold">
                  {t("inGameEnhancements.hotkeys.col.action")}
                </th>
                <th className="py-1 font-bold">
                  {t("inGameEnhancements.hotkeys.col.notes")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-0.5 pr-4 font-mono">1</td>
                <td className="py-0.5 pr-4">
                  {t("inGameEnhancements.hotkeys.row1.action")}
                </td>
                <td className="py-0.5">
                  {t("inGameEnhancements.hotkeys.row1.notes")}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 pr-4 font-mono">2</td>
                <td className="py-0.5 pr-4">
                  {t("inGameEnhancements.hotkeys.row2.action")}
                </td>
                <td className="py-0.5">
                  {t("inGameEnhancements.hotkeys.row2.notes")}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 pr-4 font-mono">3</td>
                <td className="py-0.5 pr-4">
                  {t("inGameEnhancements.hotkeys.row3.action")}
                </td>
                <td className="py-0.5">
                  {t("inGameEnhancements.hotkeys.row3.notes")}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 pr-4 font-mono">4</td>
                <td className="py-0.5 pr-4">
                  {t("inGameEnhancements.hotkeys.row4.action")}
                </td>
                <td className="py-0.5">
                  {t("inGameEnhancements.hotkeys.row4.notes")}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 pr-4 font-mono">5</td>
                <td className="py-0.5 pr-4">
                  {t("inGameEnhancements.hotkeys.row5.action")}
                </td>
                <td className="py-0.5">
                  {t("inGameEnhancements.hotkeys.row5.notes")}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 pr-4 font-mono">6</td>
                <td className="py-0.5 pr-4">
                  {t("inGameEnhancements.hotkeys.row6.action")}
                </td>
                <td className="py-0.5">
                  {t("inGameEnhancements.hotkeys.row6.notes")}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="italic text-stone-600 dark:text-slate-300">
            {t("inGameEnhancements.hotkeys.libraryNote")}
          </p>
        </section>

        <section className="space-y-1">
          <h3 className="font-bold text-base">
            {t("inGameEnhancements.actionPanel.heading")}
          </h3>
          <p>{t("inGameEnhancements.actionPanel.body")}</p>

          <p className="font-bold mt-2">
            {t("inGameEnhancements.actionPanel.columns.heading")}
          </p>
          <ul className="list-disc ml-4">
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.columns.model.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.columns.model.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.columns.unit.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.columns.unit.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.columns.army.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.columns.army.desc")}
            </li>
          </ul>

          <p className="font-bold mt-2">
            {t("inGameEnhancements.actionPanel.extras.heading")}
          </p>
          <ul className="list-disc ml-4">
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.extras.ringColour.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.extras.ringColour.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.extras.highlight.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.extras.highlight.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.extras.uiVisibility.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.extras.uiVisibility.desc")}
            </li>
            <li>
              <span className="font-bold">
                {t("inGameEnhancements.actionPanel.extras.uiPosition.name")}
              </span>{" "}
              — {t("inGameEnhancements.actionPanel.extras.uiPosition.desc")}
            </li>
          </ul>

          <p className="italic text-stone-600 dark:text-slate-300 mt-2">
            {t("inGameEnhancements.actionPanel.closeNote")}
          </p>
        </section>
      </div>
    </details>
  );
};
