import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, prisma, type Player } from "@fb/core";
import {
  PLAYER_POSITIONS,
  calculateLineupRatings,
  createOddsQuotes,
  isFormation,
  type Formation,
  type ManagerTeamProfileDto,
  type MatchResultPayload,
  type PublishTeamLineupResultDto,
  type PublicAlternativeLineupDto,
  type PublicOfficialLineupDto,
  type PublicPlayerDto,
  type PublicTeamFixtureDto,
  type PublicTeamMatchHistoryPageDto,
  type PublicTeamProfileDto,
  type PublicTeamSummaryDto,
} from "@fb/shared";
import { isPrismaError } from "../common/prisma-errors.js";
import { serializeTeam } from "../common/team-response.js";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import { managerAliasBase } from "../leaderboard/leaderboard-ranking.js";
import { StandingsService } from "../standings/standings.service.js";
import type { SaveLineupDraftDto, SaveLineupDto } from "./teams.dto.js";

interface SummaryTeam {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  shirtTextColor: string;
  crestImageUrl: string | null;
  strengthRating: unknown;
  dtAssignment: { userId: string } | null;
}

interface StoredLineup {
  id: string;
  label: string;
  formation: string;
  publishedAt: Date | null;
  slots: Array<{
    slotKey: string;
    player: Player;
  }>;
}

interface StoredFixture {
  id: string;
  scheduledAt: Date;
  lineupLocksAt: Date;
  status: "SCHEDULED" | "RESOLVED";
  resultPayload: unknown;
  round: { weekNumber: number };
  homeTeam: {
    id: string;
    name: string;
    crestImageUrl: string | null;
    strengthRating: unknown;
  };
  awayTeam: {
    id: string;
    name: string;
    crestImageUrl: string | null;
    strengthRating: unknown;
  };
}

function publicSummary(team: SummaryTeam, userId: string): PublicTeamSummaryDto {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    abbreviation: team.abbreviation,
    shortName: team.shortName,
    crestImageUrl: team.crestImageUrl,
    strengthRating: Number(team.strengthRating),
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    shirtTextColor: team.shirtTextColor,
    isClaimed: team.dtAssignment !== null,
    isMine: team.dtAssignment?.userId === userId,
  };
}

function requiredAttribute(value: number | null, label: string): number {
  if (value === null) throw new Error(`Player is missing ${label}`);
  return value;
}

function toPublicPlayer(player: Player): PublicPlayerDto {
  const base = {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    nationalityCode: player.nationalityCode,
    shirtNumber: player.shirtNumber,
    overall: player.overallRating,
    imageUrl: player.imageUrl,
  };

  if (player.primaryPosition === "GK") {
    if (player.secondaryPositions.length !== 0) {
      throw new Error("A goalkeeper cannot have an outfield secondary position");
    }
    return {
      ...base,
      kind: "GOALKEEPER",
      primaryPosition: "GK",
      secondaryPositions: [],
      attributes: {
        diving: requiredAttribute(player.diving, "diving"),
        handling: requiredAttribute(player.handling, "handling"),
        kicking: requiredAttribute(player.kicking, "kicking"),
        reflexes: requiredAttribute(player.reflexes, "reflexes"),
        speed: requiredAttribute(player.speed, "speed"),
        positioning: requiredAttribute(player.positioning, "positioning"),
      },
    };
  }

  const secondaryPositions = player.secondaryPositions.map((position) => {
    if (position === "GK") {
      throw new Error("An outfield player cannot have GK as a secondary position");
    }
    return position;
  });
  return {
    ...base,
    kind: "OUTFIELD",
    primaryPosition: player.primaryPosition,
    secondaryPositions,
    attributes: {
      pace: requiredAttribute(player.pace, "pace"),
      shooting: requiredAttribute(player.shooting, "shooting"),
      passing: requiredAttribute(player.passing, "passing"),
      dribbling: requiredAttribute(player.dribbling, "dribbling"),
      defending: requiredAttribute(player.defending, "defending"),
      physical: requiredAttribute(player.physical, "physical"),
    },
  };
}

