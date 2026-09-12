import { describe, expect, it, vi } from "vitest";
import { SnapshotCache } from "./snapshot-cache.js";

describe("public snapshot cache", () => {
  it("shares in-flight reads and cached values until expiry", async () => {
    let now = 0;
    const read = vi.fn(async (id: string) => ({ id }));
    const cache = new SnapshotCache(read, 750, 2, () => now);
    const [a, b] = await Promise.all([cache.get("a"), cache.get("a")]);
    expect(a).toBe(b);
    expect(read).toHaveBeenCalledTimes(1);
    now = 749; await cache.get("a");
    expect(read).toHaveBeenCalledTimes(1);
    now = 750; await cache.get("a");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("does not let a slow invalidated read overwrite a newer revision", async () => {
    const resolve: Array<(value: number) => void> = [];
    const cache = new SnapshotCache(() => new Promise<number>(done => resolve.push(done)));
    const old = cache.get("match"); await Promise.resolve();
    cache.invalidate("match");
    const fresh = cache.get("match"); await Promise.resolve();
    resolve[1]!(2); expect(await fresh).toBe(2);
    resolve[0]!(1); expect(await old).toBe(1);
    expect(await cache.get("match")).toBe(2);
  });

  it("bounds memory and does not cache failed reads", async () => {
    const read = vi.fn(async (id: string) => id);
    const cache = new SnapshotCache(read, 1000, 2);
    await cache.get("a"); await cache.get("b"); await cache.get("c"); await cache.get("a");
    expect(read).toHaveBeenCalledTimes(4);
    const failing = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("offline")).mockResolvedValue("back");
    const recovery = new SnapshotCache(failing);
    await expect(recovery.get("a")).rejects.toThrow("offline");
    expect(await recovery.get("a")).toBe("back");
  });
});
