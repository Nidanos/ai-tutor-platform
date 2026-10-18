// Session time rules (ADR-0013). Pure, and applied lazily whenever a session is read, so no timer
// job is needed: a session's real state is worked out from when it was last active.
export const IDLE_MS = 15 * 60_000; // no activity this long: paused, and the gap isn't study time
export const PAUSED_MAX_MS = 24 * 60 * 60_000; // paused this long: ended, so the next visit starts fresh

type Status = "active" | "paused" | "ended";
export type Clock = {
  status: Status;
  lastActiveAt: Date;
  pausedAt: Date | null;
  endedAt: Date | null;
  endReason: "user" | "idle" | "completed" | null;
  activeMs: number;
};

// What the session's state really is now. Returns only the fields that changed.
export function settle(s: Clock, now = new Date()): Partial<Clock> {
  const wentIdle = s.status === "active" && now.getTime() - s.lastActiveAt.getTime() > IDLE_MS;
  const pausedAt = wentIdle ? new Date(s.lastActiveAt.getTime() + IDLE_MS) : s.status === "paused" ? s.pausedAt : null;
  if (pausedAt && now.getTime() - pausedAt.getTime() > PAUSED_MAX_MS) {
    return { status: "ended", pausedAt, endedAt: new Date(pausedAt.getTime() + PAUSED_MAX_MS), endReason: "idle" };
  }
  return wentIdle ? { status: "paused", pausedAt } : {};
}

// Activity on an active session: the time since its last activity counts as study (settle has
// already paused it if that gap was too long).
export const touch = (s: Clock, now = new Date()) => ({
  activeMs: s.activeMs + (s.status === "active" ? now.getTime() - s.lastActiveAt.getTime() : 0),
  lastActiveAt: now,
});

// PATCH /sessions/:id (FR-M9-01): the learner pauses, resumes or ends. Ending is final.
export function transition(s: Clock, to: Status, now = new Date()): Partial<Clock> {
  if (s.status === to) return {};
  if (to === "paused") return { ...touch(s, now), status: "paused", pausedAt: now };
  if (to === "active") return { status: "active", pausedAt: null, lastActiveAt: now };
  return { ...touch(s, now), status: "ended", endedAt: now, endReason: "user" };
}
