import { Injectable } from "@nestjs/common";
import { prisma } from "@fb/core";

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
        odds: match.odds.map((quote) => ({
          ...quote,
          odds: Number(quote.odds),
        })),
      })),
    };
  }
}
