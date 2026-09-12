import { describe, expect, it } from "vitest";
import { PitchMotion, type PitchLayout } from "./pitch-motion.js";

const layout = (x = 100, revision = 1): PitchLayout => ({ revision, sequence: revision,
  phase: "LIVE", players: [{ id: "player", slot: "home:ST", x, y: 200 }], ball: { x, y: 215 } });

describe("continuous pitch motion", () => {
  it("retargets without teleporting and respects per-frame speed limits", () => {
    const motion = new PitchMotion(layout());
    motion.retarget(layout(900, 2), 0);
    expect(motion.players.get("player")!.x).toBe(100);
    for (let tick = 1; tick <= 120; tick++) {
      const beforePlayer = { ...motion.players.get("player")! };
      const beforeBall = { ...motion.ball };
      motion.advance(1000 / 60, tick * 1000 / 60);
      expect(Math.hypot(motion.players.get("player")!.x - beforePlayer.x, motion.players.get("player")!.y - beforePlayer.y)).toBeLessThanOrEqual(95 / 60 + .0001);
      expect(Math.hypot(motion.ball.x - beforeBall.x, motion.ball.y - beforeBall.y)).toBeLessThanOrEqual(900 / 60 + .0001);
    }
    expect(motion.ball.x).toBeGreaterThan(850);
  });

  it("keeps velocity when a pass changes direction and clamps long inactive frames", () => {
    const motion = new PitchMotion(layout());
    motion.retarget(layout(800, 2), 0);
    motion.advance(50, 50);
    const before = { ...motion.ball };
    motion.retarget(layout(50, 3), 50);
    expect(motion.ball).toEqual(before);
    motion.advance(60_000, 60_050);
    expect(Math.hypot(motion.ball.x - before.x, motion.ball.y - before.y)).toBeLessThanOrEqual(45.001);
  });

  it("handles substitution positions, stale packets, and reduced-motion snapping", () => {
    const motion = new PitchMotion(layout());
    const next = layout(800, 2); next.players[0]!.id = "substitute";
    motion.retarget(next, 0);
    expect(motion.players.has("player")).toBe(false);
    expect(motion.players.get("substitute")!.x).toBe(100);
    motion.retarget(layout(50, 1), 1);
    expect(motion.players.has("player")).toBe(false);
    motion.snap();
    expect(motion.players.get("substitute")!.x).toBe(800);
    expect(motion.ball.x).toBe(800);
    expect(motion.trail).toHaveLength(0);
  });

  it("does not replay historical shots during reconnect catch-up", () => {
    const next = layout(100, 2);
    next.shot = { sequence: 2, step: 2, actionId: "shot", period: 1, second: 10,
      type: "SHOT", side: "HOME", playerId: "player", relatedPlayerId: null,
      text: "A shot", important: true, outcome: "GOAL" };
    const fresh = new PitchMotion(layout());
    fresh.retarget(next, 0); fresh.advance(50, 50);
    expect(fresh.ball.x).toBeGreaterThan(100);
    const catchingUp = new PitchMotion(layout());
    catchingUp.retarget(next, 60000, false); catchingUp.advance(50, 60050);
    expect(catchingUp.ball.x).toBe(100);
    catchingUp.retarget(next, 61000); catchingUp.advance(50, 61050);
    expect(catchingUp.ball.x).toBe(100);
  });
});
