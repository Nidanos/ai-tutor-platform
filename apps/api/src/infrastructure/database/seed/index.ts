import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { courseLanguages, courses, fadeSchedules, fadeStages, languages } from "../schema/index.js";
import { cppBasicsSkills } from "./cpp-basics.js";
import { dsaSkills } from "./dsa.js";
import { courseRows, DEFAULT_LANGUAGE, defaultFadeStages, languageRows } from "./data.js";
import { seedSkills } from "./seed-skills.js";
import { cppDiagnosticReading } from "./cpp-diagnostic-reading.js";
import { cppDiagnosticWriting } from "./cpp-diagnostic-writing.js";
import { cppPracticeBank } from "./cpp-practice-bank.js";
import { seedExercises } from "./seed-exercises.js";

// Safe to run any number of times.
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

await seedSkills("cpp-basics", cppBasicsSkills);
await seedSkills("dsa", dsaSkills); // after C++ basics: its skills build on them
await seedExercises("cpp-basics", cppPracticeBank);
await seedExercises("cpp-basics", [...cppDiagnosticReading, ...cppDiagnosticWriting], "diagnostic");

await db.$client.end();
console.log("Seed complete");
