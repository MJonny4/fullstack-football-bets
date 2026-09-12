import { EXACT_SCORE_SELECTIONS, FORMATIONS, getMarketProbabilities, getMatchProbabilityModel,
  type ExactScoreSelection, type Formation } from "@fb/shared";
import { fixtureInput } from "../test/simulation-fixtures.js";
import { calibrationFailures } from "../test/calibration-checks.js";
import { initializeSimulation, stepSimulation } from "../src/simulation-engine.js";

const samples = Number(process.argv[2] ?? 1000);
if (!Number.isSafeInteger(samples) || samples < 1000 || samples > 100000) {
  throw new Error("Calibration requires 1,000–100,000 samples per scenario");
}
const scenarios: Array<[number, number, Formation]> = [
  [72, 72, "4-3-3"], [85, 60, "4-3-3"], [60, 85, "4-3-3"],
  ...FORMATIONS.filter(formation => formation !== "4-3-3").map(formation => [72, 72, formation] as [number, number, Formation]),
];
let failed = false;
for (const [home, away, formation] of scenarios) {
  const input = fixtureInput(home, away, formation);
  const exactScores = Object.fromEntries(EXACT_SCORE_SELECTIONS.map(selection => [selection, 0])) as Record<ExactScoreSelection, number>;
  const counts = { home: 0, draw: 0, away: 0, goals: 0, homeGoals: 0, shots: 0, cards: 0, corners: 0, cardsOver: 0, cornersOver: 0, steps: 0, subs: 0 };
  for (let seed = 0; seed < samples; seed++) {
    let state = initializeSimulation(input, `calibration-${seed}`);
    while (state.phase !== "FINISHED") {
      state = stepSimulation(input, state).state;
      if (state.step > 1600) throw new Error(`Unbounded match in ${home}/${away}/${formation}, seed ${seed}`);
    }
    const h = state.home.stats; const a = state.away.stats;
    const score = `${h.goals}-${a.goals}` as ExactScoreSelection;
    exactScores[EXACT_SCORE_SELECTIONS.includes(score) ? score : "OTHER"]++;
    counts[h.goals > a.goals ? "home" : h.goals === a.goals ? "draw" : "away"]++;
    counts.goals += h.goals + a.goals; counts.homeGoals += h.goals;
    counts.shots += h.shots + a.shots; counts.cards += h.cards + a.cards;
    counts.corners += h.corners + a.corners;
    counts.cardsOver += Number(h.cards + a.cards > 4.5);
    counts.cornersOver += Number(h.corners + a.corners > 9.5);
    counts.steps += state.step;
    counts.subs += state.home.substitutions + state.away.substitutions;
  }
  const failures = calibrationFailures({
    probabilities: {
      MATCH_RESULT: { HOME: counts.home / samples, DRAW: counts.draw / samples, AWAY: counts.away / samples },
      EXACT_SCORE: Object.fromEntries(Object.entries(exactScores).map(([score, count]) => [score, count / samples])) as Record<ExactScoreSelection, number>,
      TOTAL_CARDS: { OVER: counts.cardsOver / samples, UNDER: 1 - counts.cardsOver / samples },
      TOTAL_CORNERS: { OVER: counts.cornersOver / samples, UNDER: 1 - counts.cornersOver / samples },
    },
    homeGoals: counts.homeGoals / samples, awayGoals: (counts.goals - counts.homeGoals) / samples,
    cards: counts.cards / samples, corners: counts.corners / samples,
  }, home, away);
  failed ||= failures.length > 0;
  console.log(JSON.stringify({ home, away, formation, samples, passed: failures.length === 0, failures,
    actual: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round(v / samples * 1000) / 1000])),
    target: { ...getMatchProbabilityModel(home!, away!), ...getMarketProbabilities(home!, away!) },
  }));
}
if (failed) process.exitCode = 1;
