import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsufficientFundsError,
  Prisma,
  applyWalletTransaction,
  prisma,
} from "@fb/core";
import { validateSelection } from "@fb/shared";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import { isPrismaError } from "../common/prisma-errors.js";
import { serializeTeam } from "../common/team-response.js";
import type { PlaceBetDto } from "./bets.dto.js";

@Injectable()
export class BetsService {
  constructor(
    @Inject(LeaderboardGateway)
    private readonly leaderboard: LeaderboardGateway,
  ) {}

  async list(userId: string) {
    const bets = await prisma.bet.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            round: true,
          },
        },
      },
    });

    return bets.map((bet) => ({
      ...bet,
      oddsTaken: Number(bet.oddsTaken),
      match: {
        ...bet.match,
        homeTeam: serializeTeam(bet.match.homeTeam),
        awayTeam: serializeTeam(bet.match.awayTeam),
      },
    }));
  }

  async place(userId: string, input: PlaceBetDto) {
    if (!validateSelection(input.market, input.selection)) {
      throw new BadRequestException("The selection is not valid for that market");
    }

    let result: Awaited<ReturnType<typeof this.placeInTransaction>> | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        result = await this.placeInTransaction(userId, input);
        break;
      } catch (error) {
        if (isPrismaError(error, "P2034") && attempt < 2) {
          continue;
        }
        if (error instanceof InsufficientFundsError) {
          throw new BadRequestException("The stake exceeds your available balance");
        }
        throw error;
      }
    }

    if (!result) {
      throw new ConflictException("The bet could not be placed; please retry");
    }
    await this.leaderboard.broadcast().catch(() => undefined);
    return result;
  }

  async cancel(userId: string, betId: string) {
    let result: Awaited<ReturnType<typeof this.cancelInTransaction>> | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        result = await this.cancelInTransaction(userId, betId);
        break;
      } catch (error) {
        if (isPrismaError(error, "P2034") && attempt < 2) continue;
        throw error;
      }
    }
    if (!result) {
      throw new ConflictException("The bet could not be cancelled; please retry");
    }
    await this.leaderboard.broadcast().catch(() => undefined);
    return result;
  }

  private placeInTransaction(userId: string, input: PlaceBetDto) {
    return prisma.$transaction(
      async (tx) => {
        const match = await tx.match.findUnique({
          where: { id: input.matchId },
          include: {
            round: true,
            odds: {
              where: {
                market: input.market,
                selection: input.selection,
              },
              take: 1,
              orderBy: [{ computedAt: "desc" }, { id: "desc" }],
            },
          },
        });

        if (!match) {
          throw new NotFoundException("Match not found");
        }

        const now = new Date();
        if (match.round.status !== "OPEN" || now >= match.round.bettingClosesAt) {
          throw new ConflictException("The betting window is closed");
        }
        const assignment = await tx.dTAssignment.findUnique({
          where: { userId },
          select: { teamId: true },
        });
        if (
          assignment &&
          (assignment.teamId === match.homeTeamId ||
            assignment.teamId === match.awayTeamId)
        ) {
          throw new ConflictException(
            "Managers cannot bet on matches involving their own club",
          );
        }
        const quote = match.odds[0];
        if (!quote) {
          throw new BadRequestException("No current odds exist for that selection");
        }

        const bet = await tx.bet.create({
          data: {
            userId,
            matchId: match.id,
            market: input.market,
            selection: input.selection,
            stake: input.stake,
            oddsTaken: quote.odds,
          },
        });

        await applyWalletTransaction(
          tx,
          userId,
          "STAKE",
          -input.stake,
          `bet:${bet.id}:stake`,
        );
        const user = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: { coinBalance: true },
        });

        return {
          bet: { ...bet, oddsTaken: Number(bet.oddsTaken) },
          coinBalance: user.coinBalance,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private cancelInTransaction(userId: string, betId: string) {
    return prisma.$transaction(
      async (tx) => {
        const bet = await tx.bet.findFirst({
          where: { id: betId, userId },
          include: { match: { include: { round: true } } },
        });
        if (!bet) throw new NotFoundException("Bet not found");
        if (bet.status !== "PENDING") {
          throw new ConflictException(
            bet.status === "CANCELLED"
              ? "That bet is already cancelled"
              : "A settled bet cannot be cancelled",
          );
        }

        const now = new Date();
        if (
          bet.match.round.status !== "OPEN" ||
          now >= bet.match.round.bettingClosesAt
        ) {
          throw new ConflictException(
            "The cancellation window closed with betting on Friday night",
          );
        }

        const cancelled = await tx.bet.updateMany({
          where: { id: bet.id, userId, status: "PENDING" },
          data: { status: "CANCELLED", cancelledAt: now },
        });
        if (cancelled.count !== 1) {
          throw new ConflictException("That bet is no longer cancellable");
        }
        await applyWalletTransaction(
          tx,
          userId,
          "REFUND",
          bet.stake,
          `bet:${bet.id}:refund`,
        );
        const [updatedBet, user] = await Promise.all([
          tx.bet.findUniqueOrThrow({ where: { id: bet.id } }),
          tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: { coinBalance: true },
          }),
        ]);
        return {
          bet: { ...updatedBet, oddsTaken: Number(updatedBet.oddsTaken) },
          refundAmount: bet.stake,
          coinBalance: user.coinBalance,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
