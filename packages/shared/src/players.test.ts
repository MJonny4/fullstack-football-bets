import { describe, expect, it } from "vitest";
import {
  calculateGoalkeeperOverall,
  calculateOutfieldOverall,
  isOutfieldPosition,
  isPlayerPosition,
  type GoalkeeperAttributes,
  type OutfieldAttributes,
} from "./players.js";

const uniformOutfield = (value: number): OutfieldAttributes => ({
  pace: value,
  shooting: value,
  passing: value,
  dribbling: value,
  defending: value,
  physical: value,
});

const uniformGoalkeeper = (value: number): GoalkeeperAttributes => ({
  diving: value,
  handling: value,
  kicking: value,
  reflexes: value,
  speed: value,
  positioning: value,
});

describe("player ratings", () => {
  it("derives overall from all six position-specific attributes", () => {
    expect(calculateOutfieldOverall("ST", uniformOutfield(73))).toBe(73);
    expect(calculateOutfieldOverall("CB", uniformOutfield(68))).toBe(68);
    expect(calculateGoalkeeperOverall(uniformGoalkeeper(81))).toBe(81);

    expect(
      calculateOutfieldOverall("ST", {
        pace: 80,
        shooting: 90,
        passing: 70,
        dribbling: 82,
        defending: 30,
        physical: 78,
      }),
    ).toBe(81);
  });

  it("rejects invalid attribute values", () => {
    expect(() =>
      calculateOutfieldOverall("CM", {
        ...uniformOutfield(70),
        passing: 70.5,
      }),
    ).toThrow(/whole number/);
    expect(() =>
      calculateGoalkeeperOverall({
        ...uniformGoalkeeper(70),
        speed: 100,
      }),
    ).toThrow(/between 1 and 99/);
  });

  it("recognizes supported positions", () => {
    expect(isPlayerPosition("CDM")).toBe(true);
    expect(isPlayerPosition("LWB")).toBe(false);
    expect(isOutfieldPosition("LW")).toBe(true);
    expect(isOutfieldPosition("GK")).toBe(false);
  });
});
