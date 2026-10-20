import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { exercises, exerciseSecrets, lessons, masteryRecords } from "../src/infrastructure/database/schema/index.js";
import { logCall, spentThisMonthInr } from "../src/infrastructure/llm/llm-log.js";
import type { LlmProvider } from "../src/infrastructure/llm/llm-provider.js";
import type { SandboxProvider } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { addHandWrittenLesson, hasLesson } from "../src/modules/m6_exercises/services/freeze-lesson.js";
import { generateLesson } from "../src/modules/m6_exercises/services/generate-lesson.js";
import { REVIEW_SYSTEM } from "../src/modules/m6_exercises/services/lesson-draft.js";
import { bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

// This month's lesson spend, controlled per test.
vi.mock("../src/infrastructure/llm/llm-log.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/infrastructure/llm/llm-log.js")>()),
  spentThisMonthInr: vi.fn(async () => 0),
}));
beforeEach(() => vi.mocked(spentThisMonthInr).mockClear());

const EXAMPLE = "#include <iostream>\nint main() {\n    int total = 1 + 2 + 3;\n    std::cout << total << \"\\n\";\n}\n";
const CHECK = "#include <iostream>\nint main() {\n    std::cout << 7 / 2 << \"\\n\";\n}\n";
const LEAKY = "int sumOfDigits(int n) { int s = 0; while (n > 0) { s += n % 10; n /= 10; } return s; }";

const lesson = (overrides: object = {}) =>
  JSON.stringify({
    explanationMd: "Adding numbers in a loop keeps a running total. ".repeat(10),
    diagram: 'flowchart TB\n  A["total = 0"] --> B["add each number"] --> C["print total"]',
    example: { code: EXAMPLE, output: "6", walkthroughMd: "First the three numbers are added, then the total is printed on its own line. ".repeat(2) },
    mistakesMd: "- Forgetting to start the total at 0, so it holds garbage.\n- Printing inside the loop instead of after it.\n",
    check: { code: CHECK, output: "3", explanationMd: "Integer division drops the remainder, so 7 / 2 is 3." },
    ...overrides,
  });

const FALSE_CLAIM = JSON.stringify({ problems: [{ claim: "An inner int i changes the outer i", truth: "it shadows it; the outer i is untouched" }] });

// A fake Gemini: lessons from `drafts` in turn, fact-checks from `reviews` (clean once they run out),
// each call logged as the real one does.
const llm = (drafts: string[], reviews: string[] = []) => {
  const queue = { drafts: [...drafts], reviews: [...reviews] };
  const generate = vi.fn<LlmProvider["generate"]>(async ({ purpose, model, promptVersion, system }) => {
    const text = system === REVIEW_SYSTEM ? (queue.reviews.shift() ?? JSON.stringify({ problems: [] })) : queue.drafts.shift()!;
    const callId = await logCall({ purpose, model, promptVersion, inputTokens: 1, outputTokens: 1, latencyMs: 1, status: "ok", estCostInr: "0" });
    return { text, callId };
  });
  return { generate };
};

// The fake sandbox runs only our two programs, and prints what they would.
const sandbox: SandboxProvider = {
  run: async ({ files }) => ({
    sandboxId: "fake",
    compile: { ok: true, output: "" },
    tests: [{ exitCode: 0, timedOut: false, timeMs: 1, peakMemoryKb: 1, stderr: "", stdout: files["solution.cpp"] === EXAMPLE ? "6\n" : files["solution.cpp"] === CHECK ? "3\n" : "?" }],
  }),
};

const lessonsOf = (skillId: string) => db.select().from(lessons).where(eq(lessons.skillId, skillId));
const promptOf = (fake: ReturnType<typeof llm>, call: number) => fake.generate.mock.calls[call][0].prompt;

