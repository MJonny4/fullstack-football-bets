export interface WorkerConfig {
  redisUrl: string;
  timezone: string;
  topupAmount: number;
  concurrency: number;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function validTimezone(value: string): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    throw new Error(`APP_TZ is not a valid IANA timezone: ${value}`);
  }
}

export function loadConfig(): WorkerConfig {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    throw new Error("REDIS_URL is required");
  }

  const concurrency = positiveInteger("WORKER_CONCURRENCY", 5);
  if (concurrency > 50) {
    throw new Error("WORKER_CONCURRENCY must not exceed 50");
  }

  return {
    redisUrl,
    timezone: validTimezone(process.env.APP_TZ?.trim() || "Europe/Madrid"),
    topupAmount: positiveInteger("TOPUP_AMOUNT", 200),
    concurrency,
  };
}
