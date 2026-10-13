import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { courseLanguages, courses, fadeSchedules, fadeStages, languages } from "../schema/index.js";
import { courseRows, DEFAULT_LANGUAGE, defaultFadeStages, languageRows } from "./data.js";

// Safe to run any number of times: existing rows are left as they are.
await db.insert(languages).values(languageRows).onConflictDoNothing();
await db.insert(courses).values(courseRows).onConflictDoNothing();

const allCourses = await db.select({ id: courses.id }).from(courses);
await db
  .insert(courseLanguages)
  .values(allCourses.map((c) => ({ courseId: c.id, languageCode: DEFAULT_LANGUAGE, isDefault: true })))
  .onConflictDoNothing();

// One default fade schedule per course, with the four stages above.
await db
  .insert(fadeSchedules)
  .values(allCourses.map((c) => ({ courseId: c.id, name: "Default", isDefault: true })))
  .onConflictDoNothing();
const schedules = await db.select({ id: fadeSchedules.id }).from(fadeSchedules).where(eq(fadeSchedules.isDefault, true));
await db
  .insert(fadeStages)
  .values(schedules.flatMap((s) => defaultFadeStages.map((stage) => ({ scheduleId: s.id, ...stage }))))
  .onConflictDoNothing();

await db.$client.end();
console.log("Seed complete");
