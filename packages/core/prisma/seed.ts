import { readFileSync } from "node:fs";
import {
  SQUAD_GENERATION_VERSION,
  createOddsQuotes,
  generateLeagueSquads,
  type GeneratedPlayer,
  type GeneratedTeamSquad,
  type PlayerIdentity,
} from "@fb/shared";
import { Prisma, openNextRound, prisma } from "../src/index.js";
import {
  TEAM_SEED_DEFINITIONS,
  type TeamSeedDefinition,
} from "./team-seed-data.js";

interface RawPlayerIdentity {
  first_name?: unknown;
  last_name?: unknown;
}

// The generated XI is the migrated baseline for every club, including any
// unresolved fixture whose deadline predates this deployment.
const SYSTEM_LINEUP_EFFECTIVE_AT = new Date("2000-01-01T00:00:00.000Z");

function loadPlayerIdentities(): PlayerIdentity[] {
  const source = readFileSync(
    new URL("./data/player-identities-v1.json", import.meta.url),
    "utf8",
  );
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed)) {
    throw new Error("Player identity data must be a JSON array");
  }

  return parsed.map((value, index) => {
    if (!value || typeof value !== "object") {
      throw new Error(`Player identity ${index} must be an object`);
    }
    const row = value as RawPlayerIdentity;
    if (typeof row.first_name !== "string" || typeof row.last_name !== "string") {
      throw new Error(`Player identity ${index} requires first_name and last_name`);
    }
    return { firstName: row.first_name, lastName: row.last_name };
  });
}

function profileData(definition: TeamSeedDefinition) {
  return {
    name: definition.name,
    slug: definition.slug,
    abbreviation: definition.abbreviation,
    shortName: definition.shortName,
    city: definition.city,
    stadiumName: definition.stadiumName,
    foundedYear: definition.foundedYear,
    primaryColor: definition.primaryColor,
    secondaryColor: definition.secondaryColor,
    shirtTextColor: definition.shirtTextColor,
    crestImageUrl: definition.crestImageUrl,
  };
}

async function seedTeams(): Promise<void> {
  const existingTeams = await prisma.team.findMany({
    select: { id: true, name: true },
  });
  const supportedNames = new Set<string>(
    TEAM_SEED_DEFINITIONS.flatMap((definition) => [
      definition.legacyName,
      definition.name,
    ]),
  );
  const unknownTeams = existingTeams.filter(
    (existing) => !supportedNames.has(existing.name),
  );
  if (unknownTeams.length > 0) {
    throw new Error(
      `Cannot seed over unknown team rows: ${unknownTeams.map(({ name }) => name).join(", ")}.`,
    );
  }

  const existingByName = new Map(
    existingTeams.map((existing) => [existing.name, existing]),
  );
  const writes = TEAM_SEED_DEFINITIONS.map((definition) => {
    const legacyTeam = existingByName.get(definition.legacyName);
    const currentTeam = existingByName.get(definition.name);
    if (legacyTeam && currentTeam) {
      throw new Error(
        `Cannot seed ${definition.name}: both legacy and current rows exist.`,
      );
    }

    const existing = currentTeam ?? legacyTeam;
    if (existing) {
      // Ratings and football data are deliberately not overwritten on restart.
      return prisma.team.update({
        where: { id: existing.id },
        data: profileData(definition),
      });
    }

    const initialRating = new Prisma.Decimal(definition.targetStrength);
    return prisma.team.create({
      data: {
        ...profileData(definition),
        strengthRating: initialRating,
        attackRating: initialRating,
        midfieldRating: initialRating,
        defenseRating: initialRating,
        goalkeeperRating: initialRating,
      },
    });
  });

  await prisma.$transaction(writes);
}

function playerCreateData(teamId: string, player: GeneratedPlayer) {
  const common = {
    generationKey: player.generationKey,
    teamId,
    firstName: player.firstName,
    lastName: player.lastName,
    nationalityCode: player.nationalityCode,
    shirtNumber: player.shirtNumber,
    primaryPosition: player.primaryPosition,
    secondaryPositions: [...player.secondaryPositions],
    overallRating: player.overall,
  };

  return player.kind === "GOALKEEPER"
    ? {
        ...common,
        diving: player.attributes.diving,
        handling: player.attributes.handling,
        kicking: player.attributes.kicking,
        reflexes: player.attributes.reflexes,
        speed: player.attributes.speed,
        positioning: player.attributes.positioning,
      }
    : {
        ...common,
        pace: player.attributes.pace,
        shooting: player.attributes.shooting,
        passing: player.attributes.passing,
        dribbling: player.attributes.dribbling,
        defending: player.attributes.defending,
        physical: player.attributes.physical,
      };
}

