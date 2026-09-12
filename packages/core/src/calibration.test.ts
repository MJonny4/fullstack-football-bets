import { describe, expect, it } from "vitest";
import { getMarketProbabilities, getMatchProbabilityModel } from "@fb/shared";
import { calibrationFailures, type CalibrationObservation } from "../test/calibration-checks.js";

function target(): CalibrationObservation {
  const model = getMatchProbabilityModel(72, 72);
  return { probabilities: getMarketProbabilities(72, 72), homeGoals: model.homeGoals, awayGoals: model.awayGoals,
    cards: model.homeCards + model.awayCards, corners: model.homeCorners + model.awayCorners };
}

describe("simulation calibration release gate", () => {
  it("accepts the target distribution and small sampling deviations", () => {
    const observation = target();
    expect(calibrationFailures(observation, 72, 72)).toEqual([]);
    observation.probabilities.MATCH_RESULT.HOME += 0.02;
    observation.homeGoals += 0.1;
    expect(calibrationFailures(observation, 72, 72)).toEqual([]);
  });
  it("fails drifting markets, exact scores, counts, and non-finite samples", () => {
    const observation = target();
    observation.probabilities.MATCH_RESULT.HOME += 0.2;
    observation.probabilities.EXACT_SCORE["0-0"] += 0.1;
    observation.probabilities.TOTAL_CARDS.OVER = Number.NaN;
    observation.probabilities.TOTAL_CORNERS.OVER += 0.2;
    observation.homeGoals += 1; observation.awayGoals += 1;
    observation.cards += 2; observation.corners += 2;
    expect(calibrationFailures(observation, 72, 72)).toHaveLength(8);
  });
});
