// GET /progress, GET /recommendations/next, GET /sessions/active and POST /sessions
export type SkillRef = { id: string; slug: string; name: string };
export type ExerciseRung = 1 | 2 | 3 | 4 | 5;

export type ProgressSummary = {
  total: number;
  locked: number;
  ready: number;
  in_progress: number;
  cleared: number;
  review_due: number;
};

export type SkillStatus = "locked" | "ready" | "in_progress" | "cleared" | "review_due";

export type ProgressResponse = {
  course: { slug: string };
  summary: ProgressSummary;
  skills: Array<{
    skill: SkillRef & { description: string | null; difficulty: number };
    prerequisites: string[];
    reading: { score: number; effective: number };
    writing: { score: number; effective: number };
    stage: number | null;
    status: SkillStatus;
  }>;
  outside: Array<{ skill: SkillRef; course: { slug: string }; status: "cleared" | "in_progress" | "not_started" }>;
};

export type Recommendation = {
  id: string;
  skill: SkillRef;
  rung: ExerciseRung;
  reason: "new_skill" | "review";
  exerciseId: string | null;
};
export type RecommendationResponse = {
  recommendation: Recommendation | null;
  waitingFor: Array<{ skill: SkillRef; course: { slug: string } }>;
};

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
