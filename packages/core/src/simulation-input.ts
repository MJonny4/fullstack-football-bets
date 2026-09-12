import type { Player } from "@prisma/client";
import type { Formation, LineupUnitGroup, SimulationPlayer, SimulationTeam } from "@fb/shared";

export function simulationUnit(position: string): LineupUnitGroup {
  return position === "GK" ? "GK" : ["RB", "CB", "LB"].includes(position) ? "DEF"
    : ["ST", "LW", "RW"].includes(position) ? "ATT" : "MID";
}

function freezePlayer(player: Player, slotKey: string | null, unit: LineupUnitGroup, rating: number): SimulationPlayer {
  const keys = player.primaryPosition === "GK"
    ? ["diving", "handling", "kicking", "reflexes", "speed", "positioning"] as const
    : ["pace", "shooting", "passing", "dribbling", "defending", "physical"] as const;
  const attributes: Record<string, number> = {};
  for (const key of keys) {
    const value = player[key];
    if (value === null) throw new Error(`Cannot freeze player ${player.id}: missing ${key}`);
    // Position penalties apply to effective skills too, not only the displayed OVR.
    attributes[key] = Math.max(1, value - Math.max(0, player.overallRating - rating));
  }
  return { id: player.id, name: `${player.firstName} ${player.lastName}`, shirtNumber: player.shirtNumber,
    position: player.primaryPosition, secondaryPositions: [...player.secondaryPositions], overall: rating,
    slotKey, unit, attributes };
}

export function freezeSimulationTeam(team: { id: string; name: string }, formation: Formation, strength: number,
  starters: Array<{ player: Player; slotKey: string; unit: LineupUnitGroup; adjustedRating: number }>, squad: Player[]): SimulationTeam {
  const starterIds = new Set(starters.map(p => p.player.id));
  const available = squad.filter(p => !starterIds.has(p.id))
    .sort((a, b) => b.overallRating - a.overallRating || a.id.localeCompare(b.id));
  const bench: Player[] = [];
  for (const unit of ["GK", "DEF", "DEF", "MID", "MID", "ATT", "ATT"] as const) {
    const player = available.find(p => !bench.includes(p) && simulationUnit(p.primaryPosition) === unit)
      ?? (unit === "GK" ? undefined : available.find(p => !bench.includes(p) && p.primaryPosition !== "GK"));
    if (!player) throw new Error(`Cannot freeze a seven-player bench for ${team.name}`);
    bench.push(player);
  }
  return { ...team, formation, strength, players: [
    ...starters.map(p => freezePlayer(p.player, p.slotKey, p.unit, p.adjustedRating)),
    ...bench.map(p => freezePlayer(p, null, simulationUnit(p.primaryPosition), p.overallRating)),
  ] };
}
