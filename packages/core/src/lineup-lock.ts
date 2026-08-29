import { type PrismaClient, Prisma } from "@prisma/client";
import { calculateLineupRatings, isFormation } from "@fb/shared";

export interface LockDueLineupsOptions {
  now?: Date;
  force?: boolean;
}

export interface LockDueLineupsResult {
  lockedMatchIds: string[];
}

const lineupInclude = {
  slots: {
    orderBy: { sortOrder: "asc" as const },
    include: { player: true },
  },
} as const;

async function lockMatch(
  db: PrismaClient,
  matchId: string,
  now: Date,
  force: boolean,
): Promise<boolean> {
  return db.$transaction(
    async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { lineupSnapshots: { select: { side: true } } },
      });
      if (!match || match.status !== "SCHEDULED") return false;
      if (!force && match.lineupLocksAt > now) return false;

      let created = false;
      for (const side of ["HOME", "AWAY"] as const) {
        if (match.lineupSnapshots.some((snapshot) => snapshot.side === side)) {
          continue;
        }
        const teamId = side === "HOME" ? match.homeTeamId : match.awayTeamId;
        const lineup = await tx.teamLineup.findFirst({
          where: {
            teamId,
            state: { in: ["ACTIVE", "ARCHIVED"] },
            publishedAt: { lt: match.lineupLocksAt },
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
          include: lineupInclude,
        });
        if (!lineup) {
          throw new Error(
            `Cannot lock ${side.toLowerCase()} lineup for match ${match.id}: no official XI existed before the deadline`,
          );
        }
        if (!isFormation(lineup.formation)) {
          throw new Error(`Cannot lock unsupported formation ${lineup.formation}`);
        }
        const ratings = calculateLineupRatings(
          lineup.formation,
          lineup.slots.map(({ slotKey, player }) => ({
            slotKey,
            player: {
              id: player.id,
              primaryPosition: player.primaryPosition,
              secondaryPositions: player.secondaryPositions,
              overall: player.overallRating,
            },
          })),
        );

        await tx.matchLineupSnapshot.create({
          data: {
            matchId: match.id,
            teamId,
            side,
            sourceLineupId: lineup.id,
            formation: ratings.formation,
            lineupDeadline: match.lineupLocksAt,
            lockedAt: now,
            overallRating: new Prisma.Decimal(ratings.overall),
            attackRating: new Prisma.Decimal(ratings.attack),
            midfieldRating: new Prisma.Decimal(ratings.midfield),
            defenseRating: new Prisma.Decimal(ratings.defense),
            goalkeeperRating: new Prisma.Decimal(ratings.goalkeeper),
            slots: {
              create: ratings.assignments.map((assignment, sortOrder) => ({
                playerId: assignment.player.id,
                slotKey: assignment.slotKey,
                sortOrder,
                assignedPosition: assignment.slotPosition,
                unit: assignment.unit,
                sourceOverall: assignment.player.overall,
                positionPenalty: assignment.positionPenalty,
                adjustedRating: assignment.adjustedRating,
              })),
            },
          },
        });
        created = true;
      }
      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function lockDueMatchLineups(
  db: PrismaClient,
  options: LockDueLineupsOptions = {},
): Promise<LockDueLineupsResult> {
  const now = options.now ?? new Date();
  if (Number.isNaN(now.getTime())) throw new RangeError("now is invalid");
  const force = options.force ?? false;
  const candidates = await db.match.findMany({
    where: {
      status: "SCHEDULED",
      ...(force ? {} : { lineupLocksAt: { lte: now } }),
      OR: [
        { lineupSnapshots: { none: { side: "HOME" } } },
        { lineupSnapshots: { none: { side: "AWAY" } } },
      ],
    },
    select: { id: true },
    orderBy: [{ lineupLocksAt: "asc" }, { id: "asc" }],
  });

  const lockedMatchIds: string[] = [];
  for (const { id } of candidates) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        if (await lockMatch(db, id, now, force)) lockedMatchIds.push(id);
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2002" || error.code === "P2034") &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }
  }
  return { lockedMatchIds };
}
