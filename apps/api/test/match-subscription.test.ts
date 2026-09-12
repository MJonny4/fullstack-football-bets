import { afterEach, describe, expect, it, vi } from "vitest";
import type { Socket } from "socket.io";
import { LeaderboardGateway } from "../src/leaderboard/leaderboard.gateway.js";
import { MatchAudienceService } from "../src/leaderboard/match-audience.service.js";
import type { MatchSnapshotService } from "../src/leaderboard/match-snapshot.service.js";

function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function fixture() {
  vi.useFakeTimers(); vi.setSystemTime(1000);
  const audience = new MatchAudienceService();
  const snapshots = { get: vi.fn().mockImplementation(async (id: string) => ({ id })), invalidate: vi.fn() };
  const gateway = new LeaderboardGateway(null!, null!, null!, audience, snapshots as unknown as MatchSnapshotService);
  const rooms = new Set(["client"]);
  const client = { id: "client", connected: true, data: {}, rooms, emit: vi.fn(),
    join: vi.fn(async (room: string) => { rooms.add(room); }),
    leave: vi.fn(async (room: string) => { rooms.delete(room); }),
  } as unknown as Socket;
  return { gateway, audience, snapshots, client, rooms };
}

afterEach(() => vi.useRealTimers());
describe("match subscription races", () => {
  it("ignores an old failed snapshot after switching to another match", async () => {
    const { gateway, audience, snapshots, client, rooms } = fixture();
    const old = deferred<unknown>();
    snapshots.get.mockImplementationOnce(() => old.promise);
    const first = gateway.watch(client, "old");
    await vi.waitFor(() => expect(snapshots.get).toHaveBeenCalledWith("old"));
    vi.setSystemTime(2000);
    expect(await gateway.watch(client, "new")).toEqual({ watching: "new" });
    old.reject(new Error("Slow read failed")); await first;
    expect([...audience.watchedMatchIds()]).toEqual(["new"]);
    expect([...rooms]).toEqual(["client", "match:new"]);
    expect(client.emit).toHaveBeenCalledExactlyOnceWith("match:snapshot", { id: "new" });
  });

  it("does not send a historical snapshot or retain presence after hiding the tab", async () => {
    const { gateway, audience, snapshots, client, rooms } = fixture();
    const old = deferred<unknown>();
    snapshots.get.mockImplementationOnce(() => old.promise);
    const first = gateway.watch(client, "match");
    await vi.waitFor(() => expect(snapshots.get).toHaveBeenCalledOnce());
    await gateway.unwatch(client);
    old.resolve({ id: "match" });
    expect(await first).toEqual({ error: "Subscription superseded" });
    expect(client.emit).not.toHaveBeenCalled();
    expect(audience.watchedMatchIds().size).toBe(0);
    expect([...rooms]).toEqual(["client"]);
  });

  it("cleans up a pending room join when the viewer disconnects", async () => {
    const { gateway, audience, client, rooms } = fixture();
    const joined = deferred<void>();
    vi.mocked(client.join).mockImplementation(async room => {
      await joined.promise; rooms.add(room as string);
    });
    const first = gateway.watch(client, "match");
    await vi.waitFor(() => expect(client.join).toHaveBeenCalledOnce());
    Object.assign(client, { connected: false });
    gateway.handleDisconnect(client);
    joined.resolve(); await first;
    await vi.waitFor(() => expect(rooms.has("match:match")).toBe(false));
    expect(audience.watchedMatchIds().size).toBe(0);
    expect(client.emit).not.toHaveBeenCalled();
  });

  it("keeps one room through repeated navigation and invalidates snapshots with no viewers", async () => {
    const { gateway, audience, snapshots, client, rooms } = fixture();
    expect(await gateway.watch(client, "first")).toEqual({ watching: "first" });
    expect(await gateway.watch(client, "second")).toEqual({ error: "Please retry shortly" });
    vi.setSystemTime(2000);
    expect(await gateway.watch(client, "second")).toEqual({ watching: "second" });
    expect([...rooms]).toEqual(["client", "match:second"]);
    expect([...audience.watchedMatchIds()]).toEqual(["second"]);
    snapshots.get.mockClear();
    await gateway.broadcastMatch("second");
    expect(snapshots.invalidate).toHaveBeenCalledWith("second");
    expect(snapshots.get).not.toHaveBeenCalled();
  });
});
