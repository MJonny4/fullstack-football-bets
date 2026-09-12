import "dotenv/config";

import {
  closeBettingWindows,
  openNextRound,
  prisma,
  resolveDueMatches,
  shouldRecoverCurrentRound,
  WeightedRandomResultEngine,
  progressLiveMatches,
  flushMatchOutbox,
  LIVE_DATA_CHANNEL,
  LIVE_AUDIENCE_KEY,
} from "@fb/core";
import { Job, Queue, Worker } from "bullmq";
import { rmSync, writeFileSync } from "node:fs";
import { Redis } from "ioredis";
import { loadConfig } from "./config.js";
import {
  JOB_NAMES,
  LIFECYCLE_QUEUE,
  LIVE_DATA_CHANGED_CHANNEL,
  type LifecycleJobName,
  SCHEDULES,
} from "./jobs.js";

interface BalanceChange {
  userId: string;
  ledgerEntryId: string;
  ledgerType: string;
  amount: number;
  balanceAfter: number;
  reference: string | null;
}

const READY_FILE = "/tmp/football-bets-worker-ready";
const PID_FILE = "/tmp/football-bets-worker.pid";
rmSync(READY_FILE, { force: true });
writeFileSync(PID_FILE, String(process.pid));

const config = loadConfig();
const queueConnection = createRedis("queue");
const workerConnection = createRedis("worker");
const publisher = createRedis("publisher");
const queue = new Queue(LIFECYCLE_QUEUE, { connection: queueConnection });
const engine = new WeightedRandomResultEngine();

function createRedis(role: string): Redis {
  const connection = new Redis(config.redisUrl, {
    ...(role === "publisher" ? { maxRetriesPerRequest: 1, enableOfflineQueue: false, commandTimeout: 1000 }
      : { maxRetriesPerRequest: null }),
    enableReadyCheck: true,
  });
  connection.on("error", (error) => {
    console.error(`[worker:${role}] Redis error`, error);
  });
  return connection;
}

async function watchedMatchIds(): Promise<Set<string> | undefined> {
  try {
    const leases = await publisher.zrangebyscore(LIVE_AUDIENCE_KEY, Date.now(), "+inf");
    return new Set(leases.map(member => member.slice(member.lastIndexOf(":") + 1)));
  } catch {
    // Viewer telemetry is an optimization, never a prerequisite for kickoff.
    return undefined;
  }
}

async function publishLiveDataChange(
  balanceChanges: readonly BalanceChange[],
  source: LifecycleJobName,
  stateChanged: boolean,
): Promise<void> {
  if (!stateChanged && balanceChanges.length === 0) return;

  await publisher.publish(
    LIVE_DATA_CHANGED_CHANNEL,
    JSON.stringify({
      type: "live-data.changed",
      source,
      stateChanged,
      occurredAt: new Date().toISOString(),
      balanceChanges,
    }),
  );
}

