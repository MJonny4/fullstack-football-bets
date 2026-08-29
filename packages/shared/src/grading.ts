import {
  TOTAL_CARDS_LINE,
  TOTAL_CORNERS_LINE,
  type Market,
  validateSelection,
} from "./markets.js";
import type { MatchResultPayload } from "./types.js";

function assertResult(result: MatchResultPayload): void {
  for (const [key, value] of Object.entries(result)) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(`result.${key} must be a non-negative integer`);
    }
  }
}

export function gradeBet(
  market: Market,
  selection: string,
  result: MatchResultPayload,
): boolean {
  if (!validateSelection(market, selection)) {
    throw new RangeError(`Invalid selection ${selection} for market ${market}`);
  }
  assertResult(result);

  switch (market) {
    case "MATCH_RESULT":
      if (selection === "HOME") return result.homeScore > result.awayScore;
      if (selection === "DRAW") return result.homeScore === result.awayScore;
      return result.homeScore < result.awayScore;

    case "EXACT_SCORE": {
      const gridSelection =
        result.homeScore <= 3 && result.awayScore <= 3
          ? `${result.homeScore}-${result.awayScore}`
          : "OTHER";
      return selection === gridSelection;
    }

    case "TOTAL_CARDS": {
      const total = result.homeCards + result.awayCards;
      return selection === "OVER"
        ? total > TOTAL_CARDS_LINE
        : total < TOTAL_CARDS_LINE;
    }

    case "TOTAL_CORNERS": {
      const total = result.homeCorners + result.awayCorners;
      return selection === "OVER"
        ? total > TOTAL_CORNERS_LINE
        : total < TOTAL_CORNERS_LINE;
    }
  }
}

export type DecimalLike = number | string | { toString(): string };

export function calculatePayout(stake: number, odds: DecimalLike): number {
  const numericOdds = typeof odds === "number" ? odds : Number(odds.toString());
  if (!Number.isInteger(stake) || stake <= 0) {
    throw new RangeError("stake must be a positive whole number of coins");
  }
  if (!Number.isFinite(numericOdds) || numericOdds < 1) {
    throw new RangeError("odds must be at least 1");
  }
  return Math.floor(stake * numericOdds);
}
