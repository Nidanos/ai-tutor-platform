import { eq } from "drizzle-orm";
import { TOOLCHAINS } from "../../../modules/m7_execution/services/toolchains.js";
import { db } from "../index.js";
import { courses, diagnosticItems, exercises, exerciseSecrets, exerciseTests, skills } from "../schema/index.js";
import type { ExerciseTemplate } from "./cpp-templates.js";

const DEFAULT_LIMITS = { timeLimitMs: 2000, memoryLimitMb: 256 }; // ADR-0003
// The content key ignores purpose, so placement-test copies need their own variant seed.
const VARIANT_SEED = { practice: 1, diagnostic: 100 } as const;

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

// What the placement test shows: the program to read, or the task's starter and sample. Never an answer.
export const diagnosticPayload = (t: ExerciseTemplate) =>
  t.rung === 1
    ? { code: t.starterCode }
    : { code: t.starterCode, functionSignature: t.functionSignature, sample: { input: t.cases[0].args || null, expectedOutput: t.cases[0].expected } };

// Inserts each template once, as a draft; `pnpm exercises:verify` decides what gets served.
// Seeded content is frozen: to change an exercise, add a new variant.
// Diagnostic templates also get their placement item; it is asked only once its exercise is verified.
export async function seedExercises(courseSlug: string, templates: ExerciseTemplate[], purpose: keyof typeof VARIANT_SEED = "practice") {
  const rows = await db
    .select({ id: skills.id, slug: skills.slug, difficulty: skills.difficulty })
    .from(skills)
    .innerJoin(courses, eq(courses.id, skills.courseId))
    .where(eq(courses.slug, courseSlug));
  const skillOf = new Map(rows.map((r) => [r.slug, r]));

  for (const t of templates) {
    const skill = skillOf.get(t.skill)!;
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(exercises)
        .values({
          skillId: skill.id,
          languageCode: "cpp",
          rung: t.rung,
          variantSeed: VARIANT_SEED[purpose] + (t.variant ?? 0),
          contentVersion: TOOLCHAINS.cpp.version,
          purpose,
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
      if (purpose === "diagnostic") {
        await tx.insert(diagnosticItems).values({
          skillId: skill.id,
          languageCode: "cpp",
          dimension: t.rung === 1 ? "reading" : "writing",
          difficulty: skill.difficulty,
          promptMd: t.promptMd,
          payload: diagnosticPayload(t),
          exerciseId: created.id, // the answer key is this exercise's verified test, never stored twice
          contentVersion: TOOLCHAINS.cpp.version,
        });
      }
    });
  }
}
