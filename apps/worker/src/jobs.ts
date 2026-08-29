// BullMQ reserves ':' for its Redis key format and rejects it in queue names.
export const LIFECYCLE_QUEUE = "football-bets-lifecycle";
export const LIVE_DATA_CHANGED_CHANNEL = "football-bets:live-data-changed";

export const JOB_NAMES = {
  OPEN_ROUND: "round.open",
  CLOSE_WINDOWS: "round.close-expired",
  RESOLVE_DUE: "match.resolve-due",
  RECOVER: "lifecycle.recover",
} as const;

export type LifecycleJobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export const SCHEDULES = {
  OPEN_ROUND: {
    id: "weekly-round-open",
    pattern: "0 9 * * 1",
    name: JOB_NAMES.OPEN_ROUND,
  },
  CLOSE_WINDOWS: {
    id: "weekly-betting-close",
    pattern: "59 23 * * 5",
    name: JOB_NAMES.CLOSE_WINDOWS,
  },
  RESOLVE_DUE: {
    id: "due-match-sweep",
    pattern: "*/5 * * * *",
    name: JOB_NAMES.RESOLVE_DUE,
  },
} as const;
