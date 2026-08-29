import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  FORMATIONS,
  calculatePayout,
  generateLeagueSquads,
  selectBestLineup,
  type GeneratedPlayer,
  type MatchContext,
  type ResultEngine,
} from "@fb/shared";
import { lockDueMatchLineups, prisma, resolveAndSettleMatch } from "@fb/core";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/configure-app.js";
import { RESULT_ENGINE } from "../src/dev/result-engine.provider.js";

class HomeWinEngine implements ResultEngine {
  async resolve(_match: MatchContext) {
    return {
      homeScore: 2,
      awayScore: 0,
      homeCards: 2,
      awayCards: 3,
      homeCorners: 7,
      awayCorners: 4,
    };
  }
}

function testPlayerData(teamId: string, player: GeneratedPlayer) {
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
    ? { ...common, ...player.attributes }
    : { ...common, ...player.attributes };
}

async function addGeneratedSquad(teamId: string): Promise<void> {
  const generated = generateLeagueSquads(
    [{ key: `integration-profile-${teamId}`, targetStrength: 72 }],
    Array.from({ length: 23 }, (_, index) => ({
      firstName: `Profile${index}`,
      lastName: `Player${index}`,
    })),
    { generationVersion: "integration-profile-v1" },
  )[0];
  if (!generated) throw new Error("Integration squad was not generated");

  await prisma.player.createMany({
    data: generated.players.map((player) => testPlayerData(teamId, player)),
  });
  const players = await prisma.player.findMany({
    where: { teamId },
    select: { id: true, generationKey: true },
  });
  const playerIds = new Map(
    players.map((player) => [player.generationKey, player.id]),
  );
  let officialLineupId: string | null = null;
  for (const [lineupIndex, lineup] of generated.lineups.entries()) {
    const stored = await prisma.teamLineup.create({
      data: {
        generationKey: `integration-profile:${teamId}:lineup:${lineupIndex}`,
        teamId,
        label: lineup.label,
        formation: lineup.formation,
        source: "SYSTEM",
        state: lineup.official ? "ACTIVE" : "ALTERNATIVE",
        publishedAt: new Date("2026-08-29T12:00:00.000Z"),
        slots: {
          create: lineup.ratings.assignments.map((assignment, sortOrder) => {
            const playerId = playerIds.get(assignment.player.generationKey);
            if (!playerId) throw new Error("Stored player is missing");
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
    if (lineup.official) officialLineupId = stored.id;
  }
  if (!officialLineupId) throw new Error("Official test lineup is missing");
  const ratings = generated.lineups[0].ratings;
  await prisma.team.update({
    where: { id: teamId },
    data: {
      currentOfficialLineupId: officialLineupId,
      strengthRating: ratings.overall,
      attackRating: ratings.attack,
      midfieldRating: ratings.midfield,
      defenseRating: ratings.defense,
      goalkeeperRating: ratings.goalkeeper,
    },
  });
}

describe("Slice 1 HTTP lifecycle", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RESULT_ENGINE)
      .useValue(new HomeWinEngine())
      .compile();
    app = configureApp(module.createNestApplication());
    await app.init();
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.ledgerEntry.deleteMany(),
      prisma.bet.deleteMany(),
      prisma.oddsSnapshot.deleteMany(),
      prisma.match.deleteMany(),
      prisma.round.deleteMany(),
      prisma.dTAssignment.deleteMany(),
      prisma.teamLineupSlot.deleteMany(),
      prisma.teamLineup.deleteMany(),
      prisma.player.deleteMany(),
      prisma.team.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    await prisma.team.createMany({
      data: Array.from({ length: 20 }, (_, index) => ({
        name: `Integration FC ${String(index + 1).padStart(2, "0")}`,
        slug: `integration-fc-${String(index + 1).padStart(2, "0")}`,
        abbreviation: `I${String(index + 1).padStart(2, "0")}`,
        shortName: `Integration ${index + 1}`,
        city: `Test City ${index + 1}`,
        stadiumName: `Test Ground ${index + 1}`,
        foundedYear: 1900 + index,
        primaryColor: "#123456",
        secondaryColor: "#ABCDEF",
        shirtTextColor: "#FFFFFF",
        strengthRating: 60 + index,
        attackRating: 60 + index,
        midfieldRating: 60 + index,
        defenseRating: 60 + index,
        goalkeeperRating: 60 + index,
        crestImageUrl: null,
      })),
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it("builds league and bettor tables through an idempotent betting lifecycle", async () => {
    const http = app.getHttpServer();
    const credentials = {
      email: "manager@example.com",
      password: "correct-horse-battery-staple",
    };

    const signup = await request(http)
      .post("/api/auth/signup")
      .send(credentials)
      .expect(201);
    expect(signup.body.user).toMatchObject({
      email: credentials.email,
      coinBalance: 1_000,
    });
    expect(signup.body.user.passwordHash).toBeUndefined();
    const token = signup.body.accessToken as string;

    await request(http).post("/api/auth/signup").send(credentials).expect(409);
    const login = await request(http)
      .post("/api/auth/login")
      .send(credentials)
      .expect(200);
    expect(login.body.accessToken).toEqual(expect.any(String));

    const rival = await request(http)
      .post("/api/auth/signup")
      .send({ email: "rival@example.com", password: "another-secure-password" })
      .expect(201);
    const rivalToken = rival.body.accessToken as string;

    await request(http).post("/api/dev/open-round").expect(201);
    const afterTopup = await request(http)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(afterTopup.body.coinBalance).toBe(1_200);

    const current = await request(http).get("/api/rounds/current").expect(200);
    expect(current.body.matches).toHaveLength(10);
    expect(current.body.matches.every((match: { odds: unknown[] }) => match.odds.length === 24)).toBe(true);
    const match = current.body.matches[0];
    const quote = match.odds.find(
      (item: { market: string; selection: string }) =>
        item.market === "MATCH_RESULT" && item.selection === "HOME",
    );
    const awayQuote = match.odds.find(
      (item: { market: string; selection: string }) =>
        item.market === "MATCH_RESULT" && item.selection === "AWAY",
    );

    const emptyStandings = await request(http).get("/api/standings").expect(200);
    expect(emptyStandings.body).toMatchObject({
      seasonNumber: 1,
      currentMatchweek: 1,
      roundsPerSeason: 38,
      playedMatches: 0,
      totalMatches: 380,
      goalsScored: 0,
    });
    expect(emptyStandings.body.entries).toHaveLength(20);
    expect(emptyStandings.body.entries.every((entry: { played: number; points: number }) => entry.played === 0 && entry.points === 0)).toBe(true);

    const placed = await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        matchId: match.id,
        market: quote.market,
        selection: quote.selection,
        stake: 100,
      })
      .expect(201);
    expect(placed.body).toMatchObject({ coinBalance: 1_100 });
    expect(Number(placed.body.bet.oddsTaken)).toBe(Number(quote.odds));

    await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${rivalToken}`)
      .send({
        matchId: match.id,
        market: awayQuote.market,
        selection: awayQuote.selection,
        stake: 50,
      })
      .expect(201);

    const pendingLeaderboard = await request(http).get("/api/leaderboard").expect(200);
    expect(pendingLeaderboard.body).toHaveLength(2);
    expect(pendingLeaderboard.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: signup.body.user.id,
        rank: null,
        settledBets: 0,
        pendingBets: 1,
        settledStake: 0,
        pendingStake: 100,
        netProfit: 0,
        roiPercent: null,
        hitRatePercent: null,
      }),
      expect.objectContaining({
        userId: rival.body.user.id,
        rank: null,
        settledBets: 0,
        pendingBets: 1,
        pendingStake: 50,
      }),
    ]));
    expect(pendingLeaderboard.body.every((entry: Record<string, unknown>) => !("email" in entry) && !("passwordHash" in entry))).toBe(true);

    await request(http).post("/api/dev/close-window").expect(201);
    await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        matchId: match.id,
        market: quote.market,
        selection: quote.selection,
        stake: 1,
      })
      .expect(409);

    const [firstResolve, concurrentResolve] = await Promise.all([
      request(http).post("/api/dev/resolve-due"),
      request(http).post("/api/dev/resolve-due"),
    ]);
    expect(firstResolve.status).toBe(201);
    expect(concurrentResolve.status).toBe(201);
    const history = await request(http)
      .get("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0]).toMatchObject({ status: "WON", stake: 100 });
    const expectedPayout = calculatePayout(100, placed.body.bet.oddsTaken);
    expect(history.body[0].payout).toBe(expectedPayout);

    const settledLeaderboard = await request(http).get("/api/leaderboard").expect(200);
    const managerRanking = settledLeaderboard.body.find(
      (entry: { userId: string }) => entry.userId === signup.body.user.id,
    );
    const rivalRanking = settledLeaderboard.body.find(
      (entry: { userId: string }) => entry.userId === rival.body.user.id,
    );
    expect(managerRanking).toMatchObject({
      rank: 1,
      displayName: "Manager",
      settledBets: 1,
      wins: 1,
      losses: 0,
      pendingBets: 0,
      settledStake: 100,
      pendingStake: 0,
      totalPayout: expectedPayout,
      netProfit: expectedPayout - 100,
      roiPercent: Math.round(((expectedPayout - 100) / 100) * 1_000) / 10,
      hitRatePercent: 100,
      provisional: true,
    });
    expect(rivalRanking).toMatchObject({
      rank: 2,
      displayName: "Rival",
      settledBets: 1,
      wins: 0,
      losses: 1,
      settledStake: 50,
      totalPayout: 0,
      netProfit: -50,
      roiPercent: -100,
      hitRatePercent: 0,
      provisional: true,
    });

    const settledMe = await request(http)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(settledMe.body.coinBalance).toBe(1_100 + expectedPayout);
    const settledBalance = settledMe.body.coinBalance;

    const settledRound = await request(http).get("/api/rounds/current").expect(200);
    expect(settledRound.body.status).toBe("SETTLED");
    expect(settledRound.body.matches.every((item: { status: string }) => item.status === "RESOLVED")).toBe(true);

    const standings = await request(http).get("/api/standings").expect(200);
    expect(standings.body.playedMatches).toBe(10);
    expect(standings.body.goalsScored).toBe(20);
    expect(standings.body.lastResolvedAt).toEqual(expect.any(String));
    expect(standings.body.entries).toHaveLength(20);
    expect(standings.body.entries.reduce((sum: number, entry: { played: number }) => sum + entry.played, 0)).toBe(20);
    expect(standings.body.entries.reduce((sum: number, entry: { wins: number }) => sum + entry.wins, 0)).toBe(10);
    expect(standings.body.entries.reduce((sum: number, entry: { losses: number }) => sum + entry.losses, 0)).toBe(10);
    expect(standings.body.entries.reduce((sum: number, entry: { goalsFor: number }) => sum + entry.goalsFor, 0)).toBe(20);
    expect(standings.body.entries.reduce((sum: number, entry: { goalsAgainst: number }) => sum + entry.goalsAgainst, 0)).toBe(20);
    expect(standings.body.entries.reduce((sum: number, entry: { points: number }) => sum + entry.points, 0)).toBe(30);
    expect(standings.body.entries[0]).toMatchObject({
      position: 1,
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goalsFor: 2,
      goalsAgainst: 0,
      goalDifference: 2,
      points: 3,
      form: ["W"],
    });

    await request(http).post("/api/dev/resolve-due").expect(201);
    const afterRetry = await request(http)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(afterRetry.body.coinBalance).toBe(settledBalance);
    const standingsAfterRetry = await request(http).get("/api/standings").expect(200);
    expect(standingsAfterRetry.body).toEqual(standings.body);
    const leaderboardAfterRetry = await request(http).get("/api/leaderboard").expect(200);
    expect(leaderboardAfterRetry.body).toEqual(settledLeaderboard.body);

    const ledger = await request(http)
      .get("/api/users/me/ledger")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(ledger.body.map((entry: { type: string }) => entry.type).sort()).toEqual([
      "PAYOUT",
      "STAKE",
      "TOPUP",
      "TOPUP",
    ]);

    const teams = await request(http)
      .get("/api/teams")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const [firstTeam, secondTeam] = teams.body;
    await request(http)
      .post(`/api/teams/${firstTeam.id}/claim`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    await request(http)
      .post(`/api/teams/${secondTeam.id}/claim`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
    await request(http)
      .put("/api/teams/me/lineup")
      .set("Authorization", `Bearer ${token}`)
      .send({ formation: "4-3-3", tactics: { press: "high", width: 60 } })
      .expect(200);
    await addGeneratedSquad(firstTeam.id);

    const publicTeams = await request(http)
      .get("/api/teams")
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(200);
    const publicClaimedTeam = publicTeams.body.find(
      (team: { id: string }) => team.id === firstTeam.id,
    );
    expect(publicClaimedTeam).toMatchObject({
      id: firstTeam.id,
      isClaimed: true,
      isMine: false,
    });
    expect(publicClaimedTeam.dtAssignment).toBeUndefined();
    expect(JSON.stringify(publicClaimedTeam)).not.toContain("userId");
    expect(JSON.stringify(publicClaimedTeam)).not.toContain("tactics");

    const ownProfile = await request(http)
      .get(`/api/teams/${firstTeam.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(ownProfile.body).toMatchObject({
      id: firstTeam.id,
      isClaimed: true,
      isMine: true,
      manager: { displayName: "Manager" },
      officialLineup: expect.objectContaining({
        assignments: expect.any(Array),
      }),
    });
    expect(ownProfile.body.squad).toHaveLength(23);
    expect(ownProfile.body.officialLineup.assignments).toHaveLength(11);
    expect(ownProfile.body.alternatives).toHaveLength(2);
    expect(ownProfile.body.alternatives.every((lineup: { overall: unknown }) => typeof lineup.overall === "number")).toBe(true);
    expect(ownProfile.body.squad).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "GOALKEEPER",
        attributes: expect.objectContaining({ diving: expect.any(Number) }),
      }),
      expect.objectContaining({
        kind: "OUTFIELD",
        attributes: expect.objectContaining({ pace: expect.any(Number) }),
      }),
    ]));
    expect(ownProfile.body.standing).toEqual(expect.objectContaining({ played: 1 }));
    expect(ownProfile.body.recentResults).toHaveLength(1);
    expect(ownProfile.body.upcomingFixtures).toHaveLength(0);
    expect(JSON.stringify(ownProfile.body)).not.toContain(credentials.email);
    expect(JSON.stringify(ownProfile.body)).not.toContain("userId");
    expect(JSON.stringify(ownProfile.body)).not.toContain("tactics");

    const rivalProfile = await request(http)
      .get(`/api/teams/${firstTeam.id}`)
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(200);
    expect(rivalProfile.body).toMatchObject({
      id: firstTeam.id,
      isMine: false,
      manager: { displayName: "Manager" },
    });
    await request(http)
      .get("/api/teams/not-a-real-team")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    await request(http)
      .post(`/api/teams/${firstTeam.id}/claim`)
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(409);
  });

  it("keeps manager drafts private and publishes ratings with append-only odds", async () => {
    const http = app.getHttpServer();
    const manager = await request(http)
      .post("/api/auth/signup")
      .send({ email: "coach@example.com", password: "secure-manager-password" })
      .expect(201);
    const rival = await request(http)
      .post("/api/auth/signup")
      .send({ email: "spectator@example.com", password: "secure-rival-password" })
      .expect(201);
    const token = manager.body.accessToken as string;
    const rivalToken = rival.body.accessToken as string;

    const teams = await request(http)
      .get("/api/teams")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const managedTeam = teams.body[0] as { id: string };
    await request(http)
      .post(`/api/teams/${managedTeam.id}/claim`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    await addGeneratedSquad(managedTeam.id);

    const initialPrivate = await request(http)
      .get("/api/teams/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(initialPrivate.body).toMatchObject({
      id: managedTeam.id,
      isMine: true,
      draftLineup: null,
      tactics: null,
    });
    await request(http)
      .get("/api/teams/me")
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(404);

    const currentFormation = initialPrivate.body.officialLineup.formation as string;
    const nextFormation = FORMATIONS.find(
      (formation) => formation !== currentFormation,
    );
    if (!nextFormation) throw new Error("A different test formation is required");
    const nextRatings = selectBestLineup(
      nextFormation,
      initialPrivate.body.squad,
    );
    const draftInput = {
      formation: nextFormation,
      assignments: nextRatings.assignments.map((assignment) => ({
        slotKey: assignment.slotKey,
        playerId: assignment.player.id,
      })),
    };

    await request(http)
      .put("/api/teams/me/draft")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...draftInput,
        assignments: draftInput.assignments.map((assignment) => ({
          ...assignment,
          playerId: draftInput.assignments[0]?.playerId,
        })),
      })
      .expect(400);

    const savedDraft = await request(http)
      .put("/api/teams/me/draft")
      .set("Authorization", `Bearer ${token}`)
      .send(draftInput)
      .expect(200);
    expect(savedDraft.body.draftLineup).toMatchObject({
      formation: nextFormation,
      overall: nextRatings.overall,
    });
    expect(savedDraft.body.officialLineup.formation).toBe(currentFormation);

    const publicBeforePublish = await request(http)
      .get(`/api/teams/${managedTeam.id}`)
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(200);
    expect(publicBeforePublish.body.officialLineup.formation).toBe(
      currentFormation,
    );
    expect(JSON.stringify(publicBeforePublish.body)).not.toContain("draftLineup");

    await request(http).post("/api/dev/open-round").expect(201);
    const roundBefore = await request(http).get("/api/rounds/current").expect(200);
    const affectedMatch = roundBefore.body.matches.find(
      (match: { homeTeam: { id: string }; awayTeam: { id: string } }) =>
        match.homeTeam.id === managedTeam.id ||
        match.awayTeam.id === managedTeam.id,
    );
    expect(affectedMatch).toBeDefined();
    const oldQuote = affectedMatch.odds.find(
      (quote: { market: string; selection: string }) =>
        quote.market === "MATCH_RESULT" && quote.selection === "HOME",
    );
    const acceptedBet = await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${rivalToken}`)
      .send({
        matchId: affectedMatch.id,
        market: oldQuote.market,
        selection: oldQuote.selection,
        stake: 25,
      })
      .expect(201);
    const snapshotsBefore = await prisma.oddsSnapshot.count({
      where: { matchId: affectedMatch.id },
    });
    expect(snapshotsBefore).toBe(24);

    const published = await request(http)
      .post("/api/teams/me/publish")
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    expect(published.body).toMatchObject({
      changed: true,
      repricedMatchIds: [affectedMatch.id],
      profile: {
        id: managedTeam.id,
        strengthRating: nextRatings.overall,
        officialLineup: {
          formation: nextFormation,
          overall: nextRatings.overall,
        },
      },
    });
    const snapshotsAfter = await prisma.oddsSnapshot.count({
      where: { matchId: affectedMatch.id },
    });
    expect(snapshotsAfter).toBe(48);

    const roundAfterPublish = await request(http)
      .get("/api/rounds/current")
      .expect(200);
    const latestMatch = roundAfterPublish.body.matches.find(
      ({ id }: { id: string }) => id === affectedMatch.id,
    );
    const latestQuote = latestMatch.odds.find(
      (quote: { market: string; selection: string }) =>
        quote.market === oldQuote.market &&
        quote.selection === oldQuote.selection,
    );
    const newPriceBet = await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${rivalToken}`)
      .send({
        matchId: affectedMatch.id,
        market: latestQuote.market,
        selection: latestQuote.selection,
        stake: 5,
      })
      .expect(201);
    expect(Number(newPriceBet.body.bet.oddsTaken)).toBe(
      Number(latestQuote.odds),
    );

    const betsAfterPublish = await request(http)
      .get("/api/bets")
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(200);
    const originalBetAfterPublish = betsAfterPublish.body.find(
      ({ id }: { id: string }) => id === acceptedBet.body.bet.id,
    );
    expect(originalBetAfterPublish).toMatchObject({
      id: acceptedBet.body.bet.id,
      status: "PENDING",
    });
    expect(Number(originalBetAfterPublish.oddsTaken)).toBe(
      Number(oldQuote.odds),
    );

    const repeatedPublish = await request(http)
      .post("/api/teams/me/publish")
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    expect(repeatedPublish.body).toMatchObject({
      changed: false,
      repricedMatchIds: [],
    });
    expect(
      await prisma.oddsSnapshot.count({ where: { matchId: affectedMatch.id } }),
    ).toBe(snapshotsAfter);

    const publicAfterPublish = await request(http)
      .get(`/api/teams/${managedTeam.id}`)
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(200);
    expect(publicAfterPublish.body).toMatchObject({
      strengthRating: nextRatings.overall,
      officialLineup: { formation: nextFormation },
    });
    expect(JSON.stringify(publicAfterPublish.body)).not.toContain("tactics");
    expect(JSON.stringify(publicAfterPublish.body)).not.toContain("draftLineup");

    const opponentId = affectedMatch.homeTeam.id === managedTeam.id
      ? affectedMatch.awayTeam.id
      : affectedMatch.homeTeam.id;
    await addGeneratedSquad(opponentId);
    const deadline = new Date(Date.now() - 60_000);
    await Promise.all([
      prisma.match.update({
        where: { id: affectedMatch.id },
        data: { lineupLocksAt: deadline },
      }),
      prisma.teamLineup.update({
        where: { id: published.body.profile.officialLineup.id },
        data: { publishedAt: new Date(deadline.getTime() - 60_000) },
      }),
    ]);
    const lockAttempts = await Promise.all([
      lockDueMatchLineups(prisma, { now: new Date() }),
      lockDueMatchLineups(prisma, { now: new Date() }),
    ]);
    expect(
      lockAttempts.flatMap(({ lockedMatchIds }) => lockedMatchIds)
        .filter((id) => id === affectedMatch.id),
    ).toHaveLength(1);
    const frozenLineups = await prisma.matchLineupSnapshot.findMany({
      where: { matchId: affectedMatch.id },
      include: { slots: true },
    });
    expect(frozenLineups).toHaveLength(2);
    expect(frozenLineups.every(({ slots }) => slots.length === 11)).toBe(true);
    const managedSnapshot = frozenLineups.find(
      ({ teamId }) => teamId === managedTeam.id,
    );
    expect(managedSnapshot).toMatchObject({
      sourceLineupId: published.body.profile.officialLineup.id,
      formation: nextFormation,
    });
    expect(Number(managedSnapshot?.overallRating)).toBe(nextRatings.overall);

    const laterFormation = FORMATIONS.find(
      (formation) => formation !== nextFormation,
    );
    if (!laterFormation) throw new Error("A later test formation is required");
    const laterRatings = selectBestLineup(
      laterFormation,
      published.body.profile.squad,
    );
    await request(http).post("/api/dev/close-window").expect(201);
    await request(http)
      .put("/api/teams/me/draft")
      .set("Authorization", `Bearer ${token}`)
      .send({
        formation: laterFormation,
        assignments: laterRatings.assignments.map((assignment) => ({
          slotKey: assignment.slotKey,
          playerId: assignment.player.id,
        })),
      })
      .expect(200);
    const laterPublish = await request(http)
      .post("/api/teams/me/publish")
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    expect(laterPublish.body).toMatchObject({
      changed: true,
      repricedMatchIds: [],
      profile: { officialLineup: { formation: laterFormation } },
    });
    expect(laterPublish.body.profile.officialLineup.id).not.toBe(
      managedSnapshot?.sourceLineupId,
    );
    expect(
      await prisma.matchLineupSnapshot.count({
        where: { matchId: affectedMatch.id },
      }),
    ).toBe(2);
    expect(
      await prisma.oddsSnapshot.count({ where: { matchId: affectedMatch.id } }),
    ).toBe(snapshotsAfter);

    let engineContext: MatchContext | null = null;
    await resolveAndSettleMatch(prisma, affectedMatch.id, {
      async resolve(context) {
        engineContext = context;
        return {
          homeScore: 1,
          awayScore: 1,
          homeCards: 1,
          awayCards: 1,
          homeCorners: 4,
          awayCorners: 4,
        };
      },
    });
    const homeSnapshot = frozenLineups.find(({ side }) => side === "HOME");
    const awaySnapshot = frozenLineups.find(({ side }) => side === "AWAY");
    expect(engineContext).not.toBeNull();
    expect((engineContext as MatchContext | null)?.homeTeam.strengthRating).toBe(
      Number(homeSnapshot?.overallRating),
    );
    expect((engineContext as MatchContext | null)?.awayTeam.strengthRating).toBe(
      Number(awaySnapshot?.overallRating),
    );

  });

  it("refunds timely cancellations and prevents managers betting on their club", async () => {
    const http = app.getHttpServer();
    const signup = await request(http)
      .post("/api/auth/signup")
      .send({ email: "fairplay@example.com", password: "secure-fairplay-password" })
      .expect(201);
    const token = signup.body.accessToken as string;
    await request(http).post("/api/dev/open-round").expect(201);
    const round = await request(http).get("/api/rounds/current").expect(200);
    const match = round.body.matches[0];
    const quote = match.odds.find(
      (item: { market: string; selection: string }) =>
        item.market === "MATCH_RESULT" && item.selection === "HOME",
    );

    const placed = await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        matchId: match.id,
        market: quote.market,
        selection: quote.selection,
        stake: 50,
      })
      .expect(201);
    expect(placed.body.coinBalance).toBe(1_150);

    const outsider = await request(http)
      .post("/api/auth/signup")
      .send({ email: "outsider@example.com", password: "secure-outsider-password" })
      .expect(201);
    await request(http)
      .delete(`/api/bets/${placed.body.bet.id}`)
      .set("Authorization", `Bearer ${outsider.body.accessToken}`)
      .expect(404);

    await request(http)
      .post(`/api/teams/${match.homeTeam.id}/claim`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);

    const cancellationAttempts = await Promise.all([
      request(http)
        .delete(`/api/bets/${placed.body.bet.id}`)
        .set("Authorization", `Bearer ${token}`),
      request(http)
        .delete(`/api/bets/${placed.body.bet.id}`)
        .set("Authorization", `Bearer ${token}`),
    ]);
    expect(cancellationAttempts.map(({ status }) => status).sort()).toEqual([
      200,
      409,
    ]);
    const cancelled = cancellationAttempts.find(({ status }) => status === 200);
    expect(cancelled).toBeDefined();
    if (!cancelled) throw new Error("One cancellation should have succeeded");
    expect(cancelled.body).toMatchObject({
      coinBalance: 1_200,
      refundAmount: 50,
      bet: { id: placed.body.bet.id, status: "CANCELLED", payout: null },
    });
    expect(cancelled.body.bet.cancelledAt).toEqual(expect.any(String));
    await request(http)
      .delete(`/api/bets/${placed.body.bet.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
    expect(
      await prisma.ledgerEntry.count({
        where: { userId: signup.body.user.id, type: "REFUND" },
      }),
    ).toBe(1);

    await request(http)
      .post(`/api/teams/${match.homeTeam.id}/claim`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        matchId: match.id,
        market: quote.market,
        selection: quote.selection,
        stake: 10,
      })
      .expect(409);

    const unrelatedMatch = round.body.matches.find(
      (candidate: { homeTeam: { id: string }; awayTeam: { id: string } }) =>
        candidate.homeTeam.id !== match.homeTeam.id &&
        candidate.awayTeam.id !== match.homeTeam.id,
    );
    const unrelatedQuote = unrelatedMatch.odds.find(
      (item: { market: string; selection: string }) =>
        item.market === "MATCH_RESULT" && item.selection === "DRAW",
    );
    const unrelatedBet = await request(http)
      .post("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        matchId: unrelatedMatch.id,
        market: unrelatedQuote.market,
        selection: unrelatedQuote.selection,
        stake: 10,
      })
      .expect(201);
    await request(http).post("/api/dev/close-window").expect(201);
    await request(http)
      .delete(`/api/bets/${unrelatedBet.body.bet.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
    await request(http).post("/api/dev/resolve-due").expect(201);
    const history = await request(http)
      .get("/api/bets")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(history.body.find(({ id }: { id: string }) => id === placed.body.bet.id)).toMatchObject({
      status: "CANCELLED",
      payout: null,
    });
  });
});
