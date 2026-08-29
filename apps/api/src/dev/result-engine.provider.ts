import { WeightedRandomResultEngine } from "@fb/core";

export const RESULT_ENGINE = Symbol("RESULT_ENGINE");

export const resultEngineProvider = {
  provide: RESULT_ENGINE,
  useFactory: () => new WeightedRandomResultEngine(),
};
