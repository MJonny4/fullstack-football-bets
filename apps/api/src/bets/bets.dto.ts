import { IsIn, IsInt, IsString, MaxLength, Min, MinLength } from "class-validator";

export const SUPPORTED_MARKETS = [
  "MATCH_RESULT",
  "EXACT_SCORE",
  "TOTAL_CARDS",
  "TOTAL_CORNERS",
] as const;

export class PlaceBetDto {
  @IsString()
  @MinLength(10)
  @MaxLength(64)
  matchId!: string;

  @IsIn(SUPPORTED_MARKETS)
  market!: (typeof SUPPORTED_MARKETS)[number];

  @IsString()
  @MaxLength(32)
  selection!: string;

  @IsInt()
  @Min(1)
  stake!: number;
}
