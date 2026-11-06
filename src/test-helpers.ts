import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { vi } from "vitest";
import * as ArmyForgeTypes from "./army-forge-types";
import { resetState, state } from "./state";
import { iAppState } from "./types";
import { onGenerateDefinitions } from "./utils";

// Test-only helpers. Nothing in the app imports this file.

export const FIXTURES_DIR = fileURLToPath(
  new URL("./__fixtures__/", import.meta.url)
);

export const readFixture = <T = any>(file: string): T =>
  JSON.parse(readFileSync(FIXTURES_DIR + file, "utf8"));

export const listFixtureFiles = () => readdirSync(FIXTURES_DIR).sort();

export const LIST_FIXTURE_IDS = listFixtureFiles()
  .map((f) => /^tts-(.+)\.json$/.exec(f)?.[1])
  .filter((id): id is string => !!id);

// mirrors the mapping in the app; the fixtures exist for these ids only
const COMMON_RULES_FIXTURE_BY_GAME_SYSTEM: Record<string, number> = {
  gf: 2,
  gff: 3,
  aof: 4,
  aofs: 5,
  gfsq: 9,
  gfsqai: 10,
};

export const loadList = (id: string) =>
  readFixture<ArmyForgeTypes.ListState>(`tts-${id}.json`);

export const loadCommonRulesFor = (list: ArmyForgeTypes.ListState) =>
  readFixture(
    `common-rules-${COMMON_RULES_FIXTURE_BY_GAME_SYSTEM[list.gameSystem]}.json`
  );

export const jsonResponse = (body: unknown, status = 200) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response);

/**
 * Stubs global fetch so the get-army function calls return the given bodies.
 * Returns the mock so tests can inspect which urls were requested.
 */
export const stubArmyForgeFetch = (
  list: unknown,
  commonRules: unknown,
  opts: { listStatus?: number; commonRulesStatus?: number } = {}
) => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes("armyId=")) {
      return jsonResponse(list, opts.listStatus ?? 200);
    }
    if (url.includes("commonRulesId=")) {
      return jsonResponse(commonRules, opts.commonRulesStatus ?? 200);
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

export const shareLinkFor = (id: string, beta = false) =>
  `https://army-forge${
    beta ? "-beta" : ""
  }.onepagerules.com/share?id=${id}&name=Fixture`;

/**
 * Runs the real onGenerateDefinitions against stubbed fetch and returns a plain
 * copy of state, with optional ttsOutputConfig overrides applied afterwards.
 */
export const buildStateView = async (
  list: ArmyForgeTypes.ListState,
  commonRules: unknown,
  configOverrides: Partial<iAppState["ttsOutputConfig"]> = {}
): Promise<iAppState> => {
  resetState();
  stubArmyForgeFetch(list, commonRules);
  state.armyListShareLink = shareLinkFor(list.id || "fixture");
  await onGenerateDefinitions(state);
  Object.assign(state.ttsOutputConfig, configOverrides);
  return JSON.parse(JSON.stringify(state));
};

// Army Forge generates these per request, so they change on every
// `npm run fixtures:refresh`. The app never reads them.
const VOLATILE_ARMY_FORGE_KEYS = ["instanceId", "upgradeInstanceId"];

/**
 * Replaces every nanoid-generated string with a fixed marker, and masks the
 * per-request upgrade ids Army Forge regenerates (see VOLATILE_ARMY_FORGE_KEYS;
 * `selectedUpgrades[].upgrade.id` changes too).
 */
export const maskNanoids = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, function (this: any, key, v) {
      if (typeof v === "string" && /^nanoid-\d+$/.test(v)) return "[nanoid]";
      if (VOLATILE_ARMY_FORGE_KEYS.includes(key)) return "[volatile]";
      if (key === "upgrade" && v && "instanceId" in this) {
        return { ...v, id: "[volatile]" };
      }
      return v;
    })
  );
