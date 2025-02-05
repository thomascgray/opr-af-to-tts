import { nanoid } from "nanoid";
import { state, initialTtsOutputConfig } from "../state";
import { useSnapshot } from "valtio";
import useLocalStorageState from "use-local-storage-state";
import { Cross } from "./icons";
import { usei18n } from "../usei18n";

export const OutputOptions = () => {
  const { t } = usei18n();

  const stateView = useSnapshot(state, { sync: true });

  const [allConfigs, setAllConfigs] = useLocalStorageState<any>(
    "tombolaopraftotts_ttsOutputConfigs",
    {
      defaultValue: [],
    }
  );

  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">TTS Output Configuration</summary>
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
            <p className="font-bold">{t("ttsOutputConfiguration1.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration1.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration2.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration2.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration3.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration3.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration4.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration4.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration5.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration5.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration6.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration6.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration7.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration7.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration8.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration8.label")}</p>
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
            <p className="font-bold">{t("ttsOutputConfiguration9.name")}</p>
            <p className="text-xs">{t("ttsOutputConfiguration9.label")}</p>
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
            <p className="font-bold">Model Quality Stat Output Colour</p>
            <p className="text-xs">
              HEX code for the model's quality value in the TTS output.
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
            <p className="font-bold">Model Defense Stat Output Colour</p>
            <p className="text-xs">
              HEX code for the model's defense value in the TTS output.
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
            <p className="font-bold">Model Loadout Output Colour</p>
            <p className="text-xs">
              HEX code for the model's loadouts details in the TTS output.
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
            <p className="font-bold">Model Special Rules Output Colour</p>
            <p className="text-xs">
              HEX code for the model's special rules details in the TTS output.
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
            <p className="font-bold">
              Model Tough Special Rule Rating Output Colour
            </p>
            <p className="text-xs">
              HEX code for the model's Tough rating, if it has one, in the TTS
              output.
            </p>
          </div>
        </label>
        {/* <label className="flex flex-row items-center space-x-4">
          <span
            style={{
              backgroundColor:
                stateView.ttsOutputConfig.modelCampaignStuffOutputColour,
            }}
            className="block h-5 w-5 rounded-full border border-stone-600"
          ></span>
          <input
            className="border border-stone-500 px-2 py-1 w-20"
            value={stateView.ttsOutputConfig.modelCampaignStuffOutputColour}
            onChange={(e) => {
              state.ttsOutputConfig.modelCampaignStuffOutputColour =
                e.currentTarget.value;
            }}
          />

          <div>
            <p className="font-bold">Model "Campaign Stuff" Output Colour</p>
            <p className="text-xs">
              HEX code for the model's campaign XP and Traits in the TTS output.
            </p>
          </div>
        </label> */}
        <hr className="my-2" />
        <h3 className="text-base font-bold block">
          Save & Load TTS Output Configs
        </h3>

        <p>
          Save all of the above configuration into the local storage of your
          browser by hitting the button below. You can then quickly load
          different configs by hitting the load buttons below.
        </p>

        <div className="flex flex-row space-x-4">
          <button
            onClick={() => {
              // get all the current configs out of local storage
              // const allConfigsRaw = localStorage.getItem(
              //   "tombolaopraftotts_ttsOutputConfigs"
              // );
              // // parse them into an array
              // const allConfigs = allConfigsRaw ? JSON.parse(allConfigsRaw) : [];
              // add the current config to the array
              // allConfigs.push({
              //   id: nanoid(),
              //   config: state.ttsOutputConfig,
              //   isActive: true,
              // });
              // save the array back to local storage
              // localStorage.setItem(
              //   "tombolaopraftotts_ttsOutputConfigs",
              //   JSON.stringify(allConfigs)
              // );

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
            Save Current Config
          </button>

          <button
            onClick={() => {
              // we just want to reset the current config to the base initial config
              state.ttsOutputConfig = {
                ...initialTtsOutputConfig,
              };
            }}
            className="bg-stone-500 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 text-white dark:border px-4 py-2 hover:scale-105 active:scale-95"
          >
            Load app default config
          </button>
        </div>
        <div>
          <p className="font-bold">Load Custom Configs</p>
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
                      Load Config{" "}
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
              You have no saved TTS output configs
            </p>
          )}
        </div>
      </div>
    </details>
  );
};
