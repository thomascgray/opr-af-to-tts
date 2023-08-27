import { nanoid } from "nanoid";
import { state, initialTtsOutputConfig } from "../state";
import { useSnapshot } from "valtio";
import useLocalStorageState from "use-local-storage-state";
import { Cross } from "./icons";
export const OutputOptions = () => {
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
            <p className="font-bold">
              Include "Core" special rules in model description
            </p>
            <p className="text-xs">
              If enabled, the TTS "description" outputs will include the model's
              relevant core special rules.
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
              Include the full text for core special rules
            </p>
            <p className="text-xs">
              If enabled, the TTS "description" outputs will include the model's
              relevant core special rules text in full. If disabled, only the
              special rule's name will be included.
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
              Include "Army" special rules in model description
            </p>
            <p className="text-xs">
              If enabled, the TTS "description" outputs will include the model's
              relevant rules from the army, and from that model's loadout.
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
              Include the full text for army special rules
            </p>
            <p className="text-xs">
              If enabled, the TTS "description" outputs will include the model's
              relevant army special rules text in full. If disabled, only the
              special rule's name will be included.
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
            <p className="font-bold">Include "Loadout List" in model name</p>
            <p className="text-xs">
              If enabled, the TTS "name" output will include a comma separated,
              colour coded list of the model's equipped loadout under the
              model's name.
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
              Include "Special Rules List" in model name
            </p>
            <p className="text-xs">
              If enabled, the TTS "name" output will include a comma separated,
              colour coded list of the model's relevant special rules under the
              model's name.
            </p>
          </div>
        </label>
        {/* <label className="flex flex-row items-center space-x-4">
          <input
            checked={
              stateView.ttsOutputConfig.includeToughSpecialRuleRatingInName
            }
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeToughSpecialRuleRatingInName =
                !stateView.ttsOutputConfig.includeToughSpecialRuleRatingInName;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">Include Tough rating in model name</p>
            <p className="text-xs">
              If enabled, if the model has the "Tough" special rule, then the
              rating for that special rule will be displayed in square brackets
              after the model's name.
            </p>
          </div>
        </label> */}
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
              Swap custom name and original name ordering for units with
              multiple models in them
            </p>
            <p className="text-xs">
              If enabled, then a unit with a custom name and whose original
              model size is greater than 1 will have the custom name in the
              brackets in the output, instead of the original name. This often
              looks better and makes more semantic sense.
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
              Completely replace original model names with any custom name
            </p>
            <p className="text-xs">
              If enabled, then a unit with a custom name will have that custom
              name completely replace the original, with the original not being
              in brackets or anywhere else on the model.
            </p>
          </div>
        </label>
        <hr />
        {/* <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeCampaignXp}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeCampaignXp =
                !stateView.ttsOutputConfig.includeCampaignXp;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">Include campaign XP</p>
            <p className="text-xs">
              If enabled, then model descriptions will include the units
              campaign XP.
            </p>
          </div>
        </label>

        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeCampaignXp}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeCampaignXp =
                !stateView.ttsOutputConfig.includeCampaignXp;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">Include campaign traits</p>
            <p className="text-xs">
              If enabled, then model descriptions will include the units
              campaign traits.
            </p>
          </div>
        </label>

        <label className="flex flex-row items-center space-x-4">
          <input
            checked={stateView.ttsOutputConfig.includeCampaignTraitsFullText}
            className="w-5 h-5"
            type="checkbox"
            onChange={(e) => {
              state.ttsOutputConfig.includeCampaignTraitsFullText =
                !stateView.ttsOutputConfig.includeCampaignTraitsFullText;
            }}
          />
          <div className="w-11/12">
            <p className="font-bold">Include campaign traits full text</p>
            <p className="text-xs">
              If enabled, then for any campaign traits that the model has, the
              full rules text of that trait will be included. If disabled, only
              the name of the trait will be included.
            </p>
          </div>
        </label>

        <hr /> */}
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
            <p className="font-bold">Disable small text</p>
            <p className="text-xs">
              If enabled, then none of the text in the name or description will
              be small. Enable this if you have trouble reading the small text
              in TTS.
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
