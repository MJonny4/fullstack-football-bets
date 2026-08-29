import { describe, expect, it } from "vitest";
import {
  calculateStandings,
  getActiveSeason,
  ROUNDS_PER_SEASON,
  type ResolvedStandingsMatch,
  type StandingsTeam,
} from "./standings.js";

const TEAM_A: StandingsTeam = {
  id: "a",
  name: "Azureton FC",
  crestImageUrl: "/teams/a.png",
};
const TEAM_B: StandingsTeam = {
  id: "b",
  name: "Blackthorn City",
  crestImageUrl: "/teams/b.png",
};
const TEAM_C: StandingsTeam = {
  id: "c",
  name: "Cinder Peak FC",
  crestImageUrl: null,
};

function resolvedMatch(
  id: string,
  weekNumber: number,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
): ResolvedStandingsMatch {
  const scheduledAt = new Date(
    Date.UTC(2026, 0, 1) + weekNumber * 7 * 24 * 60 * 60 * 1_000,
  );
  return {
    id,
    weekNumber,
    scheduledAt,
    resolvedAt: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1_000),
    homeTeamId,
    awayTeamId,
    resultPayload: { homeScore, awayScore },
  };
}

function entry(
  calculation: ReturnType<typeof calculateStandings>,
  teamId: string,
) {
  const found = calculation.entries.find(({ team }) => team.id === teamId);
  if (!found) throw new Error(`Missing standing for ${teamId}`);
  return found;
}

function team(id: string, name = id.toUpperCase()): StandingsTeam {
  return { id, name, crestImageUrl: null };
}

describe("active standings season", () => {
  it("returns an empty first season when no round exists", () => {
    expect(getActiveSeason(null)).toEqual({
      seasonNumber: 1,
      currentMatchweek: 0,
      firstWeekNumber: 1,
      lastWeekNumber: ROUNDS_PER_SEASON,
    });
  });

  it.each([
    [1, 1, 1, 1, 38],
    [38, 1, 38, 1, 38],
    [39, 2, 1, 39, 76],
    [76, 2, 38, 39, 76],
    [77, 3, 1, 77, 114],
  ])(
    "maps global week %i to season %i matchweek %i",
    (week, seasonNumber, currentMatchweek, firstWeekNumber, lastWeekNumber) => {
      expect(getActiveSeason(week)).toEqual({
        seasonNumber,
        currentMatchweek,
        firstWeekNumber,
        lastWeekNumber,
      });
    },
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid latest week %s",
    (week) => {
      expect(() => getActiveSeason(week)).toThrow(/positive whole number/);
    },
  );
});

