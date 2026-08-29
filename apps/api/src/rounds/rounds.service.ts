import { Injectable } from "@nestjs/common";
import { prisma } from "@fb/core";
import { serializeTeam } from "../common/team-response.js";

@Injectable()
export class RoundsService {
  async current() {
    const round = await prisma.round.findFirst({
      orderBy: { weekNumber: "desc" },
      include: {
        matches: {
          orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
          include: {
            homeTeam: true,
            awayTeam: true,
            odds: {
              distinct: ["market", "selection"],
              orderBy: [
                { market: "asc" },
                { selection: "asc" },
                { computedAt: "desc" },
                { id: "desc" },
              ],
            },
          },
        },
      },
    });

    if (!round) {
      return null;
    }

    return {
      ...round,
      matches: round.matches.map((match) => ({
        ...match,
        homeTeam: serializeTeam(match.homeTeam),
        awayTeam: serializeTeam(match.awayTeam),
        odds: match.odds.map((quote) => ({
          id: quote.id,
          matchId: quote.matchId,
          market: quote.market,
          selection: quote.selection,
          odds: Number(quote.odds),
          computedAt: quote.computedAt,
        })),
      })),
    };
  }
}
