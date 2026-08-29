import { Injectable } from "@nestjs/common";
import { prisma } from "@fb/core";
import {
  calculateStandings,
  getActiveSeason,
  ROUNDS_PER_SEASON,
  STANDINGS_TIE_BREAKERS,
  TOTAL_MATCHES_PER_SEASON,
  type StandingsResponse,
} from "@fb/shared";

@Injectable()
export class StandingsService {
  async current(): Promise<StandingsResponse> {
    return prisma.$transaction(async (tx) => {
      const latestRound = await tx.round.findFirst({
        orderBy: { weekNumber: "desc" },
        select: { weekNumber: true },
      });
      const activeSeason = getActiveSeason(latestRound?.weekNumber);

      const [teams, matches] = await Promise.all([
        tx.team.findMany({
          orderBy: [{ name: "asc" }, { id: "asc" }],
          select: { id: true, name: true, crestImageUrl: true },
        }),
        tx.match.findMany({
          where: {
            status: "RESOLVED",
            round: {
              weekNumber: {
                gte: activeSeason.firstWeekNumber,
                lte: activeSeason.lastWeekNumber,
              },
            },
          },
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            scheduledAt: true,
            resolvedAt: true,
            resultPayload: true,
            round: { select: { weekNumber: true } },
          },
        }),
      ]);

      const calculation = calculateStandings(
        teams,
        matches.map((match) => ({
          id: match.id,
          weekNumber: match.round.weekNumber,
          scheduledAt: match.scheduledAt,
          resolvedAt: match.resolvedAt,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          resultPayload: match.resultPayload,
        })),
      );

      return {
        seasonNumber: activeSeason.seasonNumber,
        currentMatchweek: activeSeason.currentMatchweek,
        roundsPerSeason: ROUNDS_PER_SEASON,
        playedMatches: calculation.playedMatches,
        totalMatches: TOTAL_MATCHES_PER_SEASON,
        goalsScored: calculation.goalsScored,
        lastResolvedAt: calculation.lastResolvedAt,
        tieBreakers: [...STANDINGS_TIE_BREAKERS],
        entries: calculation.entries,
      };
    });
  }
}
