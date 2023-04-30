import { state } from "../state";
import { useSnapshot } from "valtio";

export const OutputOptions = () => {
  const stateView = useSnapshot(state, { sync: true });
  return (
    <details>
      <summary className="cursor-pointer">TTS Output Configuration</summary>
      <div className="py-2 px-4 bg-stone-100 space-y-4">
        <p>
          A whole bunch of options for you to configure what the output will be
          and what colours it will use on your TTS model's name and description
          fields.
        </p>
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
              Include army special rules in model description
            </p>
            <p className="text-xs">
              If enabled, the TTS "description" outputs will include the model's
              relevant rules from the army, and from that model's loadout.
            </p>
          </div>
        </label>

        {/* <label className="flex flex-row items-center space-x-4">
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
            <p className="font-bold">Include full special rules text</p>
            <p className="text-xs">
              If enabled, the TTS "description" output will include the full
              rules text for each special rule on a model. If disabled, only the
              special rule's name will be included.
            </p>
          </div>
        </label> */}

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
      </div>
    </details>
  );
};
