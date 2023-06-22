import { state } from "../state";
import { useSnapshot } from "valtio";

export const OutputOptions = () => {
  const stateView = useSnapshot(state, { sync: true });
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

        <label className="flex flex-row items-center space-x-4">
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
            className="border border-stone-500 px-2 py-1 w-20"
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
            className="border border-stone-500 px-2 py-1 w-20"
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
            className="border border-stone-500 px-2 py-1 w-20"
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
            className="border border-stone-500 px-2 py-1 w-20"
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
            className="border border-stone-500 px-2 py-1 w-20"
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
      </div>
    </details>
  );
};