function expectedLineupKey(teamSlug: string, index: number): string {
  return `${SQUAD_GENERATION_VERSION}:${teamSlug}:lineup:${index + 1}`;
}

async function verifyExistingSquad(
  tx: Prisma.TransactionClient,
  teamId: string,
  teamSlug: string,
  generated: GeneratedTeamSquad,
): Promise<void> {
  const [players, lineups, team] = await Promise.all([
    tx.player.findMany({
      where: { teamId },
      select: { generationKey: true },
    }),
    tx.teamLineup.findMany({
      where: {
        teamId,
        generationKey: {
          in: generated.lineups.map((_, index) =>
            expectedLineupKey(teamSlug, index),
          ),
        },
      },
      select: {
        id: true,
        generationKey: true,
        state: true,
        _count: { select: { slots: true } },
      },
    }),
    tx.team.findUniqueOrThrow({
      where: { id: teamId },
      select: {
        currentOfficialLineupId: true,
        currentOfficialLineup: {
          select: { id: true, teamId: true, source: true, state: true },
        },
      },
    }),
  ]);

  const expectedPlayers = new Set(
    generated.players.map(({ generationKey }) => generationKey),
  );
  if (
    players.length !== generated.players.length ||
    players.some(({ generationKey }) => !expectedPlayers.has(generationKey))
  ) {
    throw new Error(
      `${teamSlug} already has a squad from a different generation; migrate it explicitly.`,
    );
  }
  const expectedOfficialKey = expectedLineupKey(teamSlug, 0);
  const officialLineup = lineups.find(
    ({ generationKey }) => generationKey === expectedOfficialKey,
  );
  const generatedAlternatives = lineups.filter(
    ({ generationKey }) => generationKey !== expectedOfficialKey,
  );
  const current = team.currentOfficialLineup;
  const generatedIsCurrent = current?.id === officialLineup?.id;
  const validCurrent = current && current.teamId === teamId && (
    (generatedIsCurrent && current.source === "SYSTEM" && current.state === "ACTIVE") ||
    (!generatedIsCurrent && current.source === "MANAGER" && current.state === "ACTIVE")
  );
  if (
    lineups.length !== 3 ||
    lineups.some(({ _count }) => _count.slots !== 11) ||
    generatedAlternatives.some(({ state }) => state !== "ALTERNATIVE") ||
    !officialLineup ||
    !validCurrent ||
    team.currentOfficialLineupId !== current.id ||
    (generatedIsCurrent
      ? officialLineup.state !== "ACTIVE"
      : officialLineup.state !== "ARCHIVED")
  ) {
    throw new Error(`${teamSlug} has an incomplete generated lineup backfill.`);
  }
}

async function createSquad(
  tx: Prisma.TransactionClient,
  teamId: string,
  teamSlug: string,
  generated: GeneratedTeamSquad,
): Promise<void> {
  await tx.player.createMany({
    data: generated.players.map((player) => playerCreateData(teamId, player)),
  });
  const storedPlayers = await tx.player.findMany({
    where: { teamId },
    select: { id: true, generationKey: true },
  });
  const playerIds = new Map(
    storedPlayers.map((player) => [player.generationKey, player.id]),
  );

  let officialLineupId: string | null = null;
  const publishedAt = SYSTEM_LINEUP_EFFECTIVE_AT;
  for (const [lineupIndex, lineup] of generated.lineups.entries()) {
    const created = await tx.teamLineup.create({
      data: {
        generationKey: expectedLineupKey(teamSlug, lineupIndex),
        teamId,
        label: lineup.label,
        formation: lineup.formation,
        source: "SYSTEM",
        state: lineup.official ? "ACTIVE" : "ALTERNATIVE",
        publishedAt,
        slots: {
          create: lineup.ratings.assignments.map((assignment, sortOrder) => {
            const playerId = playerIds.get(assignment.player.generationKey);
            if (!playerId) {
              throw new Error(
                `Generated player ${assignment.player.generationKey} was not stored`,
              );
            }
            return {
              playerId,
              slotKey: assignment.slotKey,
              sortOrder,
              slotPosition: assignment.slotPosition,
              unit: assignment.unit,
            };
          }),
        },
      },
    });
    if (lineup.official) officialLineupId = created.id;
  }

  if (!officialLineupId) {
    throw new Error(`${teamSlug} did not generate an official lineup`);
  }
  const ratings = generated.lineups[0].ratings;
  await tx.team.update({
    where: { id: teamId },
    data: {
      currentOfficialLineupId: officialLineupId,
      strengthRating: new Prisma.Decimal(ratings.overall),
      attackRating: new Prisma.Decimal(ratings.attack),
      midfieldRating: new Prisma.Decimal(ratings.midfield),
      defenseRating: new Prisma.Decimal(ratings.defense),
      goalkeeperRating: new Prisma.Decimal(ratings.goalkeeper),
    },
  });
}

