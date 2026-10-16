import { eq } from "drizzle-orm";
import { TOOLCHAINS } from "../../../modules/m7_execution/services/toolchains.js";
import { db } from "../index.js";
import { courses, exercises, exerciseSecrets, exerciseTests, skills } from "../schema/index.js";
import type { ExerciseTemplate } from "./cpp-templates.js";

const DEFAULT_LIMITS = { timeLimitMs: 2000, memoryLimitMb: 256 }; // ADR-0003

// The frozen harness owns main(): it #includes the learner's file and runs test number argv[1].
// Rung 1 has none: the learner predicts the program's output instead of running it.
export const harnessFor = ({ call, cases }: ExerciseTemplate) =>
  call
    ? `#include <iostream>
#include <string>
#include "solution.cpp"

int main(int argc, char** argv) {
  switch (std::stoi(argv[1])) {
${cases.map((c, i) => `    case ${i + 1}: ${call(c.args)} break;`).join("\n")}
  }
}
`
    : null;

// Inserts each template once, as a draft; `pnpm exercises:verify` decides what gets served.
// Seeded content is frozen: to change an exercise, add a new variant.
export async function seedExercises(courseSlug: string, templates: ExerciseTemplate[]) {
  const rows = await db
    .select({ id: skills.id, slug: skills.slug })
    .from(skills)
    .innerJoin(courses, eq(courses.id, skills.courseId))
    .where(eq(courses.slug, courseSlug));
  const skillId = new Map(rows.map((r) => [r.slug, r.id]));

  for (const t of templates) {
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(exercises)
        .values({
          skillId: skillId.get(t.skill)!,
          languageCode: "cpp",
          rung: t.rung,
          variantSeed: 1,
          contentVersion: TOOLCHAINS.cpp.version,
          source: "template",
          title: t.title,
          promptMd: t.promptMd,
          starterCode: t.starterCode,
          functionSignature: t.functionSignature ?? null,
          ...DEFAULT_LIMITS,
        })
        .onConflictDoNothing()
        .returning({ id: exercises.id });
      if (!created) return; // already seeded

      await tx.insert(exerciseSecrets).values({ exerciseId: created.id, harnessCode: harnessFor(t), referenceSolution: t.reference });
      await tx.insert(exerciseTests).values(
        t.cases.map((c, i) => ({
          exerciseId: created.id,
          seq: i + 1,
          name: i === 0 ? "Example" : `Test ${i + 1}`,
          size: "small" as const,
          visibility: i === 0 ? ("sample" as const) : ("hidden" as const),
          input: c.args || null,
          expectedOutput: c.expected,
        })),
      );
    });
  }
}
