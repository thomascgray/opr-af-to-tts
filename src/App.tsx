import * as _ from "lodash";
import { useSnapshot } from "valtio";
import {
  eNetworkRequestState,
  iAppState,
  iUnitProfile,
  iUnitProfileModel,
} from "./types";
import {
  state,
  updateWeaponQuantity,
  updateWeaponIncludeInName,
  duplicateModel,
  deleteModel,
} from "./state";
import classnames from "classnames";
import { OutputOptions } from "./components/OutputOptions";
import { Tutorial } from "./components/Tutorial";
import {
  generateUnitOutput,
  getUnitNameForLegend,
  onGenerateDefinitions,
  onGenerateShareableId,
  getUnitIndexForSelectionId,
  isUnitHero,
} from "./utils";
import toast, { Toaster } from "react-hot-toast";
function App() {
  const stateView = useSnapshot(state, { sync: true });

  const areAllLoadoutsChecked = stateView.unitProfiles.every((unit) => {
    return unit.models.every((model) => {
      return model.loadout.every((loadoutItem) => {
        return (
          (loadoutItem.quantity >= 1 && loadoutItem.includeInName) ||
          loadoutItem.quantity === 0
        );
      });
    });
  });
  return (
    <div className="container mx-auto mt-4 mb-28">
      <div className="flex flex-row items-end space-x-2">
        <h1 className="text-4xl font-bold">OPR Army Forge to TTS</h1>
      </div>

      <span className="mt-1 block text-xs text-stone-500">
        This tool is under active development! If you find any bugs, please
        report them on the{" "}
        <a
          target="_blank"
          className="text-blue-700 underline visited:text-purple-700"
          href="https://github.com/thomascgray/grimdarkfuture-roster-to-tts/issues"
        >
          github issues page
        </a>
        . Thanks!
      </span>

      <span className="mt-1 block text-xs text-stone-500">
        Please take a look at the{" "}
        <a
          target="_blank"
          className="text-blue-700 underline visited:text-purple-700"
          href="https://github.com/thomascgray/opr-af-to-tts/releases"
        >
          releases page on Github
        </a>{" "}
        to see the latest release notes
      </span>

      <div className="inputs flex flex-row space-x-5 mt-6">
        <div className="w-full">
          <label>
            <span className="block font-bold text-xl">
              Army Forge Share Link
            </span>
            <span className="block text-xs text-stone-500">
              <a
                target="_blank"
                className="text-blue-700 underline visited:text-purple-700"
                href="https://army-forge.onepagerules.com/"
              >
                Army Forge
              </a>
              → army listing → menu at the top right → click "Share as Link" →
              paste that link into the box below → define model definitions →
              hit "Generate shareable link for TTS" at the bottom of the screen
              → paste <em>that</em> URL into{" "}
              <a
                target="_blank"
                className="text-blue-700 underline visited:text-purple-700"
                href="https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810"
              >
                this mod
              </a>
            </span>
            <input
              placeholder="https://army-forge.onepagerules.com/share?id=XXX&name=XXX"
              value={stateView.armyListShareLink}
              onChange={(e) => {
                state.armyListShareLink = e.currentTarget.value;
              }}
              type="text"
              className="border my-2 border-solid border-stone-500 w-full py-1 px-2"
            />
          </label>
        </div>
      </div>

      <button
        onClick={() => onGenerateDefinitions(stateView as iAppState)}
        className={classnames(
          " bg-stone-500 border-stone-600 text-white border px-4 py-2 hover:scale-105 active:scale-95",
          {
            "opacity-80":
              stateView.networkState.fetchArmyFromArmyForge ===
              eNetworkRequestState.PENDING,
          }
        )}
      >
        <span className="flex flex-row space-x-2 items-center">
          {stateView.networkState.fetchArmyFromArmyForge ===
            eNetworkRequestState.PENDING && (
            <svg
              className="animate-spin"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          )}
          <span>Generate Definitions</span>
        </span>
      </button>

      <div className="text-sm mt-6 space-y-2">
        <Tutorial />
        <OutputOptions />
      </div>

      {stateView.unitProfiles.length >= 1 && (
        <>
          <hr className="my-5" />

          <fieldset
            className="mb-8 p-4 text-xs bg-gradient-to-tl from-zinc-100 to-stone-100 shadow-xl border border-zinc-200"
            key={"inline-options"}
          >
            <legend className="-ml-8 px-3 py-1  bg-white shadow-md border border-stone-200">
              Inline Options
            </legend>

            <span className="flex items-center space-x-2">
              <input
                className="h-5 w-5 cursor-pointer outline-none border-none"
                title="Check to toggle ALL loadout items to be included in the model name"
                checked={areAllLoadoutsChecked}
                onChange={(e) => {
                  if (areAllLoadoutsChecked) {
                    state.unitProfiles.forEach((unit) => {
                      unit.models.forEach((model) => {
                        model.loadout.forEach((loadoutItem) => {
                          updateWeaponIncludeInName(
                            unit.id,
                            model.id,
                            loadoutItem.id,
                            false
                          );
                        });
                      });
                    });
                  } else {
                    state.unitProfiles.forEach((unit) => {
                      unit.models.forEach((model) => {
                        model.loadout.forEach((loadoutItem) => {
                          if (loadoutItem.quantity >= 1) {
                            updateWeaponIncludeInName(
                              unit.id,
                              model.id,
                              loadoutItem.id,
                              true
                            );
                          }
                        });
                      });
                    });
                  }
                }}
                type="checkbox"
              />
              <span>
                Check to toggle ALL loadout items to be included in the model
                name
              </span>
            </span>
          </fieldset>
          <div className="flex flex-col space-y-10">
            {stateView.unitProfiles.map((unit, unitIndex) => {
              const joinedTo = unit.originalJoinToUnit
                ? stateView.unitProfiles.find(
                    (up) => up.originalSelectionId === unit.originalJoinToUnit
                  )
                : undefined;

              return (
                <fieldset
                  className="p-4 text-xs bg-gradient-to-tl from-zinc-100 to-stone-100 shadow-xl border border-zinc-200"
                  key={unit.id}
                >
                  <legend className="-ml-8 px-3 py-1  bg-white shadow-md border border-stone-200">
                    <span className="text-lg">
                      #{unitIndex + 1}{" "}
                      {getUnitNameForLegend(unit as iUnitProfile)}
                    </span>

                    <span className="text-sm text-">
                      {" "}
                      {unit.originalModelCountInUnit} model
                      {unit.originalModelCountInUnit > 1 ? "s" : ""}
                    </span>
                    {joinedTo && (
                      <span className="text-sm italic text-stone-500">
                        {" "}
                        (
                        {isUnitHero(unit as iUnitProfile)
                          ? "joined to"
                          : "combined with"}{" "}
                        #
                        {getUnitIndexForSelectionId(
                          joinedTo.originalSelectionId,
                          stateView as iAppState
                        )}{" "}
                        {getUnitNameForLegend(joinedTo as iUnitProfile)})
                      </span>
                    )}
                  </legend>

                  <p className="mb-2 text-stone-500 italic">
                    Original Unit Loadout: {unit.originalLoadoutCsvHelperString}
                  </p>

                  <div className="flex flex-col space-y-10">
                    {unit.models.map((model, modelIndex) => {
                      const { ttsNameOutput, ttsDescriptionOutput } =
                        generateUnitOutput(
                          unit as iUnitProfile,
                          model as iUnitProfileModel,
                          stateView as iAppState
                        );
                      return (
                        <div key={model.id} className="relative">
                          <p className="text-sm">
                            Model Definition {modelIndex + 1}
                          </p>
                          {!model.isGenerated && (
                            <button
                              onClick={() => {
                                deleteModel(unit.id, model.id);
                              }}
                              title="Delete this distinct model definition"
                              className="border border-solid border-red-500 p-1 absolute -top-3 right-0 bg-red-500 text-white rounded-full hover:scale-110 active:scale-95"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={4}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                          <div className="flex flex-row space-x-2">
                            <div className="editor-panel space-y-3 w-2/4">
                              {/* loadout items */}
                              <div className="space-y-1">
                                {model.loadout.map((loadoutItem) => {
                                  return (
                                    <div
                                      key={loadoutItem.id}
                                      className={classnames(
                                        "flex flex-row items-center justify-between  py-1 px-2",
                                        {
                                          "bg-stone-100 text-stone-500":
                                            loadoutItem.quantity <= 0,
                                          "bg-stone-300 text-black":
                                            loadoutItem.quantity >= 1,
                                        }
                                      )}
                                    >
                                      <span className="flex flex-row items-center space-x-1 ">
                                        <span className="font-bold">
                                          {loadoutItem.name}
                                        </span>
                                        <span>{loadoutItem.definition}</span>
                                      </span>

                                      <span className="flex flex-row items-center space-x-2">
                                        <input
                                          className="w-12 p-1 text-lg font-bold text-center"
                                          min={0}
                                          onChange={(e) => {
                                            const value = parseInt(
                                              e.currentTarget.value
                                            );
                                            updateWeaponQuantity(
                                              unit.id,
                                              model.id,
                                              loadoutItem.id,
                                              value
                                            );
                                          }}
                                          value={loadoutItem.quantity}
                                          type="number"
                                        />
                                        <input
                                          className="h-5 w-5 cursor-pointer outline-none border-none"
                                          title="Check to include this item in the model name"
                                          checked={loadoutItem.includeInName}
                                          disabled={loadoutItem.quantity <= 0}
                                          onChange={(e) => {
                                            updateWeaponIncludeInName(
                                              unit.id,
                                              model.id,
                                              loadoutItem.id,
                                              !loadoutItem.includeInName
                                            );
                                          }}
                                          type="checkbox"
                                        />
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() =>
                                  duplicateModel(unit.id, model.id)
                                }
                                className="text-sm border border-stone-600 px-3 py-1 bg-stone-500 text-white hover:scale-105  active:scale-95"
                              >
                                Duplicate this model definition
                              </button>
                            </div>

                            <div className="output-panel w-2/4">
                              <div
                                key={model.id + "tts"}
                                className="bg-stone-300 px-4 pb-4 pt-3"
                              >
                                <span className="block text-xs italic text-stone-600 mb-2">
                                  TTS output preview (name and description)
                                </span>
                                <textarea
                                  onChange={() => {}}
                                  rows={5}
                                  onFocus={(e) => e.target.select()}
                                  value={`${ttsNameOutput}
----------
${ttsDescriptionOutput}`}
                                  className="block font-mono whitespace-pre text-xs w-full overflow-x-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}

            <hr className="my-5" />

            {/* after army builder */}
            <button
              disabled={stateView.unitProfiles.length <= 0}
              onClick={() => onGenerateShareableId(stateView as iAppState)}
              className={classnames(
                " bg-stone-500 disabled:opacity-60 border-stone-600 text-white border px-4 py-2 enabled:hover:scale-105 enabled:active:scale-95",
                {
                  "opacity-80":
                    stateView.networkState.saveArmyListAsBBToDB ===
                    eNetworkRequestState.PENDING,
                }
              )}
            >
              <span className="flex flex-row space-x-2 items-center">
                {stateView.networkState.saveArmyListAsBBToDB ===
                  eNetworkRequestState.PENDING && (
                  <svg
                    className="animate-spin"
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                )}
                <span>Generate shareable link for TTS</span>
              </span>
            </button>
            {stateView.shareableLinkForTTS && (
              <div className="block space-y-2">
                <p className="text-xs">
                  Copy and paste the link below into the TTS mod
                </p>
                <textarea
                  rows={1}
                  onChange={() => {}}
                  onFocus={(e) => e.target.select()}
                  value={stateView.shareableLinkForTTS}
                  className="block whitespace-pre text-lg w-full overflow-x-hidden bg-green-500 p-4 text-center text-white font-bold"
                />
              </div>
            )}
          </div>
        </>
      )}
      <Toaster position="bottom-left" />
    </div>
  );
}

export default App;
