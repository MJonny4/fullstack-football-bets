import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { LIVE_AUDIENCE_KEY, LIVE_AUDIENCE_LEASE_MS } from "@fb/shared";
import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";

/** Leases, not durable viewer counters: a crashed API cannot keep high mode on. */
@Injectable()
export class MatchAudienceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchAudienceService.name);
  private readonly instanceId = randomUUID();
  private readonly clients = new Map<string, string>();
  private readonly viewerCounts = new Map<string, number>();
  private readonly restReaders = new Map<string, number>();
  private readonly published = new Map<string, number>();
  private redis?: Redis;
  private timer?: ReturnType<typeof setInterval>;

  async onModuleInit() {
    const url = process.env.REDIS_URL?.trim();
    if (!url) return;
    this.redis = new Redis(url, { lazyConnect: true, enableOfflineQueue: false,
      connectTimeout: 1000, commandTimeout: 1000, maxRetriesPerRequest: 1 });
    this.redis.on("error", () => { /* Presence failure must not break match reads. */ });
    await this.redis.connect().catch(() => this.logger.warn("Viewer presence unavailable; matches keep progressing"));
    this.timer = setInterval(() => { void this.refresh(); }, 4000);
    this.timer.unref();
  }

  watch(clientId: string, matchId: string): void {
    const previous = this.clients.get(clientId);
    if (previous !== matchId) {
      this.removeClient(clientId);
      this.clients.set(clientId, matchId);
      this.viewerCounts.set(matchId, (this.viewerCounts.get(matchId) ?? 0) + 1);
      if (previous) void this.publish(previous);
    }
    void this.publish(matchId);
  }

  unwatch(clientId: string): void {
    const matchId = this.removeClient(clientId);
    if (matchId) void this.publish(matchId);
  }

  private removeClient(clientId: string): string | undefined {
    const matchId = this.clients.get(clientId);
    if (matchId) {
      this.clients.delete(clientId);
      const remaining = (this.viewerCounts.get(matchId) ?? 1) - 1;
      if (remaining > 0) this.viewerCounts.set(matchId, remaining);
      else this.viewerCounts.delete(matchId);
    }
    return matchId;
  }

  /** REST fallback viewers still qualify when their WebSocket is unavailable. */
  touch(matchId: string): void {
    this.restReaders.delete(matchId);
    this.restReaders.set(matchId, Date.now() + 8000);
    if (this.restReaders.size > 500) {
      const evicted = this.restReaders.keys().next().value!;
      this.restReaders.delete(evicted);
      void this.publish(evicted);
    }
    void this.publish(matchId);
  }

  watchedMatchIds(now = Date.now()): Set<string> {
    const ids = new Set(this.viewerCounts.keys());
    for (const [id, until] of this.restReaders) {
      if (until > now) ids.add(id);
      else this.restReaders.delete(id);
    }
    // Redis expires the lease logically; also discard our shutdown bookkeeping.
    // Otherwise one-off REST readers accumulate for the API's entire lifetime.
    for (const [member, until] of this.published) if (until <= now) this.published.delete(member);
    return ids;
  }

  private async publish(matchId: string): Promise<void> {
    if (this.redis?.status !== "ready") return;
    const hasSocket = this.viewerCounts.has(matchId);
    const until = hasSocket ? Date.now() + LIVE_AUDIENCE_LEASE_MS : this.restReaders.get(matchId) ?? 0;
    const member = `${this.instanceId}:${matchId}`;
    try {
      if (until > Date.now()) {
        this.published.set(member, until);
        await this.redis.zadd(LIVE_AUDIENCE_KEY, until, member);
      } else {
        this.published.delete(member);
        await this.redis.zrem(LIVE_AUDIENCE_KEY, member);
      }
    } catch { /* Expiring leases recover from failed writes without blocking viewers. */ }
  }

  private async refresh(): Promise<void> {
    const ids = this.watchedMatchIds();
    await Promise.all([...ids].map(id => this.publish(id)));
    if (this.redis?.status === "ready") {
      await this.redis.zremrangebyscore(LIVE_AUDIENCE_KEY, "-inf", Date.now()).catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    if (this.redis?.status === "ready" && this.published.size) {
      await this.redis.zrem(LIVE_AUDIENCE_KEY, ...this.published.keys()).catch(() => undefined);
    }
    this.redis?.disconnect();
  }
}
