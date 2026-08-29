import { Controller, Get, UseGuards } from "@nestjs/common";
import { prisma } from "@fb/core";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { JwtAuthGuard } from "../common/jwt-auth.guard.js";
import { serializeTeam } from "../common/team-response.js";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get("me")
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        coinBalance: true,
        createdAt: true,
        dtAssignment: {
          include: { team: true },
        },
      },
    });
    return {
      ...user,
      dtAssignment: user.dtAssignment
        ? {
            ...user.dtAssignment,
            team: serializeTeam(user.dtAssignment.team),
          }
        : null,
    };
  }

  @Get("me/ledger")
  ledger(@CurrentUser() currentUser: AuthenticatedUser) {
    return prisma.ledgerEntry.findMany({
      where: { userId: currentUser.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
  }
}
