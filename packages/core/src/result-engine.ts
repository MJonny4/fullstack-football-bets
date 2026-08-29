import {
  getMatchProbabilityModel,
  type MatchContext,
  type MatchResultPayload,
  type ResultEngine,
} from "@fb/shared";
import type { RandomSource } from "./schedule.js";

export function samplePoisson(lambda: number, random: RandomSource): number {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

/** Weighted stub backed by the exact probability model used to quote odds. */
export class WeightedRandomResultEngine implements ResultEngine {
  constructor(private readonly random: RandomSource = Math.random) {}

  async resolve(match: MatchContext): Promise<MatchResultPayload> {
    const model = getMatchProbabilityModel(
      match.homeTeam.strengthRating,
      match.awayTeam.strengthRating,
    );
    return {
      homeScore: samplePoisson(model.homeGoals, this.random),
      awayScore: samplePoisson(model.awayGoals, this.random),
      homeCards: samplePoisson(model.homeCards, this.random),
      awayCards: samplePoisson(model.awayCards, this.random),
      homeCorners: samplePoisson(model.homeCorners, this.random),
      awayCorners: samplePoisson(model.awayCorners, this.random),
    };
  }
}

export type { MatchContext, MatchResultPayload, ResultEngine } from "@fb/shared";