function rateLineup(lineup: StoredLineup) {
  if (!isFormation(lineup.formation)) {
    throw new Error(`Unsupported stored formation ${lineup.formation}`);
  }
  return calculateLineupRatings(
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
}

function toOfficialLineup(lineup: StoredLineup): PublicOfficialLineupDto {
  const ratings = rateLineup(lineup);
  return {
    id: lineup.id,
    label: lineup.label,
    formation: ratings.formation,
    publishedAt: lineup.publishedAt?.toISOString() ?? null,
    overall: ratings.overall,
    attack: ratings.attack,
    midfield: ratings.midfield,
    defense: ratings.defense,
    goalkeeper: ratings.goalkeeper,
    assignments: ratings.assignments.map((assignment) => ({
      slotKey: assignment.slotKey,
      playerId: assignment.player.id,
      slotPosition: assignment.slotPosition,
      unit: assignment.unit,
      positionPenalty: assignment.positionPenalty,
      adjustedRating: assignment.adjustedRating,
    })),
  };
}

function toAlternativeLineup(
  lineup: StoredLineup,
): PublicAlternativeLineupDto {
  const ratings = rateLineup(lineup);
  return {
    id: lineup.id,
    label: lineup.label,
    formation: ratings.formation,
    overall: ratings.overall,
    attack: ratings.attack,
    midfield: ratings.midfield,
    defense: ratings.defense,
    goalkeeper: ratings.goalkeeper,
  };
}

function readResult(payload: unknown): MatchResultPayload | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const fields = [
    "homeScore",
    "awayScore",
    "homeCards",
    "awayCards",
    "homeCorners",
    "awayCorners",
  ] as const;
  if (
    fields.some(
      (field) =>
        !Number.isSafeInteger(record[field]) || (record[field] as number) < 0,
    )
  ) {
    return null;
  }
  return Object.fromEntries(
    fields.map((field) => [field, record[field]]),
  ) as unknown as MatchResultPayload;
}

function toFixture(match: StoredFixture): PublicTeamFixtureDto {
  return {
    id: match.id,
    weekNumber: match.round.weekNumber,
    scheduledAt: match.scheduledAt.toISOString(),
    lineupLocksAt: match.lineupLocksAt.toISOString(),
    status: match.status,
    homeTeam: {
      ...match.homeTeam,
      strengthRating: Number(match.homeTeam.strengthRating),
    },
    awayTeam: {
      ...match.awayTeam,
      strengthRating: Number(match.awayTeam.strengthRating),
    },
    result: readResult(match.resultPayload),
  };
}

const fixtureInclude = {
  round: { select: { weekNumber: true } },
  homeTeam: {
    select: {
      id: true,
      name: true,
      crestImageUrl: true,
      strengthRating: true,
    },
  },
  awayTeam: {
    select: {
      id: true,
      name: true,
      crestImageUrl: true,
      strengthRating: true,
    },
  },
} as const;

const MATCH_HISTORY_PAGE_SIZE = 10;

function rateDraft(
  formation: Formation,
  assignments: SaveLineupDraftDto["assignments"],
  players: Player[],
) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  if (
    new Set(assignments.map(({ playerId }) => playerId)).size !==
    assignments.length
  ) {
    throw new BadRequestException("A player cannot occupy more than one lineup slot");
  }
  if (playersById.size !== assignments.length) {
    throw new BadRequestException("Every selected player must belong to your club");
  }

  try {
    return calculateLineupRatings(
      formation,
      assignments.map(({ slotKey, playerId }) => {
        const player = playersById.get(playerId);
        if (!player) {
          throw new Error("Every selected player must belong to your club");
        }
        return {
          slotKey,
          player: {
            id: player.id,
            primaryPosition: player.primaryPosition,
            secondaryPositions: player.secondaryPositions,
            overall: player.overallRating,
          },
        };
      }),
    );
  } catch (error) {
    throw new BadRequestException(
      error instanceof Error ? error.message : "The lineup is invalid",
    );
  }
}

function lineupSlotData(
  ratings: ReturnType<typeof rateDraft> | ReturnType<typeof rateLineup>,
) {
  return ratings.assignments.map((assignment, sortOrder) => ({
    playerId: assignment.player.id,
    slotKey: assignment.slotKey,
    sortOrder,
    slotPosition: assignment.slotPosition,
    unit: assignment.unit,
  }));
}

function sameLineup(left: StoredLineup, right: StoredLineup): boolean {
  if (left.formation !== right.formation || left.slots.length !== right.slots.length) {
    return false;
  }
  const rightBySlot = new Map(
    right.slots.map(({ slotKey, player }) => [slotKey, player.id]),
  );
  return left.slots.every(
    ({ slotKey, player }) => rightBySlot.get(slotKey) === player.id,
  );
}

const storedLineupInclude = {
  slots: {
    orderBy: { sortOrder: "asc" as const },
    include: { player: true },
  },
} as const;

