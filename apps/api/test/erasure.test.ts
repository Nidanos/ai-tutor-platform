import { eq, sql } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  consents,
  diagnosticAttempts,
  diagnosticResponses,
  diagnosticResults,
  enrollments,
  evidenceEvents,
  exerciseAttempts,
  fadeStageChanges,
  hintEvents,
  learningSessions,
  lessonNotes,
  masteryRecords,
  organizations,
  recommendations,
  refreshTokens,
  runTestResults,
  sandboxRuns,
  sessionSteps,
  skillScaffolding,
  submissions,
  users,
} from "../src/infrastructure/database/schema/index.js";
import { eraseAccount, eraseDueAccounts } from "../src/modules/m1_auth/services/erasure.service.js";
import { bearerFor, createLearnerWithHistory } from "./helpers.js";

type History = Awaited<ReturnType<typeof createLearnerWithHistory>>;

const DAY = 86_400_000;
const askedToDelete = (userId: string, daysAgo: number) =>
  db.update(users).set({ deletionRequestedAt: new Date(Date.now() - daysAgo * DAY) }).where(eq(users.id, userId));
const notesOf = (h: History) => db.$count(lessonNotes, eq(lessonNotes.userId, h.userId));
const userRow = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0];

// How many rows each table of learning data holds for this learner.
async function rowCounts(h: History) {
  const counts = await Promise.all([
    db.$count(enrollments, eq(enrollments.userId, h.userId)),
    db.$count(diagnosticAttempts, eq(diagnosticAttempts.id, h.diagnosticId)),
    db.$count(diagnosticResponses, eq(diagnosticResponses.diagnosticId, h.diagnosticId)),
    db.$count(diagnosticResults, eq(diagnosticResults.diagnosticId, h.diagnosticId)),
    db.$count(masteryRecords, eq(masteryRecords.userId, h.userId)),
    db.$count(evidenceEvents, eq(evidenceEvents.userId, h.userId)),
    db.$count(recommendations, eq(recommendations.enrollmentId, h.enrollmentId)),
    db.$count(learningSessions, eq(learningSessions.userId, h.userId)),
    db.$count(sessionSteps, eq(sessionSteps.sessionId, h.sessionId)),
    db.$count(exerciseAttempts, eq(exerciseAttempts.userId, h.userId)),
    db.$count(submissions, eq(submissions.userId, h.userId)),
    db.$count(sandboxRuns, eq(sandboxRuns.id, h.runId)),
    db.$count(runTestResults, eq(runTestResults.runId, h.runId)),
    db.$count(hintEvents, eq(hintEvents.attemptId, h.attemptId)),
    db.$count(skillScaffolding, eq(skillScaffolding.userId, h.userId)),
    db.$count(fadeStageChanges, eq(fadeStageChanges.userId, h.userId)),
  ]);
  return counts;
}

async function learnerWhoAgreed(...kinds: (typeof consents.$inferInsert)["kind"][]) {
  const h = await createLearnerWithHistory();
  await db.update(users).set({ dateOfBirth: "2000-01-01", timezone: "Europe/London" }).where(eq(users.id, h.userId));
  await db.insert(consents).values(["data_processing", "terms", ...kinds].map((kind) => ({ userId: h.userId, kind, policyVersion: "0.1" })));
  await db.insert(refreshTokens).values({ userId: h.userId, familyId: crypto.randomUUID(), tokenHash: crypto.randomUUID(), client: "web", ip: "10.0.0.1", expiresAt: new Date(Date.now() + DAY) });
  return h;
}

// Every table that points at a user or at a learner's rows, by what erasure does with it (ADR-0018).
const POINTS_AT_LEARNERS = {
  erased: ["diagnostic_attempts", "diagnostic_responses", "diagnostic_results", "enrollments", "evidence_events", "exercise_attempts", "fade_stage_changes", "hint_events", "learning_sessions", "lesson_notes", "mastery_records", "recommendations", "run_test_results", "sandbox_runs", "session_steps", "skill_scaffolding", "submissions"],
  keptAsRecords: ["consents", "password_reset_tokens", "refresh_tokens"],
  noWriterYet: ["calibration_records", "review_items"],
  whoMadeContent: ["exercises", "fade_schedules", "generation_jobs", "skill_prerequisites"], // authors, not learners
};

