import { eq } from "drizzle-orm";
import { db } from "../src/infrastructure/database/index.js";
import {
  courseLanguages,
  courses,
  enrollments,
  exerciseAttempts,
  exercises,
  fadeSchedules,
  fadeStages,
  languages,
  organizations,
  skills,
  users,
} from "../src/infrastructure/database/schema/index.js";
import { defaultFadeStages } from "../src/infrastructure/database/seed/data.js";
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
