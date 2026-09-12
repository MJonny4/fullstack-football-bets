import { WeightedRandomResultEngine } from "@fb/core";
import { LIVE_ENGINE_VERSION } from "@fb/shared";

export const RESULT_ENGINE = Symbol("RESULT_ENGINE");
export const MATCH_SIMULATION_VERSION = Symbol("MATCH_SIMULATION_VERSION");
export const simulationVersionProvider = { provide: MATCH_SIMULATION_VERSION, useValue: LIVE_ENGINE_VERSION };

export const resultEngineProvider = {
  provide: RESULT_ENGINE,
  useFactory: () => new WeightedRandomResultEngine(),
};