describe("league standings calculation", () => {
  it("returns every team with zero statistics before a match is played", () => {
    const result = calculateStandings([TEAM_C, TEAM_B, TEAM_A], []);

    expect(result).toMatchObject({
      playedMatches: 0,
      goalsScored: 0,
      lastResolvedAt: null,
    });
    expect(result.entries.map(({ team: value }) => value.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(result.entries.map(({ position }) => position)).toEqual([1, 2, 3]);
    for (const standing of result.entries) {
      expect(standing).toMatchObject({
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      });
    }
  });

  it("aggregates home wins, away wins, draws, goals, and points", () => {
    const first = resolvedMatch("m1", 1, "a", "b", 2, 0);
    const second = resolvedMatch("m2", 2, "b", "a", 1, 1);
    const third = resolvedMatch("m3", 3, "c", "a", 3, 1);
    third.resolvedAt = "2026-03-01T20:00:00.000Z";

    // Deliberately shuffled to prove that aggregation and form do not depend on
    // database return order.
    const result = calculateStandings(
      [TEAM_A, TEAM_B, TEAM_C],
      [third, first, second],
    );

    expect(result).toMatchObject({
      playedMatches: 3,
      goalsScored: 8,
      lastResolvedAt: "2026-03-01T20:00:00.000Z",
    });
    expect(entry(result, "a")).toMatchObject({
      position: 1,
      played: 3,
      wins: 1,
      draws: 1,
      losses: 1,
      goalsFor: 4,
      goalsAgainst: 4,
      goalDifference: 0,
      points: 4,
      form: ["W", "D", "L"],
    });
    expect(entry(result, "c")).toMatchObject({
      position: 2,
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      goalDifference: 2,
      points: 3,
      form: ["W"],
    });
    expect(entry(result, "b")).toMatchObject({
      position: 3,
      played: 2,
      wins: 0,
      draws: 1,
      losses: 1,
      goalsFor: 1,
      goalsAgainst: 3,
      goalDifference: -2,
      points: 1,
      form: ["L", "D"],
    });
  });

  it("keeps only the last five form results in chronological order", () => {
    const matches = [
      resolvedMatch("m6", 6, "a", "b", 0, 2),
      resolvedMatch("m2", 2, "a", "b", 1, 1),
      resolvedMatch("m4", 4, "a", "b", 2, 1),
      resolvedMatch("m1", 1, "a", "b", 3, 0),
      resolvedMatch("m5", 5, "a", "b", 0, 0),
      resolvedMatch("m3", 3, "a", "b", 1, 2),
    ];

    const result = calculateStandings([TEAM_A, TEAM_B], matches);

    expect(entry(result, "a").form).toEqual(["D", "L", "W", "D", "L"]);
    expect(entry(result, "b").form).toEqual(["D", "W", "L", "D", "W"]);
  });

  it("uses points before every secondary tie-breaker", () => {
    const teams = [team("a", "Zulu"), team("b", "Alpha"), team("x"), team("y"), team("z")];
    const result = calculateStandings(teams, [
      resolvedMatch("a-win", 1, "a", "x", 1, 0),
      resolvedMatch("b-draw-1", 1, "b", "y", 5, 5),
      resolvedMatch("b-draw-2", 2, "b", "z", 5, 5),
    ]);

    expect(entry(result, "a").points).toBe(3);
    expect(entry(result, "b").points).toBe(2);
    expect(entry(result, "a").position).toBeLessThan(entry(result, "b").position);
  });

  it("breaks equal points by goal difference", () => {
    const result = calculateStandings(
      [team("a", "Zulu"), team("b", "Alpha"), team("x"), team("y")],
      [
        resolvedMatch("a-win", 1, "a", "x", 3, 0),
        resolvedMatch("b-win", 1, "b", "y", 1, 0),
      ],
    );

    expect(entry(result, "a").position).toBeLessThan(entry(result, "b").position);
  });

  it("breaks equal points and goal difference by goals scored", () => {
    const result = calculateStandings(
      [team("a", "Zulu"), team("b", "Alpha"), team("x"), team("y")],
      [
        resolvedMatch("a-win", 1, "a", "x", 3, 1),
        resolvedMatch("b-win", 1, "b", "y", 2, 0),
      ],
    );

    expect(entry(result, "a").goalDifference).toBe(2);
    expect(entry(result, "b").goalDifference).toBe(2);
    expect(entry(result, "a").position).toBeLessThan(entry(result, "b").position);
  });

  it("breaks equal points, goal difference, and goals scored by wins", () => {
    const teams = [
      team("a", "Zulu"),
      team("b", "Alpha"),
      ...["a1", "a2", "a3", "a4", "b1", "b2", "b3"].map((id) => team(id)),
    ];
    const result = calculateStandings(teams, [
      resolvedMatch("a-win", 1, "a", "a1", 3, 0),
      resolvedMatch("a-loss-1", 2, "a", "a2", 0, 1),
      resolvedMatch("a-loss-2", 3, "a", "a3", 0, 1),
      resolvedMatch("a-loss-3", 4, "a", "a4", 0, 1),
      resolvedMatch("b-draw-1", 1, "b", "b1", 1, 1),
      resolvedMatch("b-draw-2", 2, "b", "b2", 1, 1),
      resolvedMatch("b-draw-3", 3, "b", "b3", 1, 1),
    ]);

    expect(entry(result, "a")).toMatchObject({
      points: 3,
      wins: 1,
      goalsFor: 3,
      goalDifference: 0,
    });
    expect(entry(result, "b")).toMatchObject({
      points: 3,
      wins: 0,
      goalsFor: 3,
      goalDifference: 0,
    });
    expect(entry(result, "a").position).toBeLessThan(entry(result, "b").position);
  });

  it("uses normalized team name then team id as stable final tie-breakers", () => {
    const result = calculateStandings(
      [
        team("z", "  Beta  City "),
        team("b", "Álpha FC"),
        team("a", "Alpha FC"),
      ],
      [],
    );

    expect(result.entries.map(({ team: value }) => value.id)).toEqual([
      "a",
      "b",
      "z",
    ]);
  });

  it.each([
    null,
    {},
    { homeScore: 1 },
    { homeScore: -1, awayScore: 0 },
    { homeScore: 1.5, awayScore: 0 },
    { homeScore: 1, awayScore: "0" },
  ])("rejects corrupt result payload %j", (resultPayload) => {
    const match = resolvedMatch("corrupt", 1, "a", "b", 1, 0);
    match.resultPayload = resultPayload;

    expect(() => calculateStandings([TEAM_A, TEAM_B], [match])).toThrow(
      /resultPayload|homeScore and awayScore/,
    );
  });

  it("rejects duplicate or unknown team references and invalid match metadata", () => {
    expect(() => calculateStandings([TEAM_A, TEAM_A], [])).toThrow(/Duplicate team/);

    expect(() =>
      calculateStandings(
        [TEAM_A, TEAM_B],
        [resolvedMatch("unknown", 1, "a", "missing", 1, 0)],
      ),
    ).toThrow(/outside the standings/);

    expect(() =>
      calculateStandings(
        [TEAM_A],
        [resolvedMatch("same", 1, "a", "a", 1, 0)],
      ),
    ).toThrow(/same team twice/);

    const invalidDate = resolvedMatch("invalid-date", 1, "a", "b", 1, 0);
    invalidDate.resolvedAt = null;
    expect(() => calculateStandings([TEAM_A, TEAM_B], [invalidDate])).toThrow(
      /invalid resolvedAt/,
    );
  });
});
