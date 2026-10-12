// Shared Domain & API Contracts across Modules M1 to M13

export type UserRole = "LEARNER" | "AUTHOR" | "ADMIN";
export type SkillType = "syntactic" | "conceptual";
export type ExerciseRung = 1 | 2 | 3 | 4 | 5; // 1:Predict, 2:Diagnose, 3:Complete, 4:Extend, 5:Build
export type HintLevel = 1 | 2 | 3 | 4 | 5; // 1:Concept, 2:Location, 3:Mechanism, 4:Example, 5:Answer

// M1: User Identity
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  goal?: string;
}

// M2: Skill Graph Node
export interface SkillNode {
  id: string;
  name: string;
  type: SkillType;
  baseDecayLambda: number;
  prerequisites: string[];
}

// M4: Dual Mastery & Decay
export interface MasteryRecord {
  userId: string;
  skillId: string;
  readingScore: number; // 0.0 to 1.0 (Comprehension)
  writingScore: number; // 0.0 to 1.0 (Construction)
  effectiveMastery: number; // Stored score * exp(-lambda * dt)
  lastEvidenceAt: string;
}

// M6: Exercise Payload
export interface Exercise {
  id: string;
  skillId: string;
  rung: ExerciseRung;
  prompt: string;
  starterCode: string;
  solutionCode?: string;
  tests: string;
}

// M7: Code Submission & Sandbox Verdict
export interface SubmissionRequest {
  exerciseId: string;
  code: string;
}

export interface SubmissionVerdict {
  submissionId: string;
  passed: boolean;
  testResults: Array<{ name: string; passed: boolean; error?: string }>;
  executionTimeMs: number;
}

// M8: Socratic Hint State
export interface HintResponse {
  currentLevel: HintLevel;
  content: string;
  bottomedOut: boolean;
}