describe("lesson generation", () => {
  it("writes, proves and freezes a lesson for one level", async () => {
    const skill = await createSkill((await createCourse()).id);
    const fake = llm([lesson()]);
    const result = await generateLesson(skill.id, "cpp", "new", { llm: fake, sandbox });

    expect(result.ok).toBe(true);
    const [row] = await lessonsOf(skill.id);
    expect(row).toMatchObject({ level: "new", exampleOutput: "6", checkOutput: "3", model: "gemini-3.8-flash", promptVersion: "lesson-v1" });
    expect(fake.generate.mock.calls[0][0]).toMatchObject({ purpose: "explanation", thinking: "low", allowFreeTier: undefined });
    expect(promptOf(fake, 0)).toContain("LEVEL: new.");
    expect(fake.generate.mock.calls[1][0]).toMatchObject({ system: REVIEW_SYSTEM, model: "gemini-3.8-flash" }); // then fact-checked
    expect(promptOf(fake, 1)).toContain("Forgetting to start the total at 0");
  });

  it("refuses a lesson the fact-check finds false, and tells the next try what is true", async () => {
    const skill = await createSkill((await createCourse()).id);
    const fake = llm([lesson(), lesson()], [FALSE_CLAIM]);

    expect((await generateLesson(skill.id, "cpp", "building", { llm: fake, sandbox })).ok).toBe(true);
    expect(fake.generate).toHaveBeenCalledTimes(4); // draft, fact-check, draft, fact-check
    expect(promptOf(fake, 2)).toContain('it states something false: "An inner int i changes the outer i" (in fact: it shadows it; the outer i is untouched)');
    expect(await lessonsOf(skill.id)).toHaveLength(1);
  });

  it("refuses a lesson that gives a practice exercise away, and tells the next try why", async () => {
    const skill = await createSkill((await createCourse()).id);
    const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id, 5), title: "Sum of digits", status: "verified" }).returning();
    await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "h", referenceSolution: LEAKY });
    const fake = llm([lesson({ mistakesMd: `Here is the whole answer:\n\n\`\`\`cpp\n${LEAKY}\n\`\`\`` }), lesson()]);

    expect((await generateLesson(skill.id, "cpp", "building", { llm: fake, sandbox, allowFreeTier: true })).ok).toBe(true);
    expect(fake.generate).toHaveBeenCalledTimes(3); // the leak is caught before any fact-check
    expect(promptOf(fake, 0)).toContain("Don't solve or reuse these practice exercises of the skill: Sum of digits.");
    expect(promptOf(fake, 1)).toContain('it gives away the practice exercise "Sum of digits"');
    expect(fake.generate.mock.calls[1][0].allowFreeTier).toBe(true); // only when the script asks for it
  });

  it("refuses programs that don't print what the lesson states, and gives up after three tries", async () => {
    const skill = await createSkill((await createCourse()).id);
    const wrong = lesson({ example: { code: EXAMPLE, output: "7", walkthroughMd: "w".repeat(120) } });
    const fake = llm([wrong, wrong, wrong]);

    expect(await generateLesson(skill.id, "cpp", "strong", { llm: fake, sandbox })).toEqual({ ok: false, reason: "the example program doesn't print exactly the output it states" });
    expect(fake.generate.mock.calls.map((c) => c[0].model)).toEqual(["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.1-pro-preview"]);
    expect(await lessonsOf(skill.id)).toEqual([]);
  });

  it("stops before calling the model once this month's ₹300 is spent", async () => {
    vi.mocked(spentThisMonthInr).mockResolvedValueOnce(300);
    const fake = llm([]);
    const skill = await createSkill((await createCourse()).id);
    expect(await generateLesson(skill.id, "cpp", "new", { llm: fake, sandbox })).toEqual({ ok: false, reason: "this month's lesson budget is spent" });
    expect(fake.generate).not.toHaveBeenCalled();
    expect(spentThisMonthInr).toHaveBeenCalledWith("explanation");
  });
});

describe("hand-written lessons", () => {
  it("pass the same gates, are frozen as hand-written, and fill their level for the generator", async () => {
    const skill = await createSkill((await createCourse()).id);
    const key = { skillId: skill.id, languageCode: "cpp", level: "new" as const };
    const draft = JSON.parse(lesson());

    expect(await addHandWrittenLesson(key, { ...draft, check: { ...draft.check, output: "4" } }, sandbox)).toEqual({ ok: false, reason: "the check program doesn't print exactly the output it states" });
    expect(await hasLesson(key)).toBe(false);
    expect((await addHandWrittenLesson(key, draft, sandbox)).ok).toBe(true);
    expect((await lessonsOf(skill.id))[0]).toMatchObject({ model: "hand-written", promptVersion: "hand-written", llmCallId: null });
    expect(await hasLesson(key)).toBe(true); // so `pnpm lessons:generate` leaves this level alone
  });
});

describe("GET /lessons/:skillId", () => {
  it("serves the lesson for the learner's level, or the nearest one written so far", async () => {
    const skill = await createSkill((await createCourse()).id);
    await generateLesson(skill.id, "cpp", "new", { llm: llm([lesson()]), sandbox });
    const user = await createUser();
    const get = async () => (await request(app).get(`/api/v1/lessons/${skill.id}`).set("Authorization", await bearerFor(user.id)).expect(200)).body.data;

    const fresh = await get();
    expect(fresh).toMatchObject({ level: "new", lesson: { level: "new", example: { code: EXAMPLE, output: "6" }, check: { code: CHECK, output: "3" } } });
    expect(fresh.lesson.diagram).toMatch(/^flowchart TB/);

    await db.insert(masteryRecords).values({ userId: user.id, skillId: skill.id, languageCode: "cpp", decayLambda: 0.05, writingScore: 0.9, writingEvidenceAt: new Date() });
    expect(await get()).toMatchObject({ level: "strong", lesson: { level: "new" } }); // no strong lesson yet: the nearest
  });

  it("is null until a lesson is written, 404 for an unknown skill, and needs a login", async () => {
    const skill = await createSkill((await createCourse()).id);
    const auth = await bearerFor((await createUser()).id);
    expect((await request(app).get(`/api/v1/lessons/${skill.id}`).set("Authorization", auth).expect(200)).body.data).toEqual({ level: "new", lesson: null });
    await request(app).get(`/api/v1/lessons/${crypto.randomUUID()}`).set("Authorization", auth).expect(404);
    await request(app).get(`/api/v1/lessons/${skill.id}`).expect(401);
  });
});