async function processJob(job: Job): Promise<unknown> {
  const now = new Date();
  switch (job.name as LifecycleJobName) {
    case JOB_NAMES.LIVE_TICK: {
      const result = await progressLiveMatches(prisma, now, { watchedMatchIds: await watchedMatchIds() });
      for (const error of result.errors) console.error(`[worker:live] ${error.matchId}: ${error.message}`);
      await flushMatchOutbox(prisma, message => publisher.publish(LIVE_DATA_CHANNEL, JSON.stringify(message)));
      return { advanced: result.advanced.length, settled: result.settlements.length };
    }
    case JOB_NAMES.OPEN_ROUND: {
      const result = await openNextRound(prisma, {
        now,
        timezone: config.timezone,
        topupAmount: config.topupAmount,
      });
      await publishLiveDataChange(
        result.balanceChanges,
        JOB_NAMES.OPEN_ROUND,
        result.created,
      );
      return result;
    }
    case JOB_NAMES.CLOSE_WINDOWS: {
      const result = await closeBettingWindows(prisma, { now });
      await publishLiveDataChange(
        [],
        JOB_NAMES.CLOSE_WINDOWS,
        result.closedRoundIds.length > 0,
      );
      return result;
    }
    case JOB_NAMES.RESOLVE_DUE: {
      const result = await resolveDueMatches(prisma, engine, { now });
      await publishLiveDataChange(
        result.balanceChanges,
        JOB_NAMES.RESOLVE_DUE,
        result.lockedMatchIds.length > 0 ||
          result.matches.some(({ settled }) => settled),
      );
      return result;
    }
    case JOB_NAMES.RECOVER: {
      const closed = await closeBettingWindows(prisma, { now });
      const resolved = await resolveDueMatches(prisma, engine, { now });
      const live = await progressLiveMatches(prisma, now, { watchedMatchIds: await watchedMatchIds() });
      for (const error of live.errors) console.error(`[worker:recovery] ${error.matchId}: ${error.message}`);
      await flushMatchOutbox(prisma, message => publisher.publish(LIVE_DATA_CHANNEL, JSON.stringify(message)));
      const opened = shouldRecoverCurrentRound(now, config.timezone)
        ? await openNextRound(prisma, {
            now,
            timezone: config.timezone,
            topupAmount: config.topupAmount,
          })
        : null;
      await publishLiveDataChange(
        [...resolved.balanceChanges, ...(opened?.balanceChanges ?? [])],
        JOB_NAMES.RECOVER,
        closed.closedRoundIds.length > 0 ||
          resolved.lockedMatchIds.length > 0 ||
          resolved.matches.some(({ settled }) => settled) ||
          opened?.created === true,
      );
      return { closed, resolved, opened, live };
    }
    default:
      throw new Error(`Unknown lifecycle job: ${job.name}`);
  }
}

const worker = new Worker(LIFECYCLE_QUEUE, processJob, {
  connection: workerConnection,
  concurrency: config.concurrency,
});

worker.on("completed", (job) => {
  if (job.name === JOB_NAMES.LIVE_TICK) return;
  console.info(`[worker] completed ${job.name} (${job.id ?? "no-id"})`);
});
worker.on("failed", (job, error) => {
  console.error(
    `[worker] failed ${job?.name ?? "unknown"} (${job?.id ?? "no-id"})`,
    error,
  );
});
worker.on("error", (error) => {
  console.error("[worker] BullMQ worker error", error);
});

async function registerSchedules(): Promise<void> {
  const template = {
    opts: {
      attempts: 5,
      backoff: { type: "exponential" as const, delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  };

  await Promise.all(
    Object.values(SCHEDULES).map((schedule) =>
      queue.upsertJobScheduler(
        schedule.id,
        { pattern: schedule.pattern, tz: config.timezone },
        { ...template, name: schedule.name, data: {} },
      ),
    ),
  );

  await queue.upsertJobScheduler("live-match-clock", { every: 1_000 }, {
    name: JOB_NAMES.LIVE_TICK, data: {},
    opts: { attempts: 3, backoff: { type: "exponential", delay: 1_000 }, removeOnComplete: 20, removeOnFail: 50 },
  });

  await queue.add(
    JOB_NAMES.RECOVER,
    { bootedAt: new Date().toISOString() },
    {
      jobId: `boot-recovery-${Date.now()}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 25,
      removeOnFail: 100,
    },
  );
}

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.info(`[worker] received ${signal}; shutting down`);
  rmSync(READY_FILE, { force: true });

  const fallback = setTimeout(() => {
    console.error("[worker] graceful shutdown timed out");
    process.exit(1);
  }, 15_000);
  fallback.unref();

  await worker.close();
  await queue.close();
  await Promise.all([
    publisher.quit(),
    queueConnection.quit(),
    workerConnection.quit(),
    prisma.$disconnect(),
  ]);
  clearTimeout(fallback);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT").then(() => process.exit(0));
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM").then(() => process.exit(0));
});

registerSchedules()
  .then(() => {
    writeFileSync(READY_FILE, new Date().toISOString());
    console.info(
      `[worker] ready; timezone=${config.timezone}, concurrency=${config.concurrency}`,
    );
  })
  .catch(async (error: unknown) => {
    console.error("[worker] startup failed", error);
    await shutdown("startup failure");
    process.exit(1);
  });
