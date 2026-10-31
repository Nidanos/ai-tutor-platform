import type { ExerciseRung, SkillRef } from "./types";

export type StudySession = {
  id: string;
  status: "active" | "paused" | "ended";
  startedAt: string;
  lastActiveAt: string;
  activeMs: number;
  endedAt: string | null;
  endReason: "user" | "idle" | "completed" | null;
  step: null | {
    id: string;
    seq: number;
    kind: "exercise" | "review";
    skill: SkillRef;
    rung: ExerciseRung;
    exerciseId: string;
  };
};

export type SessionResponse = { session: StudySession | null };