describe("account erasure (DPDP doc §4)", () => {
  it("knows every table that points at a learner: a new one must join the export and erasure first", async () => {
    const targets = ["users", ...POINTS_AT_LEARNERS.erased];
    const { rows } = await db.execute<{ name: string }>(
      sql`select distinct conrelid::regclass::text as name from pg_constraint where contype = 'f' and confrelid::regclass::text in ${targets}`,
    );
    expect(rows.map((r) => r.name).sort()).toEqual(Object.values(POINTS_AT_LEARNERS).flat().sort());
  });

  it("anonymises the person and deletes every learning row, keeping the consents as proof", async () => {
    const h = await learnerWhoAgreed();
    expect((await rowCounts(h)).every((n) => n > 0)).toBe(true);
    await askedToDelete(h.userId, 8);
    await eraseDueAccounts();

    const user = await userRow(h.userId);
    expect(user).toMatchObject({ email: `deleted-${h.userId}@deleted.invalid`, displayName: "Deleted learner", dateOfBirth: null, timezone: "Asia/Kolkata", status: "deleted", lastLoginAt: null, deletionRequestedAt: null });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/); // a hash of a password nobody knows
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.orgId));
    expect(org.name).toBe("Deleted learner");
    const logins = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, h.userId));
    expect(logins.map((t) => t.revokedAt !== null)).toEqual([true]); // a security record: kept a year, ended
    const kept = await db.select().from(consents).where(eq(consents.userId, h.userId));
    expect(kept.map((k) => k.revokedAt !== null)).toEqual([true, true]);
    expect((await rowCounts(h)).every((n) => n === 0)).toBe(true);
    expect(await notesOf(h)).toBe(0);

    await request(app).get("/api/v1/auth/me").set("Authorization", await bearerFor(h.userId)).expect(401); // an old token is no use
  });

  it("keeps the anonymous numbers of a learner who opted in to research, but never their code or words", async () => {
    const h = await learnerWhoAgreed("research_study");
    const before = await rowCounts(h);
    await askedToDelete(h.userId, 8);
    await eraseDueAccounts();

    expect(await rowCounts(h)).toEqual(before);
    expect(await notesOf(h)).toBe(0); // written for the person: never kept
    expect((await userRow(h.userId)).status).toBe("deleted");
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, h.submissionId));
    expect(submission).toMatchObject({ answer: null, verdict: "WA" });
    expect(submission.answerPurgedAt).not.toBeNull();
    const [run] = await db.select().from(sandboxRuns).where(eq(sandboxRuns.id, h.runId));
    expect(run.compileOutput).toBeNull();
    const [result] = await db.select().from(runTestResults).where(eq(runTestResults.runId, h.runId));
    expect(result).toMatchObject({ stdoutExcerpt: null, verdict: "WA" });
    const [hint] = await db.select().from(hintEvents).where(eq(hintEvents.attemptId, h.attemptId));
    expect(hint).toMatchObject({ bodyMd: null, level: 1 });
    const answers = await db.select().from(diagnosticResponses).where(eq(diagnosticResponses.diagnosticId, h.diagnosticId));
    expect(answers.map((a) => [a.answer, a.isCorrect])).toEqual(expect.arrayContaining([[{}, true], [{}, false]]));
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, h.enrollmentId));
    expect(enrollment.goalText).toBeNull();
    const live = await db.select().from(consents).where(eq(consents.userId, h.userId));
    expect(live.every((k) => k.revokedAt !== null)).toBe(true);
  });

  it("leaves accounts still in their grace period, and requests cancelled by logging in", async () => {
    const waiting = await learnerWhoAgreed();
    await askedToDelete(waiting.userId, 6);
    const cancelled = await learnerWhoAgreed(); // logging in cleared the request
    await eraseDueAccounts();
    await eraseAccount(cancelled.userId); // as if the job had picked it up just before the login

    for (const h of [waiting, cancelled]) {
      expect((await userRow(h.userId)).status).toBe("active");
      expect((await rowCounts(h)).every((n) => n > 0)).toBe(true);
    }
  });
});