async function seedSquads(): Promise<number> {
  const storedTeams = await prisma.team.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, slug: true },
  });
  const targetBySlug = new Map(
    TEAM_SEED_DEFINITIONS.map((definition) => [
      definition.slug,
      definition.targetStrength,
    ]),
  );
  const generatedSquads = generateLeagueSquads(
    storedTeams.map((storedTeam) => {
      const targetStrength = targetBySlug.get(storedTeam.slug);
      if (targetStrength === undefined) {
        throw new Error(`No generation target exists for ${storedTeam.slug}`);
      }
      return { key: storedTeam.slug, targetStrength };
    }),
    loadPlayerIdentities(),
  );
  const generatedBySlug = new Map(
    generatedSquads.map((generated) => [generated.teamKey, generated]),
  );

  let createdCount = 0;
  for (const storedTeam of storedTeams) {
    const generated = generatedBySlug.get(storedTeam.slug);
    if (!generated) {
      throw new Error(`Squad generation failed for ${storedTeam.slug}`);
    }
    const created = await prisma.$transaction(async (tx) => {
      const playerCount = await tx.player.count({
        where: { teamId: storedTeam.id },
      });
      if (playerCount === 23) {
        await verifyExistingSquad(
          tx,
          storedTeam.id,
          storedTeam.slug,
          generated,
        );
        return false;
      }
      if (playerCount !== 0) {
        throw new Error(
          `${storedTeam.slug} has a partial ${playerCount}/23 player backfill.`,
        );
      }
      await createSquad(
        tx,
        storedTeam.id,
        storedTeam.slug,
        generated,
      );
      return true;
    });
    if (created) createdCount += 1;
  }
  return createdCount;
}

async function appendBackfillOdds(): Promise<number> {
  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      round: { status: "OPEN" },
      // Rounds opened after the squad backfill already used precise ratings.
      // Migrated pre-squad rounds have only legacy snapshots with a null key.
      odds: { none: { revisionKey: { not: null } } },
    },
    include: { homeTeam: true, awayTeam: true },
  });
  let createdCount = 0;
  for (const match of matches) {
    const quotes = createOddsQuotes(
      Number(match.homeTeam.strengthRating),
      Number(match.awayTeam.strengthRating),
    );
    const result = await prisma.oddsSnapshot.createMany({
      data: quotes.map(({ market, selection, odds }) => ({
        matchId: match.id,
        revisionKey: `${SQUAD_GENERATION_VERSION}:backfill`,
        market,
        selection,
        odds: new Prisma.Decimal(odds),
      })),
      skipDuplicates: true,
    });
    createdCount += result.count;
  }
  return createdCount;
}

async function seed(): Promise<void> {
  await seedTeams();
  const createdSquads = await seedSquads();
  const appendedOdds = await appendBackfillOdds();
  const round = await openNextRound(prisma, {
    timezone: process.env.APP_TZ ?? "Europe/Madrid",
    topupAmount: Number(process.env.TOPUP_AMOUNT ?? 200),
  });
  console.info(
    `Seeded ${TEAM_SEED_DEFINITIONS.length} teams; created ${createdSquads} squads; appended ${appendedOdds} odds; round ${round.weekNumber} ${round.created ? "opened" : "already open"}.`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
