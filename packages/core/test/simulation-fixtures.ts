import { FORMATION_TEMPLATES, LIVE_ENGINE_VERSION, type Formation, type SimulationInput,
  type SimulationPlayer, type SimulationTeam } from "@fb/shared";
import { simulationUnit } from "../src/simulation-input.js";

export function fixtureInput(homeStrength = 72, awayStrength = 72, formation: Formation = "4-3-3"): SimulationInput {
  function team(id: string, rating: number): SimulationTeam {
    const starters = FORMATION_TEMPLATES[formation].map((slot, index): SimulationPlayer => ({
      id: `${id}-${index}`, name: `${id} Player ${index + 1}`, shirtNumber: index + 1,
      position: slot.position, secondaryPositions: [], overall: rating, slotKey: slot.key, unit: slot.unit,
      attributes: slot.position === "GK"
        ? { diving: rating, handling: rating, kicking: rating, reflexes: rating, speed: rating, positioning: rating }
        : { pace: rating, shooting: rating, passing: rating, dribbling: rating, defending: rating, physical: rating },
    }));
    const bench = (["GK", "CB", "LB", "CM", "CAM", "RW", "ST"] as const).map((position, index): SimulationPlayer => ({
      id: `${id}-bench-${index}`, name: `${id} Reserve ${index + 1}`, shirtNumber: index + 12,
      position, secondaryPositions: position === "GK" ? [] : ["CM", "ST"], overall: rating - 2,
      slotKey: null, unit: simulationUnit(position),
      attributes: position === "GK"
        ? { diving: rating, handling: rating, kicking: rating, reflexes: rating, speed: rating, positioning: rating }
        : { pace: rating, shooting: rating, passing: rating, dribbling: rating, defending: rating, physical: rating },
    }));
    return { id, name: `${id} FC`, strength: rating, formation, players: [...starters, ...bench] };
  }
  return { version: LIVE_ENGINE_VERSION, matchId: "test-match", home: team("home", homeStrength), away: team("away", awayStrength) };
}
