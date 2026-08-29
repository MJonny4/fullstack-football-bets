import { describe, expect, it } from "vitest";
import {
  buildBettingLeaderboard,
  type LeaderboardBetAggregate,
  type LeaderboardUserSource,
} from "../src/leaderboard/leaderboard-ranking.js";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function user(
  id: string,
  email: string,
  overrides: Partial<LeaderboardUserSource> = {},
): LeaderboardUserSource {
  return {
    id,
    email,
    coinBalance: 1_000,
    createdAt,
    team: null,
    ...overrides,
  };
}

function aggregate(
  userId: string,
  status: LeaderboardBetAggregate["status"],
  count: number,
  stake: number,
  payout: number,
): LeaderboardBetAggregate {
  return { userId, status, count, stake, payout };
}

describe("buildBettingLeaderboard", () => {
  it("calculates settled performance, excludes pending stakes, and keeps unranked users last", () => {
    const result = buildBettingLeaderboard(
      [user("winner", "sharp.player@example.com"), user("new", "newcomer@example.com")],
      [
        aggregate("winner", "WON", 2, 150, 330),
        aggregate("winner", "LOST", 1, 50, 0),
        aggregate("winner", "PENDING", 3, 90, 0),
        aggregate("winner", "CANCELLED", 2, 40, 0),
        aggregate("new", "PENDING", 1, 25, 0),
      ],
    );

    expect(result[0]).toMatchObject({
      rank: 1,
      displayName: "Sharp Player",
      settledBets: 3,
      wins: 2,
      losses: 1,
      pendingBets: 3,
      settledStake: 200,
      pendingStake: 90,
      totalPayout: 330,
      netProfit: 130,
      roiPercent: 65,
      hitRatePercent: 66.7,
      provisional: true,
    });
    expect(result[1]).toMatchObject({
      rank: null,
      displayName: "Newcomer",
      settledBets: 0,
      pendingBets: 1,
      netProfit: 0,
      roiPercent: null,
      hitRatePercent: null,
      provisional: false,
    });
  });

  it("uses profit, exact ROI, sample size, wins, creation time, and id as tie-breakers", () => {
    const users = [
      user("roi-low", "roi-low@example.com"),
      user("roi-high", "roi-high@example.com"),
      user("more-bets", "more-bets@example.com"),
      user("more-wins", "more-wins@example.com"),
      user("older", "older@example.com", { createdAt: new Date("2025-12-31T00:00:00Z") }),
      user("z-id", "z-id@example.com"),
      user("a-id", "a-id@example.com"),
    ];
    const groups = [
      aggregate("roi-low", "WON", 1, 200, 300),
      aggregate("roi-high", "WON", 1, 100, 200),
      aggregate("more-bets", "WON", 1, 90, 200),
      aggregate("more-bets", "LOST", 1, 10, 0),
      aggregate("more-wins", "WON", 2, 100, 200),
      aggregate("older", "WON", 2, 100, 200),
      aggregate("z-id", "WON", 2, 100, 200),
      aggregate("a-id", "WON", 2, 100, 200),
    ];

    expect(buildBettingLeaderboard(users, groups).map(({ userId }) => userId)).toEqual([
      "older",
      "a-id",
      "more-wins",
      "z-id",
      "more-bets",
      "roi-high",
      "roi-low",
    ]);
  });

  it("disambiguates sanitized aliases deterministically without returning email addresses", () => {
    const result = buildBettingLeaderboard(
      [
        user("later", "same.name+private@secret.example", { createdAt: new Date("2026-02-01T00:00:00Z") }),
        user("earlier", "same_name@another.example"),
        user("fallback", "+++@example.com"),
      ],
      [],
    );

    expect(result.map(({ userId, displayName }) => ({ userId, displayName }))).toEqual([
      { userId: "earlier", displayName: "Same Name #1" },
      { userId: "fallback", displayName: "Manager" },
      { userId: "later", displayName: "Same Name #2" },
    ]);
    expect(JSON.stringify(result)).not.toContain("@");
    expect(JSON.stringify(result)).not.toContain("secret.example");
  });

  it("marks a five-bet record as established and preserves claimed-team identity", () => {
    const result = buildBettingLeaderboard(
      [
        user("manager", "manager@example.com", {
          team: { id: "team-1", name: "Azureton FC", crestImageUrl: "/teams/azuretonfc.png" },
        }),
      ],
      [aggregate("manager", "WON", 3, 150, 300), aggregate("manager", "LOST", 2, 50, 0)],
    );

    expect(result[0]).toMatchObject({
      rank: 1,
      settledBets: 5,
      provisional: false,
      team: { id: "team-1", name: "Azureton FC", crestImageUrl: "/teams/azuretonfc.png" },
    });
  });
});
