import { describe, expect, it } from "vitest";
import { calculatePayout, gradeBet } from "./grading.js";
import type { MatchResultPayload } from "./types.js";

const result: MatchResultPayload = {
  homeScore: 4,
  awayScore: 1,
  homeCards: 2,
  awayCards: 3,
  homeCorners: 6,
  awayCorners: 4,
};

describe("bet grading", () => {
  it("grades every supported market", () => {
    expect(gradeBet("MATCH_RESULT", "HOME", result)).toBe(true);
    expect(gradeBet("MATCH_RESULT", "DRAW", result)).toBe(false);
    expect(gradeBet("EXACT_SCORE", "OTHER", result)).toBe(true);
    expect(gradeBet("TOTAL_CARDS", "OVER", result)).toBe(true);
    expect(gradeBet("TOTAL_CARDS", "UNDER", result)).toBe(false);
    expect(gradeBet("TOTAL_CORNERS", "OVER", result)).toBe(true);
  });

  it("grades an exact score within the 0..3 grid", () => {
    expect(
      gradeBet("EXACT_SCORE", "2-1", {
        ...result,
        homeScore: 2,
        awayScore: 1,
      }),
    ).toBe(true);
  });

  it("floors winning payouts to whole coins", () => {
    expect(calculatePayout(17, 2.35)).toBe(39);
    expect(calculatePayout(100, "1.89")).toBe(189);
  });
});
