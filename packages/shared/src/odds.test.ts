import { describe, expect, it } from "vitest";
import { createOddsQuotes, probabilityToDecimalOdds } from "./odds.js";
import { getMarketProbabilities } from "./probability.js";

function homeOdds(homeStrength: number, awayStrength: number): number {
  const quote = createOddsQuotes(homeStrength, awayStrength).find(
    ({ market, selection }) =>
      market === "MATCH_RESULT" && selection === "HOME",
  );
  if (!quote) throw new Error("home quote missing");
  return quote.odds;
}

describe("probability and odds model", () => {
  it("makes a stronger home side more likely and its odds shorter", () => {
    const weak = getMarketProbabilities(30, 70).MATCH_RESULT.HOME;
    const even = getMarketProbabilities(50, 50).MATCH_RESULT.HOME;
    const strong = getMarketProbabilities(70, 30).MATCH_RESULT.HOME;

    expect(weak).toBeLessThan(even);
    expect(even).toBeLessThan(strong);
    expect(homeOdds(30, 70)).toBeGreaterThan(homeOdds(50, 50));
    expect(homeOdds(50, 50)).toBeGreaterThan(homeOdds(70, 30));
  });

  it("applies the six percent margin and the odds floor", () => {
    expect(probabilityToDecimalOdds(0.5)).toBe(1.89);
    expect(probabilityToDecimalOdds(0.999)).toBe(1.01);
  });

  it("produces complete probability distributions", () => {
    const probabilities = getMarketProbabilities(65, 55);
    for (const market of Object.values(probabilities)) {
      const sum = Object.values(market).reduce((total, value) => total + value, 0);
      expect(sum).toBeCloseTo(1, 8);
    }
  });

  it("preserves precise decimal lineup-strength changes", () => {
    const before = getMarketProbabilities(72.25, 72.25).MATCH_RESULT.HOME;
    const after = getMarketProbabilities(72.35, 72.25).MATCH_RESULT.HOME;

    expect(after).toBeGreaterThan(before);
  });
});
