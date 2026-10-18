import { describe, expect, it } from "vitest";
import { type Clock, IDLE_MS, PAUSED_MAX_MS, settle, touch, transition } from "../src/modules/m9_sessions/services/session-clock.js";

const now = new Date("2026-10-19T10:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const clock = (extra: Partial<Clock> = {}): Clock => ({
  status: "active",
  lastActiveAt: ago(60_000),
  pausedAt: null,
  endedAt: null,
  endReason: null,
  activeMs: 0,
  ...extra,
});

describe("session clock", () => {
  it("leaves a recently active session alone", () => {
    expect(settle(clock(), now)).toEqual({});
  });

  it("pauses after 15 idle minutes, from the moment it went idle", () => {
    const lastActiveAt = ago(IDLE_MS + 60_000);
    expect(settle(clock({ lastActiveAt }), now)).toEqual({ status: "paused", pausedAt: new Date(lastActiveAt.getTime() + IDLE_MS) });
  });

  it("ends a session paused for over 24 hours, whether paused by hand or by going idle", () => {
    const pausedAt = ago(PAUSED_MAX_MS + 60_000);
    expect(settle(clock({ status: "paused", pausedAt }), now)).toMatchObject({ status: "ended", endReason: "idle" });
    expect(settle(clock({ lastActiveAt: ago(2 * PAUSED_MAX_MS) }), now)).toMatchObject({ status: "ended", endReason: "idle" });
  });

  it("counts time between activities as study, but never while paused", () => {
    expect(touch(clock({ activeMs: 1000 }), now)).toEqual({ activeMs: 61_000, lastActiveAt: now });
    expect(touch(clock({ status: "paused", activeMs: 1000 }), now).activeMs).toBe(1000);
  });

  it("pauses, resumes and ends on request, and does nothing for the same state", () => {
    expect(transition(clock(), "paused", now)).toMatchObject({ status: "paused", pausedAt: now, activeMs: 60_000 });
    expect(transition(clock({ status: "paused", pausedAt: ago(1) }), "active", now)).toEqual({ status: "active", pausedAt: null, lastActiveAt: now });
    expect(transition(clock(), "ended", now)).toMatchObject({ status: "ended", endReason: "user", endedAt: now });
    expect(transition(clock(), "active", now)).toEqual({});
  });
});
