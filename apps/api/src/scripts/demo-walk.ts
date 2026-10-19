import { createInterface } from "node:readline/promises";
import { and, eq } from "drizzle-orm";
import { db } from "../infrastructure/database/index.js";
import { exercises, exerciseSecrets, skills } from "../infrastructure/database/schema/index.js";

// One new learner through the whole loop on a running API: the Review 3 demo, and a smoke test after a
// deploy (DOCS/phase-3/review-3-demo-script.md). Two code runs on the real sandbox, about ₹0.02.
// It picks its exercise from DATABASE_URL, so run it where that is the API's own database (on the server).
// `pnpm demo:walk` runs straight through; `pnpm demo:walk --pause` waits for Enter before each step.
const API = `${process.env.API_URL ?? "http://localhost:3001"}/api/v1`;
const PASSWORD = "correct horse battery";
const pause = process.argv.includes("--pause");
const keyboard = createInterface({ input: process.stdin, output: process.stdout });
let token = "";

// The API's replies, read loosely: this script only prints them.
type Loose = any;

async function call(method: string, path: string, body?: object) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const json: Loose = res.status === 204 ? {} : await res.json();
  return { status: res.status, data: json.data, error: json.error };
}

async function step(title: string, run: () => Promise<string>) {
  if (pause) await keyboard.question(`\n▶ ${title}  [Enter]`);
  else console.log(`\n▶ ${title}`);
  console.log((await run()).replace(/^/gm, "  "));
}

// A code run takes about 6 s; the result page polls the same way.
async function resultOf(submissionId: string) {
  for (let tries = 0; tries < 60; tries++) {
    const { data } = await call("GET", `/submissions/${submissionId}/result`);
    if (data.status === "completed") return data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("No verdict after a minute: is the API's worker running, with an E2B key?");
}

const submit = async (attemptId: string, answer: string) =>
  resultOf((await call("POST", "/submissions", { attemptId, answer, idempotencyKey: crypto.randomUUID() })).data.submissionId);

const showTests = (result: { tests: { name: string; visibility: string; verdict: string; output?: string; expectedOutput?: string }[] }) =>
  result.tests.map((t) => `  ${t.visibility} "${t.name}": ${t.verdict}${t.visibility === "sample" ? `, expected ${JSON.stringify(t.expectedOutput)}, got ${JSON.stringify(t.output)}` : ""}`).join("\n");

// "Sum of digits" (Functions, rung 3): its starter compiles but fails, and its reference passes (both
// proven when the bank was verified), so they stand in for a wrong and a right answer.
const [demo] = await db
  .select({ id: exercises.id, starter: exercises.starterCode, reference: exerciseSecrets.referenceSolution })
  .from(exercises)
  .innerJoin(skills, eq(skills.id, exercises.skillId))
  .innerJoin(exerciseSecrets, eq(exerciseSecrets.exerciseId, exercises.id))
  .where(and(eq(skills.slug, "functions"), eq(exercises.rung, 3), eq(exercises.purpose, "practice"), eq(exercises.status, "verified")));
if (!demo) throw new Error("No verified Functions rung-3 exercise: run pnpm db:seed and pnpm exercises:verify first");

const email = `demo-${Date.now()}@test.dev`;
const account = { email, password: PASSWORD, displayName: "Demo Learner", acceptTerms: true, acceptPrivacy: true };
const fifteenYearsAgo = `${new Date().getUTCFullYear() - 15}-01-01`;
let skillId = "";
let attemptId = "";

await step("Sign up: under-18s wait for parent approval, so the pilot is adults only", async () => {
  const minor = await call("POST", "/auth/register", { ...account, dateOfBirth: fifteenYearsAgo });
  const adult = await call("POST", "/auth/register", { ...account, dateOfBirth: "2000-05-01" });
  const login = await call("POST", "/auth/login", { email, password: PASSWORD, client: "mobile" });
  token = login.data.accessToken;
  return `15 years old → ${minor.status}: ${minor.error.details[0].message}\nadult → ${adult.status}, account ${adult.data.user.status}; log in → ${login.status}`;
});

await step("Placement test: adaptive, so a beginner who says \"I don't know\" is done in one question", async () => {
  const { diagnostic } = (await call("POST", "/diagnostic/start", {})).data;
  const question = diagnostic.question;
  await call("POST", `/diagnostic/${diagnostic.diagnosticId}/answers`, { itemId: question.itemId, dontKnow: true });
  const done = (await call("POST", `/diagnostic/${diagnostic.diagnosticId}/complete`)).data.diagnostic;
  return `question 1: ${question.dimension}, ${question.skill.name} (the response carries no answer key)\n"I don't know" → finished: ${done.status}, all ${done.results.length} skills start from the beginning`;
});

await step("What next: fixed rules pick the skill, the level and the exercise", async () => {
  const { recommendation } = (await call("GET", "/recommendations/next")).data;
  return `${recommendation.skill.name}, rung ${recommendation.rung} of 5 (${recommendation.reason})`;
});

await step("Open an exercise: the attempt starts with a hint limit from the skill's fade stage", async () => {
  const { exercise, attempt } = (await call("GET", `/exercises/${demo.id}`)).data;
  skillId = exercise.skill.id;
  attemptId = attempt.id;
  return `"${exercise.title}" (${exercise.skill.name}, rung ${exercise.rung}): ${exercise.skill.description}\n${exercise.sampleTests.length} sample test shown; the hidden tests never leave the server; up to ${attempt.hintCeiling} hints`;
});

await step("Submit a wrong answer: it runs in a fresh, offline sandbox", async () => {
  const result = await submit(attemptId, demo.starter);
  return `${result.verdict}, ${result.testsPassed} of ${result.testsTotal} tests\n${showTests(result)}`;
});

await step("Ask for a hint: one level at a time, never the answer before level 5", async () => {
  const { hint } = (await call("POST", `/exercises/${demo.id}/hints`, { code: demo.starter })).data;
  return `level ${hint.level} of ${hint.ceiling} (${hint.source}): ${hint.bodyMd.split("\n")[0]}`;
});

await step("Submit a correct answer, and see the writing score move", async () => {
  const result = await submit(attemptId, demo.reference);
  const mastery = (await call("GET", `/mastery/${skillId}`)).data;
  return `${result.verdict}, ${result.testsPassed} of ${result.testsTotal} tests\nFunctions: reading ${mastery.reading.score.toFixed(2)}, writing ${mastery.writing.score.toFixed(2)} (one hint used, so less credit)`;
});

await step("Progress: every skill, reading and writing apart", async () => {
  const { summary } = (await call("GET", "/progress")).data;
  return Object.entries(summary).map(([status, n]) => `${status} ${n}`).join(", ");
});

await step("Download my data (DPDP access right): one file, from every module", async () => {
  const res = await fetch(`${API}/me/data`, { headers: { Authorization: `Bearer ${token}` } });
  const file: Loose = await res.json();
  return `${res.status}, ${res.headers.get("content-disposition")}\nsections: ${Object.keys(file).join(", ")}\nshared with: ${file.about.sharedWith.map((p: { provider: string }) => p.provider).join("; ")}`;
});

await step("Delete my account: the password again, then 7 days to change one's mind", async () => {
  const deleted = await call("DELETE", "/me", { password: PASSWORD });
  const me = await call("GET", "/auth/me");
  return `${deleted.status}, erased after ${deleted.data.eraseAfter} (the email is printed in the API terminal)\nthe same token now → ${me.status}`;
});

keyboard.close();
await db.$client.end();
