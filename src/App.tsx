import * as _ from "lodash";
import { useSnapshot } from "valtio";
import { Trans, useTranslation } from "react-i18next";
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

import { ArrowPath, Cross, Duplicate, Cog } from "./components/icons";
import { DarkModeSwitch } from "./components/DarkModeSwitch";
import { LanguagePicker } from "./components/LanguagePicker";

function App() {
  const stateView = useSnapshot(state, { sync: true });
  const { t } = useTranslation();

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
    <div className="container mx-auto mt-4 mb-28 px-4 md:px-0">
      <div className="flex flex-row items-center justify-between space-x-2">
        <h1 className="text-4xl font-bold dark:text-white w-3/4 lg:w-full">
          {t("app.title")}
        </h1>

        <div className="flex gap-6 items-center">
          <DarkModeSwitch />
          <LanguagePicker />
        </div>
      </div>

      <span className="mt-1 block text-xs text-stone-500 dark:text-stone-300">
        <Trans
          i18nKey="app.bugReport.text"
          components={[
            <a
              target="_blank"
              className="text-blue-700 underline dark:text-blue-400 visited:text-purple-700 dark:visited:text-purple-400"
              href="https://github.com/thomascgray/grimdarkfuture-roster-to-tts/issues"
            />,
          ]}
        />
      </span>

      <div className="inputs flex flex-row space-x-5 mt-6">
        <div className="w-full">
          <label>
            <span className="block font-bold text-xl dark:text-white">
              {t("app.armyShareLink.label")}
            </span>
            <span className="block text-xs text-stone-500 dark:text-white">
              <Trans
                i18nKey="app.armyShareLink.tldr"
                components={[
                  <a
                    target="_blank"
                    className="text-blue-700 underline dark:text-blue-400 visited:text-purple-700 dark:visited:text-purple-400"
                    href="https://army-forge.onepagerules.com/"
                  />,
                  <a
                    target="_blank"
                    className="text-blue-700 underline visited:text-purple-700 dark:visited:text-purple-400"
                    href="https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810"
                  />,
                ]}
              />
            </span>
            <input
              placeholder={t("app.armyShareLink.placeholder")}
              value={stateView.armyListShareLink}
              onChange={(e) => {
                state.armyListShareLink = e.currentTarget.value;
              }}
              type="text"
              className="border my-2 border-solid border-stone-500 dark:border-zinc-800 w-full py-1 px-2"
            />
          </label>
        </div>
      </div>

      <button
        disabled={stateView.armyListShareLink === ""}
        onClick={() => onGenerateDefinitions(stateView as iAppState)}
        className={classnames(
          "bg-stone-500 dark:bg-slate-500 border-stone-600 dark:border-zinc-800 text-white px-4 py-2",
          {
            "hover:scale-105 active:scale-95": !(
              stateView.armyListShareLink === ""
            ),
            "opacity-80":
              stateView.networkState.fetchArmyFromArmyForge ===
              eNetworkRequestState.PENDING,
            "opacity-70": stateView.armyListShareLink === "",
          }
        )}
      >
        <span className="flex flex-row space-x-2 items-center">
          <Cog
            className={classnames(`w-6 h-6`, {
              "animate-spin":
                stateView.networkState.fetchArmyFromArmyForge ===
                eNetworkRequestState.PENDING,
            })}
          />
          <span>{t("app.importArmyButton")}</span>
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
            className="mb-8 p-4 text-xs bg-gradient-to-tl from-zinc-100 to-stone-100 dark:from-slate-400 dark:to-zinc-400 shadow-xl border border-zinc-200 dark:border-zinc-300"
            key={"inline-options"}
          >
            <legend className="-ml-8 px-3 py-1 bg-white dark:bg-slate-700 shadow-md border border-stone-200 dark:text-white">
              {t("app.inlineOptions.legend")}
            </legend>

            <span className="flex items-center space-x-2">
              <input
                className="h-5 w-5 cursor-pointer outline-none border-none"
                title={t("app.inlineOptions.toggleAllLoadouts")}
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
              <span className="dark:text-white">
                {t("app.inlineOptions.toggleAllLoadouts")}
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
                  className="p-4 text-xs bg-gradient-to-tl from-zinc-100 to-stone-100 shadow-xl dark:from-slate-400 dark:to-zinc-400 border border-zinc-200 dark:border-zinc-300"
                  key={unit.id}
                >
                  <legend className="-ml-8 px-3 py-1 bg-white dark:bg-slate-700 dark:text-white shadow-md border border-stone-200">
                    <span className="text-lg">
                      #{unitIndex + 1}{" "}
                      {getUnitNameForLegend(unit as iUnitProfile)}
                    </span>

                    <span className="text-sm text-">
                      {" "}
                      {t("app.unit.modelCount", {
                        count: unit.originalModelCountInUnit,
                      })}
                    </span>
                    {joinedTo && (
                      <span className="text-sm italic text-stone-500 dark:text-white">
                        {" "}
                        (
                        {isUnitHero(unit as iUnitProfile)
                          ? t("app.unit.joinedTo")
                          : t("app.unit.combinedWith")}{" "}
                        #
                        {getUnitIndexForSelectionId(
                          joinedTo.originalSelectionId,
                          stateView as iAppState
                        )}{" "}
                        {getUnitNameForLegend(joinedTo as iUnitProfile)})
                      </span>
                    )}
                  </legend>

                  <p className="mb-2 text-stone-500 dark:text-white italic">
                    {t("app.unit.originalLoadoutLabel", {
                      loadout: unit.originalLoadoutCsvHelperString,
                    })}
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
                          <p className="text-sm dark:text-white">
                            {t("app.model.definitionLabel", {
                              n: modelIndex + 1,
                            })}
                          </p>
                          {!model.isGenerated && (
                            <button
                              onClick={() => {
                                deleteModel(unit.id, model.id);
                              }}
                              title={t("app.model.deleteTitle")}
                              className="border border-solid border-red-500 p-1 absolute -top-3 right-0 bg-red-500 text-white rounded-full hover:scale-110 active:scale-95"
                            >
                              <Cross className="w-4 h-4" />
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
                                          "bg-stone-100 dark:bg-slate-100 text-stone-500 dark:text-white":
                                            loadoutItem.quantity <= 0,
                                          "bg-stone-300 dark:bg-slate-300 text-black":
                                            loadoutItem.quantity >= 1,
                                        }
                                      )}
                                    >
                                      <span className="flex flex-col text-left">
                                        <span className="font-bold text-base">
                                          {loadoutItem.name}
                                        </span>
                                        <span>{loadoutItem.definition}</span>
                                      </span>

                                      <span className="flex flex-row items-center space-x-2">
                                        <span className="flex flex-col space-y-1">
                                          <span className="text-xs italic text-stone-600">
                                            {t("app.model.quantityPerModelLabel")}
                                          </span>
                                          <input
                                            title={t(
                                              "app.model.quantityPerModelTitle"
                                            )}
                                            className="w-[5.2rem] pl-6 text-center py-1 px-2 text-xl font-bold"
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
                                        </span>
                                        <input
                                          className="h-5 w-5 cursor-pointer outline-none border-none"
                                          title={t(
                                            "app.model.includeInNameTitle"
                                          )}
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
                                className="flex flex-row space-x-2 items-center text-sm border border-stone-600 dark:border-zinc-800 px-3 py-1 bg-stone-500 dark:bg-slate-500 text-white hover:scale-105 active:scale-95"
                              >
                                <Duplicate className="w-4 h-4" />
                                <span>{t("app.model.duplicateButton")}</span>
                              </button>
                            </div>

                            <div className="output-panel w-2/4">
                              <div
                                key={model.id + "tts"}
                                className="bg-stone-300 dark:bg-slate-300  px-4 pb-4 pt-3"
                              >
                                <span className="block text-xs italic text-stone-600 mb-2">
                                  {t("app.ttsPreview.label")}
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
                " bg-stone-500 dark:bg-slate-500 disabled:opacity-60 border-stone-600 dark:border-zinc-800 text-white border px-4 py-2 enabled:hover:scale-105 enabled:active:scale-95",
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
                  <ArrowPath className="animate-spin w-4 h-4" />
                )}
                <span>{t("app.shareable.generateButton")}</span>
              </span>
            </button>
            {stateView.shareableLinkForTTS && (
              <div className="block space-y-2">
                <p className="text-xs dark:text-white">
                  {t("app.shareable.copyPasteHint")}
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
    </div>
  );
}

export default App;
