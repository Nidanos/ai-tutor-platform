import { eq } from "drizzle-orm";
import { db } from "../src/infrastructure/database/index.js";
import {
  courseLanguages,
  courses,
  diagnosticAttempts,
  diagnosticItems,
  diagnosticResponses,
  diagnosticResults,
  enrollments,
  evidenceEvents,
  exerciseAttempts,
  exercises,
  exerciseTests,
  fadeSchedules,
  fadeStageChanges,
  fadeStages,
  hintEvents,
  languages,
  lessonNotes,
  learningSessions,
  masteryRecords,
  organizations,
  recommendations,
  runTestResults,
  sandboxRuns,
  sessionSteps,
  skills,
  submissions,
  users,
} from "../src/infrastructure/database/schema/index.js";
import { defaultFadeStages } from "../src/infrastructure/database/seed/data.js";
import { getStage } from "../src/modules/m12_scaffolding/services/scaffolding.service.js";
import { signAccessToken } from "../src/shared/auth/tokens.js";

// Random suffix so tests never collide and never need cleanup.
export const uniq = () => crypto.randomUUID().slice(0, 8);

// Postgres error codes, matched on the error Drizzle wraps.
export const PG = { unique: "23505", foreignKey: "23503", check: "23514" } as const;
export const pgError = (code: string) => ({ cause: { code } });

export async function createUser(email = `${uniq()}@test.dev`) {
  const [org] = await db.insert(organizations).values({ name: "Test", slug: uniq() }).returning();
  const [user] = await db
    .insert(users)
    .values({ orgId: org.id, email, displayName: "Test", passwordHash: "x" })
    .returning();
  return user;
}

export async function ensureLanguage(code: string) {
  await db
    .insert(languages)
    .values({ code, displayName: code, toolchain: "test", toolchainVersion: "1", compileFlags: "" })
    .onConflictDoNothing();
}

// A course offered in C++ only.
export async function createCourse() {
  await ensureLanguage("cpp");
  const [course] = await db.insert(courses).values({ slug: uniq(), title: "Test" }).returning();
  await db.insert(courseLanguages).values({ courseId: course.id, languageCode: "cpp", isDefault: true });
  return course;
}

export async function createSkill(courseId: string) {
  const [skill] = await db
    .insert(skills)
    .values({ courseId, slug: uniq(), name: "Test", skillType: "conceptual", decayLambda: 0.05, difficulty: 1 })
    .returning();
  return skill;
}

// A new learner enrolled in a new C++ course.
export async function createEnrollment() {
  const [user, course] = [await createUser(), await createCourse()];
  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId: user.id, courseId: course.id, languageCode: "cpp" })
    .returning();
  return enrollment;
}

// A learner working on an exercise of their own course, with hint ceiling 3.
export async function createAttempt() {
  const enrollment = await createEnrollment();
  const exercise = await createExercise((await createSkill(enrollment.courseId)).id);
  const [attempt] = await db
    .insert(exerciseAttempts)
    .values({ userId: enrollment.userId, enrollmentId: enrollment.id, exerciseId: exercise.id, hintCeiling: 3 })
    .returning();
  return attempt;
}

export const exerciseRow =(skillId: string, rung = 3) => ({
  skillId,
  languageCode: "cpp",
  rung,
  variantSeed: 1,
  contentVersion: "v1",
  source: "template" as const,
  title: "Test",
  promptMd: "Test",
  starterCode: "",
  timeLimitMs: 1000,
  memoryLimitMb: 256,
});

export async function createExercise(skillId: string) {
  const [exercise] = await db.insert(exercises).values(exerciseRow(skillId)).returning();
  return exercise;
}

// "Authorization" header value for a user, as the mobile app would send it.
export async function bearerFor(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return `Bearer ${await signAccessToken({ userId, role: user.role, orgId: user.orgId })}`;
}

// The seed gives every course this schedule; tests build courses themselves.
export async function addDefaultFadeSchedule(courseId: string) {
  const [schedule] = await db.insert(fadeSchedules).values({ courseId, name: "Default", isDefault: true }).returning();
  await db.insert(fadeStages).values(defaultFadeStages.map((stage) => ({ scheduleId: schedule.id, ...stage })));
}

