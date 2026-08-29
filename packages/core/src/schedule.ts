import type { ScheduledDay } from "@prisma/client";

export type RandomSource = () => number;

export interface SchedulableTeam {
  id: string;
}

export interface RoundPairing<TTeam extends SchedulableTeam = SchedulableTeam> {
  homeTeam: TTeam;
  awayTeam: TTeam;
  homeTeamId: string;
  awayTeamId: string;
  scheduledDay: ScheduledDay;
}

export interface RoundScheduleOptions {
  random?: RandomSource;
}

function shuffledIndexes(length: number, random: RandomSource): number[] {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const currentValue = indexes[index];
    const targetValue = indexes[target];
    if (currentValue === undefined || targetValue === undefined) {
      throw new Error("Invalid shuffle index");
    }
    indexes[index] = targetValue;
    indexes[target] = currentValue;
  }
  return indexes;
}

/** Circle-method round robin. Weeks 1..19 cover each pair once for 20 teams. */
export function getRoundSchedule<TTeam extends SchedulableTeam>(
  teams: readonly TTeam[],
  weekNumber: number,
  options: RoundScheduleOptions = {},
): RoundPairing<TTeam>[] {
  if (teams.length < 2 || teams.length % 2 !== 0) {
    throw new RangeError("Round-robin scheduling requires an even team count");
  }
  if (!Number.isInteger(weekNumber) || weekNumber <= 0) {
    throw new RangeError("weekNumber must be a positive integer");
  }
  if (new Set(teams.map(({ id }) => id)).size !== teams.length) {
    throw new Error("Every scheduled team id must be unique");
  }

  const roundsPerCycle = teams.length - 1;
  const roundIndex = (weekNumber - 1) % roundsPerCycle;
  const cycleIndex = Math.floor((weekNumber - 1) / roundsPerCycle);
  let rotation = [...teams];

  for (let round = 0; round < roundIndex; round += 1) {
    const last = rotation.at(-1);
    const fixed = rotation[0];
    if (!last || !fixed) throw new Error("Cannot rotate an empty schedule");
    rotation = [fixed, last, ...rotation.slice(1, -1)];
  }

  const rawPairs: Array<{ homeTeam: TTeam; awayTeam: TTeam }> = [];
  for (let pairIndex = 0; pairIndex < teams.length / 2; pairIndex += 1) {
    const left = rotation[pairIndex];
    const right = rotation[rotation.length - 1 - pairIndex];
    if (!left || !right) throw new Error("Round-robin pairing is incomplete");

    const reverse = (roundIndex + pairIndex + cycleIndex) % 2 === 1;
    rawPairs.push({
      homeTeam: reverse ? right : left,
      awayTeam: reverse ? left : right,
    });
  }

  const random = options.random ?? Math.random;
  const saturdayCount = Math.floor(rawPairs.length / 2);
  const saturdayIndexes = new Set(
    shuffledIndexes(rawPairs.length, random).slice(0, saturdayCount),
  );

  return rawPairs.map(({ homeTeam, awayTeam }, index) => ({
    homeTeam,
    awayTeam,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    scheduledDay: saturdayIndexes.has(index) ? "SAT" : "SUN",
  }));
}
