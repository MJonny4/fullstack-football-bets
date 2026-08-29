import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { calculatePayout, type MatchContext, type ResultEngine } from "@fb/shared";
import { prisma } from "@fb/core";
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
      prisma.team.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    await prisma.team.createMany({
      data: Array.from({ length: 20 }, (_, index) => ({
        name: `Integration FC ${String(index + 1).padStart(2, "0")}`,
        strengthRating: 45 + index * 2,
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

    await request(http)
      .post(`/api/teams/${firstTeam.id}/claim`)
      .set("Authorization", `Bearer ${rivalToken}`)
      .expect(409);
  });
});
