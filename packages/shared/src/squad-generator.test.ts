import { describe, expect, it } from "vitest";
import {
  EUROPEAN_NATIONALITY_WEIGHTS,
  PLAYERS_PER_SQUAD,
  SQUAD_POSITION_PLAN,
  generateLeagueSquads,
  mapLegacyStrengthToTarget,
  type PlayerIdentity,
} from "./squad-generator.js";
import {
  GOALKEEPER_ATTRIBUTE_KEYS,
  OUTFIELD_ATTRIBUTE_KEYS,
  calculateGoalkeeperOverall,
  calculateOutfieldOverall,
} from "./players.js";

function identityPool(count: number): PlayerIdentity[] {
  return Array.from({ length: count }, (_, index) => ({
    firstName: `First${index.toString().padStart(4, "0")}`,
    lastName: `Last${index.toString().padStart(4, "0")}`,
  }));
}

const LEGACY_STRENGTHS = [
  88, 85, 82, 79, 76, 74, 71, 68, 65, 62,
  59, 56, 53, 50, 47, 44, 41, 38, 34, 30,
];

function leagueTeams() {
  return LEGACY_STRENGTHS.map((strength, index) => ({
    key: `team-${index.toString().padStart(2, "0")}`,
    targetStrength: mapLegacyStrengthToTarget(strength),
  }));
}

describe("deterministic squad generation", () => {
  it("maps the old rating band into the compressed target band", () => {
    expect(mapLegacyStrengthToTarget(30)).toBe(60);
    expect(mapLegacyStrengthToTarget(88)).toBe(85);
    expect(mapLegacyStrengthToTarget(59)).toBe(72.5);
    expect(mapLegacyStrengthToTarget(-10)).toBe(60);
    expect(mapLegacyStrengthToTarget(120)).toBe(85);
  });

  it("returns byte-equivalent football data for the same version", () => {
    const teams = leagueTeams();
    const identities = identityPool(1_000);
    const first = generateLeagueSquads(teams, identities, {
      generationVersion: "test-v1",
    });
    const second = generateLeagueSquads(teams, identities, {
      generationVersion: "test-v1",
    });

    expect(second).toEqual(first);
    expect(
      generateLeagueSquads(teams, identities, {
        generationVersion: "test-v2",
      }),
    ).not.toEqual(first);
  });

  it("creates 20 distinct valid 23-player squads and three lineups each", () => {
    const squads = generateLeagueSquads(leagueTeams(), identityPool(1_000), {
      generationVersion: "validation-v1",
    });
    const nationalityCodes = new Set(
      EUROPEAN_NATIONALITY_WEIGHTS.map(({ code }) => code),
    );
    const identities = new Set<string>();
    const playerIds = new Set<string>();

    expect(squads).toHaveLength(20);
    for (const squad of squads) {
      expect(squad.players).toHaveLength(PLAYERS_PER_SQUAD);
      expect(new Set(squad.players.map(({ shirtNumber }) => shirtNumber)).size).toBe(
        PLAYERS_PER_SQUAD,
      );
      expect(squad.players.map(({ primaryPosition }) => primaryPosition).sort()).toEqual(
        [...SQUAD_POSITION_PLAN].sort(),
      );
      expect(squad.lineups).toHaveLength(3);
      expect(new Set(squad.lineups.map(({ formation }) => formation)).size).toBe(3);
      expect(squad.lineups.filter(({ official }) => official)).toHaveLength(1);
      expect(Math.abs(squad.strengthRating - squad.targetStrength)).toBeLessThanOrEqual(
        0.75,
      );

      for (const lineup of squad.lineups) {
        expect(lineup.ratings.assignments).toHaveLength(11);
        expect(
          new Set(lineup.ratings.assignments.map(({ player }) => player.id)).size,
        ).toBe(11);
      }

      for (const player of squad.players) {
        expect(playerIds.has(player.id)).toBe(false);
        playerIds.add(player.id);
        const identity = `${player.firstName}\u0000${player.lastName}`;
        expect(identities.has(identity)).toBe(false);
        identities.add(identity);
        expect(nationalityCodes.has(player.nationalityCode)).toBe(true);
        expect(player.overall).toBeGreaterThanOrEqual(1);
        expect(player.overall).toBeLessThanOrEqual(92);
        expect(new Set(player.secondaryPositions).size).toBe(
          player.secondaryPositions.length,
        );
        expect(player.secondaryPositions).not.toContain(player.primaryPosition);

        if (player.kind === "GOALKEEPER") {
          expect(player.primaryPosition).toBe("GK");
          expect(player.secondaryPositions).toHaveLength(0);
          expect(calculateGoalkeeperOverall(player.attributes)).toBe(player.overall);
          for (const key of GOALKEEPER_ATTRIBUTE_KEYS) {
            expect(player.attributes[key]).toBeGreaterThanOrEqual(1);
            expect(player.attributes[key]).toBeLessThanOrEqual(99);
          }
        } else {
          expect(calculateOutfieldOverall(player.primaryPosition, player.attributes)).toBe(
            player.overall,
          );
          for (const key of OUTFIELD_ATTRIBUTE_KEYS) {
            expect(player.attributes[key]).toBeGreaterThanOrEqual(1);
            expect(player.attributes[key]).toBeLessThanOrEqual(99);
          }
        }
      }
    }

    expect(playerIds.size).toBe(20 * PLAYERS_PER_SQUAD);
    expect(identities.size).toBe(20 * PLAYERS_PER_SQUAD);
    expect(
      squads.flatMap(({ players }) => players).filter(({ overall }) => overall >= 84)
        .length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("fails loudly for duplicate or insufficient identity data", () => {
    const teams = leagueTeams().slice(0, 1);
    const identities = identityPool(PLAYERS_PER_SQUAD);
    identities[1] = { ...identities[0] } as PlayerIdentity;
    expect(() => generateLeagueSquads(teams, identities)).toThrow(
      /identities must be unique/,
    );
    expect(() =>
      generateLeagueSquads(teams, identityPool(PLAYERS_PER_SQUAD - 1)),
    ).toThrow(/23 unique identities are required/);
  });
});
