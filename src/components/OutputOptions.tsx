import { nanoid } from "nanoid";
import { state, initialTtsOutputConfig } from "../state";
import { useSnapshot } from "valtio";
import useLocalStorageState from "use-local-storage-state";
import { Cross } from "./icons";
import { useTranslation } from "react-i18next";

export const OutputOptions = () => {
  const { t } = useTranslation();

  const stateView = useSnapshot(state, { sync: true });

  const [allConfigs, setAllConfigs] = useLocalStorageState<any>(
    "tombolaopraftotts_ttsOutputConfigs",
    {
      defaultValue: [],
    }
  );

  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">{t("outputOptions.header")}</summary>
      <div className="py-2 px-4 bg-stone-100 dark:bg-slate-600 space-y-4">
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeCoreSpecialRules}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeCoreSpecialRules =
                !stateView.ttsOutputConfig.includeCoreSpecialRules;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.includeCoreSpecialRules.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.includeCoreSpecialRules.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeFullCoreSpecialRulesText}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeFullCoreSpecialRulesText =
                !stateView.ttsOutputConfig.includeFullCoreSpecialRulesText;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.includeFullCoreSpecialRulesText.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.includeFullCoreSpecialRulesText.label")}
            </p>
          </div>
        </label>
        <hr />
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeArmySpecialRules}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeArmySpecialRules =
                !stateView.ttsOutputConfig.includeArmySpecialRules;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.includeArmySpecialRules.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.includeArmySpecialRules.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeFullArmySpecialRulesText}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeFullArmySpecialRulesText =
                !stateView.ttsOutputConfig.includeFullArmySpecialRulesText;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.includeFullArmySpecialRulesText.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.includeFullArmySpecialRulesText.label")}
            </p>
          </div>
        </label>
        <hr />
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeWeaponsListInName}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeWeaponsListInName =
                !stateView.ttsOutputConfig.includeWeaponsListInName;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.includeWeaponsListInName.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.includeWeaponsListInName.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeSpecialRulesListInName}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeSpecialRulesListInName =
                !stateView.ttsOutputConfig.includeSpecialRulesListInName;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.includeSpecialRulesListInName.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.includeSpecialRulesListInName.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={
              stateView.ttsOutputConfig
                .swapCustomNameBracketingForUnitsWithMultipleModels
            }
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.swapCustomNameBracketingForUnitsWithMultipleModels =
                !stateView.ttsOutputConfig
                  .swapCustomNameBracketingForUnitsWithMultipleModels;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.swapCustomName.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.swapCustomName.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <input
            checked={
              stateView.ttsOutputConfig.completelyReplaceNameWithCustomName
            }
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.completelyReplaceNameWithCustomName =
                !stateView.ttsOutputConfig.completelyReplaceNameWithCustomName;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.replaceOriginalName.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.replaceOriginalName.label")}
            </p>
          </div>
        </label>
        <hr />

        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.disableSmallText}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.disableSmallText =
                !stateView.ttsOutputConfig.disableSmallText;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">
              {t("outputOptions.rules.disableSmallText.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.rules.disableSmallText.label")}
            </p>
          </div>
        </label>
        <hr />
        <label className="flex flex-row items-center space-x-4">
          <span
            style={{
              backgroundColor: stateView.ttsOutputConfig.modelQuaOutputColour,
            }}
            className="block h-5 w-5 rounded-full border border-stone-600"
          ></span>
          <input
            className="border border-stone-500 px-2 py-1 w-20 dark:text-black"
            value={stateView.ttsOutputConfig.modelQuaOutputColour}
            onChange={(e) => {
              state.ttsOutputConfig.modelQuaOutputColour =
                e.currentTarget.value;
            }}
          />

          <div>
            <p className="font-bold">
              {t("outputOptions.colours.quality.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.colours.quality.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <span
            style={{
              backgroundColor: stateView.ttsOutputConfig.modelDefOutputColour,
            }}
            className="block h-5 w-5 rounded-full border border-stone-600"
          ></span>
          <input
            className="border border-stone-500 px-2 py-1 w-20 dark:text-black"
            value={stateView.ttsOutputConfig.modelDefOutputColour}
            onChange={(e) => {
              state.ttsOutputConfig.modelDefOutputColour =
                e.currentTarget.value;
            }}
          />
          <div>
            <p className="font-bold">
              {t("outputOptions.colours.defense.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.colours.defense.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <span
            style={{
              backgroundColor:
                stateView.ttsOutputConfig.modelWeaponOutputColour,
            }}
            className="block h-5 w-5 rounded-full border border-stone-600"
          ></span>
          <input
            className="border border-stone-500 px-2 py-1 w-20 dark:text-black"
            value={stateView.ttsOutputConfig.modelWeaponOutputColour}
            onChange={(e) => {
              state.ttsOutputConfig.modelWeaponOutputColour =
                e.currentTarget.value;
            }}
          />
          <div>
            <p className="font-bold">
              {t("outputOptions.colours.loadout.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.colours.loadout.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <span
            style={{
              backgroundColor:
                stateView.ttsOutputConfig.modelSpecialRulesOutputColour,
            }}
            className="block h-5 w-5 rounded-full border border-stone-600"
          ></span>
          <input
            className="border border-stone-500 px-2 py-1 w-20 dark:text-black"
            value={stateView.ttsOutputConfig.modelSpecialRulesOutputColour}
            onChange={(e) => {
              state.ttsOutputConfig.modelSpecialRulesOutputColour =
                e.currentTarget.value;
            }}
          />
          <div>
            <p className="font-bold">
              {t("outputOptions.colours.specialRules.name")}
            </p>
            <p className="text-xs">
              {t("outputOptions.colours.specialRules.label")}
            </p>
          </div>
        </label>
        <label className="flex flex-row items-center space-x-4">
          <span
            style={{
              backgroundColor: stateView.ttsOutputConfig.modelToughOutputColour,
            }}
            className="block h-5 w-5 rounded-full border border-stone-600"
          ></span>
          <input
            className="border border-stone-500 px-2 py-1 w-20 dark:text-black"
            value={stateView.ttsOutputConfig.modelToughOutputColour}
            onChange={(e) => {
              state.ttsOutputConfig.modelToughOutputColour =
                e.currentTarget.value;
            }}
          />

          <div>
            <p className="font-bold">{t("outputOptions.colours.tough.name")}</p>
            <p className="text-xs">{t("outputOptions.colours.tough.label")}</p>
          </div>
        </label>
        <hr className="my-2" />
        <h3 className="text-base font-bold block">
          {t("outputOptions.saveLoad.header")}
        </h3>

        <p>{t("outputOptions.saveLoad.description")}</p>

        <div className="flex flex-row space-x-4">
          <button
            onClick={() => {
              setAllConfigs([
                ...allConfigs,
                {
                  id: nanoid(),
                  config: state.ttsOutputConfig,
                  timestamp: Date.now(),
                },
              ]);
            }}
            className="bg-stone-500 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 text-white dark:border px-4 py-2 hover:scale-105 active:scale-95"
          >
            {t("outputOptions.saveLoad.saveButton")}
          </button>

          <button
            onClick={() => {
              state.ttsOutputConfig = {
                ...initialTtsOutputConfig,
              };
            }}
            className="bg-stone-500 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 text-white dark:border px-4 py-2 hover:scale-105 active:scale-95"
          >
            {t("outputOptions.saveLoad.loadDefaultButton")}
          </button>
        </div>
        <div>
          <p className="font-bold">
            {t("outputOptions.saveLoad.loadCustomHeader")}
          </p>
          {allConfigs.length >= 1 && (
            <div className="flex flex-row gap-3 flex-wrap mt-2">
              {allConfigs.map((config: any) => {
                return (
                  <div key={config.id} className="relative">
                    <button
                      onClick={() => {
                        state.ttsOutputConfig = {
                          ...config.config,
                        };
                      }}
                      className="text-xs bg-stone-500 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 text-white dark:border pl-2 pr-6 py-2 text-center hover:scale-105 active:scale-95"
                    >
                      {t("outputOptions.saveLoad.loadConfigButton")}{" "}
                      <span className="font-mono">
                        [ {config.id.substring(0, 5)} ]
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setAllConfigs(
                          allConfigs.filter((c: any) => c.id !== config.id)
                        );
                      }}
                      className="shadow hover:scale-110 active:scale-95 absolute bg-red-500 -top-2 -right-2 text-white rounded-full p-1"
                    >
                      <Cross className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {allConfigs.length === 0 && (
            <p className="text-stone-500 italic mt-2 dark:text-slate-300">
              {t("outputOptions.saveLoad.emptyState")}
            </p>
          )}
        </div>
      </div>
    </details>
  );
};
