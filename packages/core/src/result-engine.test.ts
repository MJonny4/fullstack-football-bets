import { describe, expect, it } from "vitest";
import type { MatchContext } from "@fb/shared";
import { WeightedRandomResultEngine } from "./result-engine.js";

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function context(homeStrength: number, awayStrength: number): MatchContext {
  return {
    id: "match-1",
    roundId: "round-1",
    scheduledAt: new Date("2026-08-29T15:00:00.000Z"),
    homeTeam: {
      id: "home",
      name: "Home",
      crestImageUrl: null,
      strengthRating: homeStrength,
    },
    awayTeam: {
      id: "away",
      name: "Away",
      crestImageUrl: null,
      strengthRating: awayStrength,
    },
  };
}

describe("WeightedRandomResultEngine", () => {
  it("always returns non-negative integer match statistics", async () => {
    const result = await new WeightedRandomResultEngine(mulberry32(7)).resolve(
      context(60, 55),
    );
    for (const value of Object.values(result)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it("makes a much stronger side win substantially more often", async () => {
    const engine = new WeightedRandomResultEngine(mulberry32(12345));
    const match = context(90, 20);
    let homeWins = 0;
    let awayWins = 0;

    for (let sample = 0; sample < 4_000; sample += 1) {
      const result = await engine.resolve(match);
      if (result.homeScore > result.awayScore) homeWins += 1;
      if (result.homeScore < result.awayScore) awayWins += 1;
    }

    expect(homeWins).toBeGreaterThan(awayWins * 3);
  });
});
