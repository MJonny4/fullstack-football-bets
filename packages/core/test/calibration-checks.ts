import { getMarketProbabilities, getMatchProbabilityModel, type MarketProbabilities } from "@fb/shared";

export interface CalibrationObservation {
  probabilities: MarketProbabilities;
  homeGoals: number;
  awayGoals: number;
  cards: number;
  corners: number;
}

// Release regression tolerances, not a guarantee of exact prices for every squad.
// Use at least 1,000 independent deterministic samples per scenario.
export const CALIBRATION_TOLERANCES = {
  probability: 0.08,
  exactScoreProbability: 0.04,
  goalsPerSide: 0.3,
  totalCards: 0.6,
  totalCorners: 1,
} as const;

export function calibrationFailures(actual: CalibrationObservation, home: number, away: number): string[] {
  const target = getMarketProbabilities(home, away);
  const model = getMatchProbabilityModel(home, away);
  const failures: string[] = [];
  const check = (label: string, observed: number, expected: number, tolerance: number) => {
    if (!Number.isFinite(observed) || Math.abs(observed - expected) > tolerance) {
      failures.push(`${label}: observed ${observed}, expected ${expected.toFixed(4)} ± ${tolerance}`);
    }
  };
  for (const market of Object.keys(target) as Array<keyof MarketProbabilities>) {
    for (const [selection, probability] of Object.entries(target[market])) {
      check(`${market}.${selection}`, (actual.probabilities[market] as Record<string, number>)[selection]!, probability,
        market === "EXACT_SCORE" ? CALIBRATION_TOLERANCES.exactScoreProbability : CALIBRATION_TOLERANCES.probability);
    }
  }
  check("mean home goals", actual.homeGoals, model.homeGoals, CALIBRATION_TOLERANCES.goalsPerSide);
  check("mean away goals", actual.awayGoals, model.awayGoals, CALIBRATION_TOLERANCES.goalsPerSide);
  check("mean total cards", actual.cards, model.homeCards + model.awayCards, CALIBRATION_TOLERANCES.totalCards);
  check("mean total corners", actual.corners, model.homeCorners + model.awayCorners, CALIBRATION_TOLERANCES.totalCorners);
  return failures;
}
