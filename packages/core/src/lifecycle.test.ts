import { describe, expect, it } from "vitest";
import { shouldRecoverCurrentRound } from "./lifecycle.js";

describe("weekly lifecycle recovery", () => {
  it.each([
    ["before Monday's opening", "2026-09-07T06:59:59.999Z", false],
    ["at Monday's opening", "2026-09-07T07:00:00.000Z", true],
    ["in the middle of the betting week", "2026-09-09T12:00:00.000Z", true],
    ["just before Friday's close", "2026-09-11T21:58:59.999Z", true],
    ["at Friday's close", "2026-09-11T21:59:00.000Z", false],
    ["during the weekend", "2026-09-12T10:00:00.000Z", false],
  ])("returns the catch-up decision %s", (_label, timestamp, expected) => {
    expect(
      shouldRecoverCurrentRound(new Date(timestamp), "Europe/Madrid"),
    ).toBe(expected);
  });

  it("uses the configured timezone across daylight-saving changes", () => {
    expect(
      shouldRecoverCurrentRound(
        new Date("2026-10-26T07:59:59.999Z"),
        "Europe/Madrid",
      ),
    ).toBe(false);
    expect(
      shouldRecoverCurrentRound(
        new Date("2026-10-26T08:00:00.000Z"),
        "Europe/Madrid",
      ),
    ).toBe(true);
  });
});
