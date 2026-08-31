import { describe, expect, it } from "vitest";
import {
  FORMATIONS,
  FORMATION_PITCH_ROWS,
  FORMATION_TEMPLATES,
  calculateLineupRatings,
  getPositionPenalty,
  selectBestLineup,
  type Formation,
  type LineupAssignment,
} from "./formations.js";
import type { PlayerPosition, RatedPlayer } from "./players.js";

function player(
  id: string,
  primaryPosition: PlayerPosition,
  overall = 80,
  secondaryPositions: PlayerPosition[] = [],
): RatedPlayer {
  return { id, primaryPosition, secondaryPositions, overall };
}

function naturalAssignments(
  formation: Formation,
  overrides: Partial<Record<string, RatedPlayer>> = {},
): LineupAssignment[] {
  return FORMATION_TEMPLATES[formation].map((slot, index) => ({
    slotKey: slot.key,
    player:
      overrides[slot.key] ?? player(`${slot.key}-${index}`, slot.position),
  }));
}

describe("formation templates", () => {
  it("defines eleven unique slots and one goalkeeper for every formation", () => {
    expect(FORMATIONS).toHaveLength(6);
    for (const formation of FORMATIONS) {
      const slots = FORMATION_TEMPLATES[formation];
      expect(slots).toHaveLength(11);
      expect(new Set(slots.map(({ key }) => key)).size).toBe(11);
      expect(slots.filter(({ unit }) => unit === "GK")).toHaveLength(1);
      expect(slots.some(({ unit }) => unit === "DEF")).toBe(true);
      expect(slots.some(({ unit }) => unit === "MID")).toBe(true);
      expect(slots.some(({ unit }) => unit === "ATT")).toBe(true);
    }
  });

  it("keeps every visual pitch row in formation order without losing slots", () => {
    for (const formation of FORMATIONS) {
      const pitchSlots = FORMATION_PITCH_ROWS[formation].flat();
      const templateSlots = FORMATION_TEMPLATES[formation].map(({ key }) => key);

      expect(new Set(pitchSlots)).toEqual(new Set(templateSlots));
      expect(pitchSlots).toHaveLength(11);
    }

    expect(FORMATION_PITCH_ROWS["4-2-3-1"]).toHaveLength(5);
  });
});

describe("position compatibility", () => {
  it("uses primary and secondary positions and rejects goalkeeper swaps", () => {
    expect(getPositionPenalty(player("st", "ST"), "ST")).toBe(0);
    expect(getPositionPenalty(player("st", "ST"), "RW")).toBe(1);
    expect(getPositionPenalty(player("st", "ST"), "CB")).toBe(5);
    expect(getPositionPenalty(player("cm", "CM", 80, ["CDM"]), "CDM")).toBe(0);
    expect(getPositionPenalty(player("gk", "GK"), "CB")).toBeNull();
    expect(getPositionPenalty(player("cb", "CB"), "GK")).toBeNull();
  });
});

describe("lineup ratings", () => {
  it("uses all eleven players while keeping unit averages independent", () => {
    const ratings = calculateLineupRatings(
      "4-2-3-1",
      naturalAssignments("4-2-3-1", { ST: player("star", "ST", 88) }),
    );

    expect(ratings.overall).toBe(80.73);
    expect(ratings.attack).toBe(88);
    expect(ratings.midfield).toBe(80);
    expect(ratings.defense).toBe(80);
    expect(ratings.goalkeeper).toBe(80);
  });

  it("applies the directional penalty to the assigned rating", () => {
    const ratings = calculateLineupRatings(
      "4-3-3",
      naturalAssignments("4-3-3", { RW: player("forward", "ST", 88) }),
    );
    const rightWing = ratings.assignments.find(({ slotKey }) => slotKey === "RW");

    expect(rightWing?.positionPenalty).toBe(1);
    expect(rightWing?.adjustedRating).toBe(87);
    expect(ratings.attack).toBe(82.33);
  });

  it("rejects duplicate players and incomplete lineups", () => {
    const assignments = naturalAssignments("4-4-2");
    const firstPlayer = assignments[0]?.player;
    if (!firstPlayer || !assignments[1]) throw new Error("Test lineup is incomplete");
    assignments[1] = { ...assignments[1], player: firstPlayer };

    expect(() => calculateLineupRatings("4-4-2", assignments)).toThrow(
      /more than one lineup slot/,
    );
    expect(() => calculateLineupRatings("4-4-2", assignments.slice(1))).toThrow(
      /exactly 11/,
    );
  });

  it("selects the strongest compatible XI without reusing a player", () => {
    const candidates = naturalAssignments("4-3-3").map(({ player }) => player);
    candidates.push(player("elite-st", "ST", 92));
    candidates.push(player("reserve-gk", "GK", 60));

    const selected = selectBestLineup("4-3-3", candidates);
    expect(selected.assignments.map(({ player: selectedPlayer }) => selectedPlayer.id)).toContain(
      "elite-st",
    );
    expect(new Set(selected.assignments.map(({ player: selectedPlayer }) => selectedPlayer.id)).size).toBe(11);
    expect(selected.assignments.find(({ slotKey }) => slotKey === "GK")?.player.primaryPosition).toBe("GK");
  });
});
