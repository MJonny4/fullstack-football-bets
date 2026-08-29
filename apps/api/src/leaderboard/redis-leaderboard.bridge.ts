import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Redis } from "ioredis";
import { LeaderboardGateway } from "./leaderboard.gateway.js";

export const LIVE_DATA_CHANGED_CHANNEL = "football-bets:live-data-changed";

@Injectable()
export class RedisLeaderboardBridge implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLeaderboardBridge.name);
  private subscriber?: Redis;

  constructor(
    @Inject(LeaderboardGateway)
    private readonly gateway: LeaderboardGateway,
  ) {}

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log("REDIS_URL is unset; cross-process live updates are disabled");
      return;
    }

    this.subscriber = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
    this.subscriber.on("error", (error) =>
      this.logger.error(`Redis subscriber error: ${error.message}`),
    );
    this.subscriber.on("message", (channel) => {
      if (channel === LIVE_DATA_CHANGED_CHANNEL) {
        void this.gateway.broadcast().catch((error: unknown) =>
          this.logger.error("Could not broadcast a worker live-data update", error),
        );
      }
    });

    try {
      await this.subscriber.connect();
      await this.subscriber.subscribe(LIVE_DATA_CHANGED_CHANNEL);
    } catch (error) {
      this.logger.error("Could not connect the leaderboard Redis subscriber", error);
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit().catch(() => undefined);
    }
  }
}
