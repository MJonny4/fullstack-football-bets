import { describe, expect, it } from "vitest";
import {
  EXACT_SCORE_SELECTIONS,
  MARKET_REGISTRY,
  validateSelection,
} from "./markets.js";

describe("market registry", () => {
  it("contains the specified exact-score grid plus OTHER", () => {
    expect(EXACT_SCORE_SELECTIONS).toHaveLength(17);
    expect(EXACT_SCORE_SELECTIONS).toContain("0-0");
    expect(EXACT_SCORE_SELECTIONS).toContain("3-3");
    expect(EXACT_SCORE_SELECTIONS.at(-1)).toBe("OTHER");
  });

  it("validates only selections registered for a market", () => {
    expect(validateSelection("MATCH_RESULT", "HOME")).toBe(true);
    expect(validateSelection("MATCH_RESULT", "OVER")).toBe(false);
    expect(validateSelection("TOTAL_CARDS", "UNDER")).toBe(true);
    expect(MARKET_REGISTRY.TOTAL_CARDS.line).toBe(4.5);
    expect(MARKET_REGISTRY.TOTAL_CORNERS.line).toBe(9.5);
  });
});
