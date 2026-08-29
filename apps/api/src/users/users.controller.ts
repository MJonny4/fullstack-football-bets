import { Controller, Get, UseGuards } from "@nestjs/common";
import { prisma } from "@fb/core";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { JwtAuthGuard } from "../common/jwt-auth.guard.js";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get("me")
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    return prisma.user.findUniqueOrThrow({
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
