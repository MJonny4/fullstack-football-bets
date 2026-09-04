import { Injectable } from "@nestjs/common";
import { prisma } from "@fb/core";
import {
  createOpaqueToken,
  hashOpaqueToken,
  sessionDurationMs,
} from "./session.js";

@Injectable()
export class SessionService {
  async create(userId: string) {
    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + sessionDurationMs());
    const session = await prisma.userSession.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(token),
        expiresAt,
      },
      select: { id: true },
    });
    void prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => undefined);
    return { id: session.id, token, expiresAt };
  }

  async findActive(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.user.deactivatedAt
    ) {
      return null;
    }

    if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1_000) {
      void prisma.userSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      }).catch(() => undefined);
    }
    return session;
  }

  async revoke(sessionId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeOthers(userId: string, currentSessionId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId, id: { not: currentSessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
