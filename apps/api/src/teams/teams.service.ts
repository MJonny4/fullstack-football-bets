import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, prisma } from "@fb/core";
import { isPrismaError } from "../common/prisma-errors.js";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import type { SaveLineupDto } from "./teams.dto.js";

@Injectable()
export class TeamsService {
  constructor(private readonly liveUpdates: LeaderboardGateway) {}

  async list(userId: string) {
    const teams = await prisma.team.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: {
        dtAssignment: {
          select: {
            userId: true,
            claimedAt: true,
            formation: true,
            tactics: true,
          },
        },
      },
    });

    return teams.map((team) => ({
      ...team,
      isClaimed: Boolean(team.dtAssignment),
      isMine: team.dtAssignment?.userId === userId,
    }));
  }

  async claim(userId: string, teamId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    try {
      const assignment = await prisma.dTAssignment.create({
        data: { userId, teamId },
        include: { team: true },
      });
      await this.liveUpdates.broadcast();
      return assignment;
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictException(
          "That team already has a DT, or you already manage another team",
        );
      }
      throw error;
    }
  }

  async saveLineup(userId: string, input: SaveLineupDto) {
    const assignment = await prisma.dTAssignment.findUnique({
      where: { userId },
    });
    if (!assignment) {
      throw new NotFoundException("Claim a team before saving a lineup");
    }

    return prisma.dTAssignment.update({
      where: { userId },
      data: {
        formation: input.formation.trim(),
        tactics: input.tactics as Prisma.InputJsonValue,
      },
      include: { team: true },
    });
  }
}
