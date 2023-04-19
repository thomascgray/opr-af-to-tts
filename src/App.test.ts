import { expect, test, describe } from "vitest";
import {
  getAllIndividualSpecialRulesFromString,
  getTopLevelSpecialRulesFromString,
} from "./App";

describe("getAllIndividualSpecialRulesFromString", () => {
  test("2 levels deep", () => {
    expect(
      getAllIndividualSpecialRulesFromString("Ambush(Blast, AP(4))")
    ).toEqual(["Ambush", "Blast", "AP"]);
  });
  test("1 levels deep", () => {
    expect(
      getAllIndividualSpecialRulesFromString("Ambush(Blast, Flying), Rending")
    ).toEqual(["Ambush", "Blast", "Flying", "Rending"]);
  });

  test.only("dao test 1", () => {
    expect(
      getAllIndividualSpecialRulesFromString(
        "Ambush, Flying, Tough(3), Shield Drone, 1x Energy Shield(Shield Wall), 1x Gun Drone(), 1x Spotter Drone(Spotting Laser)"
      )
    ).toEqual(["Ambush", "Blast(AP(4))"]);
  });
});

describe("getTopLevelSpecialRulesFromString", () => {
  test("without a quantity", () => {
    expect(getTopLevelSpecialRulesFromString("Ambush, Blast(AP(4))")).toEqual([
      "Ambush",
      "Blast(AP(4))",
    ]);
  });

  test("with a quantity", () => {
    expect(
      getTopLevelSpecialRulesFromString("Ambush, 2x Blast(AP(4))")
    ).toEqual(["Ambush", "Blast(AP(4))"]);
  });
});
