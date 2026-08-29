import { describe, expect, it } from "vitest";
import { getRoundSchedule } from "./schedule.js";

const teams = Array.from({ length: 20 }, (_, index) => ({
  id: `team-${index + 1}`,
}));

function fixedRandom(): number {
  return 0.42;
}

describe("round-robin scheduling", () => {
  it("schedules every team once and splits five games per day", () => {
    const schedule = getRoundSchedule(teams, 1, { random: fixedRandom });
    expect(schedule).toHaveLength(10);
    expect(schedule.filter(({ scheduledDay }) => scheduledDay === "SAT")).toHaveLength(5);
    expect(schedule.filter(({ scheduledDay }) => scheduledDay === "SUN")).toHaveLength(5);

    const participants = schedule.flatMap(({ homeTeamId, awayTeamId }) => [
      homeTeamId,
      awayTeamId,
    ]);
    expect(new Set(participants)).toHaveLength(20);
  });

  it("covers all 190 pairings exactly once over 19 weeks", () => {
    const pairKeys = new Set<string>();
    for (let week = 1; week <= 19; week += 1) {
      for (const { homeTeamId, awayTeamId } of getRoundSchedule(teams, week, {
        random: fixedRandom,
      })) {
        pairKeys.add([homeTeamId, awayTeamId].sort().join(":"));
      }
    }
    expect(pairKeys).toHaveLength(190);
  });

  it("reverses fixture orientation in the second cycle", () => {
    const first = getRoundSchedule(teams, 1, { random: fixedRandom });
    const secondCycle = getRoundSchedule(teams, 20, { random: fixedRandom });
    expect(secondCycle[0]?.homeTeamId).toBe(first[0]?.awayTeamId);
    expect(secondCycle[0]?.awayTeamId).toBe(first[0]?.homeTeamId);
  });
});
