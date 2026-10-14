import { and, eq } from "drizzle-orm";
import { TOOLCHAINS } from "../../../modules/m7_execution/services/toolchains.js";
import { db } from "../index.js";
import { courses, exercises, exerciseSecrets, exerciseTests, skills } from "../schema/index.js";

// One hand-written, verified exercise, so code can be submitted and judged before AI generation
// exists. The harness owns main(), #includes the learner's file and runs test number argv[1].
const HARNESS = `#include <iostream>
#include <string>
#include "solution.cpp"

int main(int argc, char** argv) {
  const int inputs[] = {123, 0, 999999999, 1000000000};
  std::cout << sumOfDigits(inputs[std::stoi(argv[1]) - 1]) << "\\n";
}
`;

const REFERENCE = `int sumOfDigits(int n) {
  int sum = 0;
  for (; n > 0; n /= 10) sum += n % 10;
  return sum;
}
`;

const TESTS = [
  { name: "Example", visibility: "sample", input: "123", expectedOutput: "6" },
  { name: "Zero", visibility: "hidden", input: "0", expectedOutput: "0" },
  { name: "All nines", visibility: "hidden", input: "999999999", expectedOutput: "81" },
  { name: "Largest input", visibility: "hidden", input: "1000000000", expectedOutput: "1" },
] as const;

const CONTENT = {
  title: "Sum of digits",
  promptMd:
    "Write `int sumOfDigits(int n)` that returns the sum of the decimal digits of `n` (0 ≤ n ≤ 1,000,000,000).\n\n" +
    "Example: `sumOfDigits(123)` returns `6`.",
  starterCode: "int sumOfDigits(int n) {\n  // your code here\n  return 0;\n}\n",
};

export async function seedStarterExercise() {
  const [skill] = await db
    .select({ id: skills.id })
    .from(skills)
    .innerJoin(courses, eq(courses.id, skills.courseId))
    .where(and(eq(courses.slug, "cpp-basics"), eq(skills.slug, "functions")));

  // Upsert on the content key: re-seeding keeps the text current and returns the id either way.
  const [exercise] = await db
    .insert(exercises)
    .values({
      skillId: skill.id,
      languageCode: "cpp",
      rung: 3,
      variantSeed: 1,
      contentVersion: TOOLCHAINS.cpp.version,
      source: "template",
      status: "verified",
      verifiedAt: new Date(),
      functionSignature: "int sumOfDigits(int n)",
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      ...CONTENT,
    })
    .onConflictDoUpdate({
      target: [exercises.skillId, exercises.languageCode, exercises.rung, exercises.variantSeed, exercises.contentVersion],
      set: CONTENT,
    })
    .returning({ id: exercises.id });

  await db
    .insert(exerciseSecrets)
    .values({ exerciseId: exercise.id, harnessCode: HARNESS, referenceSolution: REFERENCE })
    .onConflictDoNothing();
  await db
    .insert(exerciseTests)
    .values(TESTS.map((test, i) => ({ exerciseId: exercise.id, seq: i + 1, size: "small" as const, ...test })))
    .onConflictDoNothing();
}
