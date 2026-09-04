import { Injectable } from "@nestjs/common";
import { prisma } from "@fb/core";
import { buildBettingLeaderboard } from "./leaderboard-ranking.js";

@Injectable()
export class LeaderboardService {
  async list() {
    return prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { deactivatedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUpdatedAt: true,
          coinBalance: true,
          createdAt: true,
          dtAssignment: {
            select: {
              team: {
                select: {
                  id: true,
                  name: true,
                  crestImageUrl: true,
                },
              },
            },
          },
        },
      });
      const betGroups = await tx.bet.groupBy({
        by: ["userId", "status"],
        orderBy: [{ userId: "asc" }, { status: "asc" }],
        _count: { _all: true },
        _sum: { stake: true, payout: true },
      });

      return buildBettingLeaderboard(
        users.map(({ dtAssignment, ...user }) => ({
          ...user,
          team: dtAssignment?.team ?? null,
        })),
        betGroups.map((group) => ({
          userId: group.userId,
          status: group.status,
          count: group._count._all,
          stake: group._sum.stake ?? 0,
          payout: group._sum.payout ?? 0,
        })),
      );
    });
  }
}
