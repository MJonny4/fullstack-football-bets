import { describe, expect, it } from "vitest";
import { FORMATIONS, formatMatchClock, type LiveEvent, type SimulationInput, type SimulationState } from "@fb/shared";
import { fixtureInput } from "../test/simulation-fixtures.js";
import { initializeSimulation, simulationResult, stepSimulation } from "./simulation-engine.js";

function finish(input: SimulationInput, initial: SimulationState) {
  let state = initial;
  const events: LiveEvent[] = [];
  while (state.phase !== "FINISHED") {
    const next = stepSimulation(input, state);
    state = next.state;
    events.push(...next.events);
    if (state.step > 1600) throw new Error("Unbounded match");
  }
  return { state, events };
}

describe("incremental match engine", () => {
  it("replays identically from a JSON checkpoint without mutating it", () => {
    const input = fixtureInput();
    const original = initializeSimulation(input, "checkpoint");
    let midpoint = original;
    for (let step = 0; step < 650; step++) midpoint = stepSimulation(input, midpoint).state;
    const resumed = finish(input, JSON.parse(JSON.stringify(midpoint)));
    const uninterrupted = finish(input, original);
    expect(resumed.state).toEqual(uninterrupted.state);
    expect(resumed.events).toEqual(uninterrupted.events.filter(e => e.step > midpoint.step));
    expect(original.step).toBe(0);
    expect(original.home.stats.goals).toBe(0);
    expect(() => simulationResult(midpoint)).toThrow("full time");
    expect(stepSimulation(input, resumed.state).events).toEqual([]);
  });

  it.each(FORMATIONS)("maintains football and event invariants with %s", formation => {
    const input = fixtureInput(75, 68, formation);
    const { state, events } = finish(input, initializeSimulation(input, `invariants-${formation}`));
    expect(state.step * 0.25).toBeGreaterThan(285);
    expect(state.step * 0.25).toBeLessThan(340);
    expect(events.map(e => e.sequence)).toEqual(events.map((_, i) => i + 1));
    expect(events.filter(e => e.type === "HALFTIME")).toHaveLength(1);
    expect(events.filter(e => e.type === "FULL_TIME")).toHaveLength(1);
    for (const [side, team] of [["HOME", state.home], ["AWAY", state.away]] as const) {
      expect(team.stats.goals).toBeLessThanOrEqual(team.stats.shotsOnTarget);
      expect(team.stats.shotsOnTarget).toBeLessThanOrEqual(team.stats.shots);
      expect(events.filter(e => e.side === side && e.type === "GOAL")).toHaveLength(team.stats.goals);
      expect(events.filter(e => e.side === side && e.type === "SHOT")).toHaveLength(team.stats.shots);
      expect(events.filter(e => e.side === side && e.type === "CORNER")).toHaveLength(team.stats.corners);
      expect(team.stats.cards).toBe(team.stats.yellows + events.filter(e => e.side === side && e.type === "RED_CARD" && e.text.startsWith("Straight")).length);
      expect(team.substitutions).toBeGreaterThan(0);
      expect(team.substitutions).toBeLessThanOrEqual(5);
      expect(team.substitutionWindows).toBeLessThanOrEqual(3);
      const ended = new Map<string, number>();
      for (const event of events) {
        if (event.type === "SUBSTITUTION" && event.relatedPlayerId) ended.set(event.relatedPlayerId, event.sequence);
        if (event.type === "RED_CARD" && event.playerId) ended.set(event.playerId, event.sequence);
        if (event.playerId && ended.has(event.playerId) && event.type !== "RED_CARD") {
          expect(event.sequence).toBeLessThanOrEqual(ended.get(event.playerId)!);
        }
      }
    }
    const nextWeek = initializeSimulation(input, "next-week");
    expect(nextWeek.home.players.every(p => p.energy === 100 && p.yellows === 0 && !p.injured)).toBe(true);
  });

  it("changes subsequent play when a starter is exhausted or dismissed", () => {
    const input = fixtureInput();
    const normal = initializeSimulation(input, "causal");
    const weakened = structuredClone(normal);
    const striker = weakened.home.players.find(p => p.position === "ST")!;
    striker.status = "DISMISSED";
    for (const p of weakened.home.players) p.energy = 25;
    const strong = finish(input, normal);
    const weak = finish(input, weakened);
    expect(weak.events).not.toEqual(strong.events);
    expect(weak.events.some(e => e.playerId === striker.id)).toBe(false);
  });

  it("rejects incomplete squads and formats added time", () => {
    const input = fixtureInput();
    input.home.players.pop();
    expect(() => initializeSimulation(input, "invalid")).toThrow("squad");
    expect(formatMatchClock(2820, 1, "LIVE")).toBe("45+2′");
    expect(formatMatchClock(5580, 2, "LIVE")).toBe("90+3′");
    expect(formatMatchClock(2820, 1, "HALFTIME")).toBe("HT");
  });
});
