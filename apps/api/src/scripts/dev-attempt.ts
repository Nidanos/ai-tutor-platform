import { and, eq } from "drizzle-orm";
import { db } from "../infrastructure/database/index.js";
import { courses, enrollments, exerciseAttempts, exercises, users } from "../infrastructure/database/schema/index.js";

// DEV ONLY, until GET /exercises/:id starts attempts: enrols a user in cpp-basics (C++) and opens an
// attempt on the starter exercise "Sum of digits". Usage: pnpm dev:attempt you@example.com
const email = process.argv[2];
const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email ?? ""));
if (!user) throw new Error(`No user with email "${email}". Register first.`);

const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, "cpp-basics"));
await db.insert(enrollments).values({ userId: user.id, courseId: course.id, languageCode: "cpp" }).onConflictDoNothing();
const [enrollment] = await db
  .select({ id: enrollments.id })
  .from(enrollments)
  .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)));
const [exercise] = await db.select({ id: exercises.id }).from(exercises).where(eq(exercises.title, "Sum of digits"));

await db
  .insert(exerciseAttempts)
  .values({ userId: user.id, enrollmentId: enrollment.id, exerciseId: exercise.id, hintCeiling: 5 })
  .onConflictDoNothing(); // one active attempt per learner and exercise
const [attempt] = await db
  .select({ id: exerciseAttempts.id })
  .from(exerciseAttempts)
  .where(and(eq(exerciseAttempts.userId, user.id), eq(exerciseAttempts.exerciseId, exercise.id), eq(exerciseAttempts.status, "active")));

console.log(attempt ? `attemptId: ${attempt.id}` : "This exercise is already solved by this user.");
await db.$client.end();