export const LEARNER_CODE = "int main() { return 42; }";

// A learner with rows in every table of learning data, each linked the way the app links them:
// for the DPDP export and erasure tests.
export async function createLearnerWithHistory() {
  const { id: enrollmentId, userId, courseId } = await createEnrollment();
  await db.update(enrollments).set({ goalText: "Pass my placement interview" }).where(eq(enrollments.id, enrollmentId));
  const { id: skillId } = await createSkill(courseId);
  const { id: exerciseId } = await createExercise(skillId);
  const key = { userId, skillId, languageCode: "cpp" };

  const [rec] = await db
    .insert(recommendations)
    .values({ enrollmentId, skillId, rung: 3, reason: "new_skill", totalScore: 1, scoreBreakdown: {}, candidatesSnapshot: [], algorithmVersion: "test", exerciseId })
    .returning();
  const [session] = await db.insert(learningSessions).values({ userId, enrollmentId }).returning();
  const [step] = await db.insert(sessionSteps).values({ sessionId: session.id, seq: 1, kind: "exercise", recommendationId: rec.id, exerciseId }).returning();
  const [attempt] = await db.insert(exerciseAttempts).values({ userId, enrollmentId, exerciseId, sessionStepId: step.id, hintCeiling: 3 }).returning();
  const [submission] = await db
    .insert(submissions)
    .values({ attemptId: attempt.id, userId, exerciseId, languageCode: "cpp", answer: LEARNER_CODE, answerSha256: "x", idempotencyKey: uniq(), status: "completed", verdict: "WA" })
    .returning();
  const [run] = await db
    .insert(sandboxRuns)
    .values({ purpose: "submission", submissionId: submission.id, exerciseId, solutionKind: "learner", languageCode: "cpp", toolchainVersion: "1", compileOutput: LEARNER_CODE })
    .returning();
  const [test] = await db.insert(exerciseTests).values({ exerciseId, seq: 1, name: "t1", size: "small", visibility: "hidden", input: "1", expectedOutput: "1" }).returning();
  await db.insert(runTestResults).values({ runId: run.id, testId: test.id, verdict: "WA", stdoutExcerpt: "41" });
  await db.insert(hintEvents).values({ attemptId: attempt.id, level: 1, kind: "delivered", bodyMd: "Look at `return 42;`" });
  await db.insert(lessonNotes).values({ userId, skillId, languageCode: "cpp", bodyMd: "Watch the last digit.", attemptsSeen: 1 });

  await db.insert(masteryRecords).values({ ...key, decayLambda: 0.05, writingScore: 0.4 });
  await db.insert(evidenceEvents).values({ ...key, dimension: "writing", submissionId: submission.id, weight: 1, scoreBefore: 0, scoreAfter: 0.4, formulaVersion: "test" });
  await addDefaultFadeSchedule(courseId);
  await getStage(key, courseId);
  await db.insert(fadeStageChanges).values({ ...key, fromStage: 1, toStage: 2, submissionId: submission.id, reason: "solved" });

  // Placement: a reading answer the learner typed, and a writing one graded through a submission.
  const [diagnostic] = await db.insert(diagnosticAttempts).values({ enrollmentId, attemptNo: 1 }).returning();
  const items = await db
    .insert(diagnosticItems)
    .values((["reading", "writing"] as const).map((dimension) => ({ skillId, languageCode: "cpp", dimension, difficulty: 1, promptMd: "?", payload: {}, contentVersion: "v1" })))
    .returning();
  await db.insert(diagnosticResponses).values([
    { diagnosticId: diagnostic.id, itemId: items[0].id, seq: 1, answer: { output: "42" }, isCorrect: true },
    { diagnosticId: diagnostic.id, itemId: items[1].id, seq: 2, answer: {}, isCorrect: false, submissionId: submission.id },
  ]);
  await db.insert(diagnosticResults).values({ diagnosticId: diagnostic.id, skillId, estReading: 1, estWriting: 0, confidence: 0.5 });
  return { userId, enrollmentId, sessionId: session.id, attemptId: attempt.id, submissionId: submission.id, runId: run.id, diagnosticId: diagnostic.id };
}