@Injectable()
export class TeamsService {
  constructor(
    @Inject(LeaderboardGateway)
    private readonly liveUpdates: LeaderboardGateway,
    @Inject(StandingsService)
    private readonly standings: StandingsService,
  ) {}

  async list(userId: string): Promise<PublicTeamSummaryDto[]> {
    const teams = await prisma.team.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        abbreviation: true,
        shortName: true,
        primaryColor: true,
        secondaryColor: true,
        shirtTextColor: true,
        crestImageUrl: true,
        strengthRating: true,
        dtAssignment: { select: { userId: true } },
      },
    });

    return teams.map((team) => publicSummary(team, userId));
  }

  async detail(userId: string, teamId: string): Promise<PublicTeamProfileDto> {
    const [team, table] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        include: {
          dtAssignment: {
            select: { userId: true, user: { select: { email: true } } },
          },
          players: true,
          currentOfficialLineup: {
            include: {
              slots: {
                orderBy: { sortOrder: "asc" },
                include: { player: true },
              },
            },
          },
          lineups: {
            where: { state: "ALTERNATIVE" },
            orderBy: [{ generationKey: "asc" }, { id: "asc" }],
            include: {
              slots: {
                orderBy: { sortOrder: "asc" },
                include: { player: true },
              },
            },
          },
        },
      }),
      this.standings.current(),
    ]);
    if (!team) throw new NotFoundException("Team not found");

    const firstWeekNumber = (table.seasonNumber - 1) * table.roundsPerSeason + 1;
    const lastWeekNumber = firstWeekNumber + table.roundsPerSeason - 1;
    const matchWhere: Prisma.MatchWhereInput = {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      round: {
        weekNumber: { gte: firstWeekNumber, lte: lastWeekNumber },
      },
    };
    const [recentResults, upcomingFixtures] = await Promise.all([
      prisma.match.findMany({
        where: { ...matchWhere, status: "RESOLVED" },
        orderBy: [{ scheduledAt: "desc" }, { id: "desc" }],
        take: 5,
        include: fixtureInclude,
      }),
      prisma.match.findMany({
        where: { ...matchWhere, status: "SCHEDULED" },
        orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
        take: 5,
        include: fixtureInclude,
      }),
    ]);

    const summary = publicSummary(team, userId);
    const standing = table.entries.find((entry) => entry.team.id === teamId);
    const squad = team.players
      .map(toPublicPlayer)
      .sort(
        (left, right) =>
          PLAYER_POSITIONS.indexOf(left.primaryPosition) -
            PLAYER_POSITIONS.indexOf(right.primaryPosition) ||
          right.overall - left.overall ||
          left.shirtNumber - right.shirtNumber,
      );

    return {
      ...summary,
      city: team.city,
      stadiumName: team.stadiumName,
      foundedYear: team.foundedYear,
      attackRating: Number(team.attackRating),
      midfieldRating: Number(team.midfieldRating),
      defenseRating: Number(team.defenseRating),
      goalkeeperRating: Number(team.goalkeeperRating),
      manager: team.dtAssignment
        ? { displayName: managerAliasBase(team.dtAssignment.user.email) }
        : null,
      standing: standing
        ? {
            position: standing.position,
            played: standing.played,
            wins: standing.wins,
            draws: standing.draws,
            losses: standing.losses,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference,
            points: standing.points,
            form: standing.form,
          }
        : null,
      officialLineup: team.currentOfficialLineup
        ? toOfficialLineup(team.currentOfficialLineup)
        : null,
      alternatives: team.lineups.map(toAlternativeLineup),
      squad,
      recentResults: recentResults.map(toFixture),
      upcomingFixtures: upcomingFixtures.map(toFixture),
    };
  }

  async matchHistory(
    teamId: string,
    cursor?: string,
  ): Promise<PublicTeamMatchHistoryPageDto> {
    const [team, cursorMatch] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true },
      }),
      cursor
        ? prisma.match.findFirst({
            where: {
              id: cursor,
              OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
            },
            select: { id: true, scheduledAt: true },
          })
        : null,
    ]);
    if (!team) throw new NotFoundException("Team not found");
    if (cursor && !cursorMatch) {
      throw new BadRequestException("Invalid match-history cursor");
    }

    const matches = await prisma.match.findMany({
      where: {
        status: "RESOLVED",
        AND: [
          { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
          ...(cursorMatch
            ? [{
                OR: [
                  { scheduledAt: { lt: cursorMatch.scheduledAt } },
                  {
                    scheduledAt: cursorMatch.scheduledAt,
                    id: { lt: cursorMatch.id },
                  },
                ],
              }]
            : []),
        ],
      },
      orderBy: [{ scheduledAt: "desc" }, { id: "desc" }],
      take: MATCH_HISTORY_PAGE_SIZE + 1,
      include: fixtureInclude,
    });
    const hasMore = matches.length > MATCH_HISTORY_PAGE_SIZE;
    const page = matches.slice(0, MATCH_HISTORY_PAGE_SIZE);

    return {
      matches: page.map(toFixture),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async managerDetail(userId: string): Promise<ManagerTeamProfileDto> {
    const assignment = await prisma.dTAssignment.findUnique({
      where: { userId },
      include: {
        draftLineup: { include: storedLineupInclude },
      },
    });
    if (!assignment) {
      throw new NotFoundException("Claim a team before managing a lineup");
    }

    const profile = await this.detail(userId, assignment.teamId);
    return {
      ...profile,
      tactics:
        assignment.tactics &&
        typeof assignment.tactics === "object" &&
        !Array.isArray(assignment.tactics)
          ? (assignment.tactics as Record<string, unknown>)
          : null,
      draftLineup: assignment.draftLineup
        ? toOfficialLineup(assignment.draftLineup)
        : null,
    };
  }

  async saveDraft(
    userId: string,
    input: SaveLineupDraftDto,
  ): Promise<ManagerTeamProfileDto> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const assignment = await tx.dTAssignment.findUnique({
              where: { userId },
              select: { id: true, teamId: true, draftLineupId: true },
            });
            if (!assignment) {
              throw new NotFoundException(
                "Claim a team before managing a lineup",
              );
            }

            const players = await tx.player.findMany({
              where: {
                teamId: assignment.teamId,
                id: { in: input.assignments.map(({ playerId }) => playerId) },
              },
            });
            const ratings = rateDraft(input.formation, input.assignments, players);
            const slots = lineupSlotData(ratings);

            if (assignment.draftLineupId) {
              const updated = await tx.teamLineup.updateMany({
                where: {
                  id: assignment.draftLineupId,
                  teamId: assignment.teamId,
                  state: "DRAFT",
                },
                data: { formation: input.formation, label: "Draft XI" },
              });
              if (updated.count !== 1) {
                throw new ConflictException(
                  "The stored draft is no longer editable; reload and retry",
                );
              }
              await tx.teamLineupSlot.deleteMany({
                where: { lineupId: assignment.draftLineupId },
              });
              await tx.teamLineupSlot.createMany({
                data: slots.map((slot) => ({
                  ...slot,
                  lineupId: assignment.draftLineupId as string,
                })),
              });
            } else {
              const draft = await tx.teamLineup.create({
                data: {
                  teamId: assignment.teamId,
                  label: "Draft XI",
                  formation: input.formation,
                  source: "MANAGER",
                  state: "DRAFT",
                  slots: { create: slots },
                },
              });
              await tx.dTAssignment.update({
                where: { id: assignment.id },
                data: { draftLineupId: draft.id },
              });
            }
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return this.managerDetail(userId);
      } catch (error) {
        if (isPrismaError(error, "P2034") && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictException("The draft could not be saved; please retry");
  }

  async publishDraft(
    userId: string,
  ): Promise<PublishTeamLineupResultDto> {
    let publication:
      | { changed: boolean; teamId: string; repricedMatchIds: string[] }
      | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        publication = await prisma.$transaction(
          (tx) => this.publishDraftInTransaction(tx, userId),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        if (isPrismaError(error, "P2034") && attempt < 2) continue;
        throw error;
      }
    }
    if (!publication) {
      throw new ConflictException("The lineup could not be published; please retry");
    }

    const profile = await this.managerDetail(userId);
    if (publication.changed) {
      this.liveUpdates.emitTeamUpdate({
        teamId: publication.teamId,
        lineupId: profile.officialLineup?.id ?? null,
        strengthRating: profile.strengthRating,
      });
      await this.liveUpdates.broadcast().catch(() => undefined);
    }
    return { ...publication, profile };
  }

  private async publishDraftInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<{ changed: boolean; teamId: string; repricedMatchIds: string[] }> {
    const assignment = await tx.dTAssignment.findUnique({
      where: { userId },
      include: {
        draftLineup: { include: storedLineupInclude },
        team: {
          include: {
            currentOfficialLineup: { include: storedLineupInclude },
          },
        },
      },
    });
    if (!assignment) {
      throw new NotFoundException("Claim a team before publishing a lineup");
    }
    if (!assignment.draftLineup) {
      throw new BadRequestException("Save a complete draft before publishing");
    }

    const draft = assignment.draftLineup;
    const ratings = rateLineup(draft);
    if (
      assignment.team.currentOfficialLineup &&
      sameLineup(assignment.team.currentOfficialLineup, draft)
    ) {
      return { changed: false, teamId: assignment.teamId, repricedMatchIds: [] };
    }

    const wallClock = new Date();
    const previousPublication =
      assignment.team.currentOfficialLineup?.publishedAt?.getTime() ?? 0;
    const publishedAt = new Date(
      Math.max(wallClock.getTime(), previousPublication + 1),
    );
    const published = await tx.teamLineup.create({
      data: {
        teamId: assignment.teamId,
        label: "Manager XI",
        formation: ratings.formation,
        source: "MANAGER",
        state: "ACTIVE",
        publishedAt,
        slots: { create: lineupSlotData(ratings) },
      },
    });
    await tx.teamLineup.updateMany({
      where: {
        teamId: assignment.teamId,
        state: "ACTIVE",
        id: { not: published.id },
      },
      data: { state: "ARCHIVED" },
    });
    await tx.team.update({
      where: { id: assignment.teamId },
      data: {
        currentOfficialLineupId: published.id,
        strengthRating: new Prisma.Decimal(ratings.overall),
        attackRating: new Prisma.Decimal(ratings.attack),
        midfieldRating: new Prisma.Decimal(ratings.midfield),
        defenseRating: new Prisma.Decimal(ratings.defense),
        goalkeeperRating: new Prisma.Decimal(ratings.goalkeeper),
      },
    });
    await tx.dTAssignment.update({
      where: { id: assignment.id },
      data: { formation: ratings.formation },
    });

    const openMatches = await tx.match.findMany({
      where: {
        status: "SCHEDULED",
        OR: [
          { homeTeamId: assignment.teamId },
          { awayTeamId: assignment.teamId },
        ],
        round: { status: "OPEN", bettingClosesAt: { gt: publishedAt } },
      },
      include: {
        homeTeam: { select: { strengthRating: true } },
        awayTeam: { select: { strengthRating: true } },
      },
    });
    for (const match of openMatches) {
      const quotes = createOddsQuotes(
        Number(match.homeTeam.strengthRating),
        Number(match.awayTeam.strengthRating),
      );
      await tx.oddsSnapshot.createMany({
        data: quotes.map(({ market, selection, odds }) => ({
          matchId: match.id,
          revisionKey: `lineup:${published.id}`,
          market,
          selection,
          odds: new Prisma.Decimal(odds),
          computedAt: publishedAt,
        })),
      });
    }

    return {
      changed: true,
      teamId: assignment.teamId,
      repricedMatchIds: openMatches.map(({ id }) => id),
    };
  }

  async claim(userId: string, teamId: string) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const assignment = await prisma.$transaction(
          async (tx) => {
            const team = await tx.team.findUnique({ where: { id: teamId } });
            if (!team) throw new NotFoundException("Team not found");

            const pendingBets = await tx.bet.count({
              where: {
                userId,
                status: "PENDING",
                match: {
                  OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                },
              },
            });
            if (pendingBets > 0) {
              throw new ConflictException(
                "Cancel pending bets involving this club before claiming it",
              );
            }

            return tx.dTAssignment.create({
              data: { userId, teamId },
              include: { team: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        this.liveUpdates.emitTeamUpdate({
          teamId: assignment.team.id,
          lineupId: assignment.team.currentOfficialLineupId,
          strengthRating: Number(assignment.team.strengthRating),
        });
        await this.liveUpdates.broadcast().catch(() => undefined);
        return { ...assignment, team: serializeTeam(assignment.team) };
      } catch (error) {
        if (isPrismaError(error, "P2034") && attempt < 2) continue;
        if (isPrismaError(error, "P2002")) {
          throw new ConflictException(
            "That team already has a DT, or you already manage another team",
          );
        }
        throw error;
      }
    }
    throw new ConflictException("The club could not be claimed; please retry");
  }

  async saveLineup(userId: string, input: SaveLineupDto) {
    const existingAssignment = await prisma.dTAssignment.findUnique({
      where: { userId },
    });
    if (!existingAssignment) {
      throw new NotFoundException("Claim a team before saving a lineup");
    }

    const assignment = await prisma.dTAssignment.update({
      where: { userId },
      data: {
        formation: input.formation.trim(),
        tactics: input.tactics as Prisma.InputJsonValue,
      },
      include: { team: true },
    });
    return { ...assignment, team: serializeTeam(assignment.team) };
  }
}
