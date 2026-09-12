import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchAudienceService } from "../src/leaderboard/match-audience.service.js";
import { LIVE_AUDIENCE_KEY } from "@fb/shared";

function withRedis(service: MatchAudienceService) {
  const redis = { status: "ready", zadd: vi.fn().mockResolvedValue(1), zrem: vi.fn().mockResolvedValue(1),
    disconnect: vi.fn() };
  Object.assign(service, { redis });
  return redis;
}

afterEach(() => vi.useRealTimers());
describe("match viewer presence", () => {
  it("keeps a match watched until its last viewer leaves, without counting duplicate joins", () => {
    const service = new MatchAudienceService();
    service.watch("a", "match"); service.watch("a", "match"); service.watch("b", "match");
    service.unwatch("a");
    expect([...service.watchedMatchIds()]).toEqual(["match"]);
    service.unwatch("b");
    expect(service.watchedMatchIds().size).toBe(0);
  });
  it("moves presence between matches and expires disconnected REST readers", () => {
    vi.useFakeTimers(); vi.setSystemTime(1000);
    const service = new MatchAudienceService();
    service.watch("a", "old"); service.watch("a", "new"); service.touch("rest");
    expect([...service.watchedMatchIds()]).toEqual(["new", "rest"]);
    vi.setSystemTime(9001);
    expect([...service.watchedMatchIds()]).toEqual(["new"]);
    service.unwatch("a");
    expect(service.watchedMatchIds().size).toBe(0);
  });

  it("publishes one shared match lease and removes it only after the last socket leaves", async () => {
    vi.useFakeTimers(); vi.setSystemTime(1000);
    const service = new MatchAudienceService();
    const redis = withRedis(service);
    service.watch("a", "match"); service.watch("a", "match"); service.watch("b", "match");
    service.unwatch("a");
    expect(redis.zrem).not.toHaveBeenCalled();
    expect(redis.zadd).toHaveBeenLastCalledWith(LIVE_AUDIENCE_KEY, 13000, expect.stringMatching(/:match$/));
    service.unwatch("b"); service.unwatch("b");
    expect(redis.zrem).toHaveBeenCalledTimes(1);
    expect(service.watchedMatchIds().size).toBe(0);
    await service.onModuleDestroy();
  });

  it("bounds REST leases and forgets expired shutdown bookkeeping", async () => {
    vi.useFakeTimers(); vi.setSystemTime(1000);
    const service = new MatchAudienceService();
    const redis = withRedis(service);
    for (let i = 0; i < 1000; i++) service.touch(`match-${i}`);
    expect(service.watchedMatchIds().size).toBe(500);
    expect(redis.zrem).toHaveBeenCalledTimes(500);
    vi.setSystemTime(9001);
    expect(service.watchedMatchIds().size).toBe(0);
    redis.zrem.mockClear();
    await service.onModuleDestroy();
    expect(redis.zrem).not.toHaveBeenCalled();
    expect(redis.disconnect).toHaveBeenCalledOnce();
  });

  it("keeps local audience usable when Redis writes fail", async () => {
    const service = new MatchAudienceService();
    const redis = withRedis(service);
    redis.zadd.mockRejectedValue(new Error("offline"));
    redis.zrem.mockRejectedValue(new Error("offline"));
    service.watch("a", "match"); service.touch("rest");
    expect([...service.watchedMatchIds()]).toEqual(["match", "rest"]);
    service.unwatch("a");
    expect([...service.watchedMatchIds()]).toEqual(["rest"]);
    await service.onModuleDestroy();
  });
});
