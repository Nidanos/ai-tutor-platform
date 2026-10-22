import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { consents, users } from "../src/infrastructure/database/schema/index.js";
import { createLearnerWithHistory, LEARNER_CODE } from "./helpers.js";

// Runs the real script against the test database, as `pnpm pilot:export` would on the server.
function exportPilot(since: Date, until: Date) {
  const out = mkdtempSync(join(tmpdir(), "pilot-export-"));
  execFileSync(process.execPath, ["--import", "tsx", "src/scripts/export-pilot.ts", `--since=${since.toISOString()}`, `--until=${until.toISOString()}`, `--out=${out}`], {
    env: process.env,
    stdio: "pipe",
  });
  const files = Object.fromEntries(readdirSync(out).map((name) => [name, readFileSync(join(out, name), "utf8")]));
  const rows = (name: string) => {
    const [header, ...lines] = files[`${name}.csv`].trim().split("\n");
    const columns = header.split(",");
    return lines.map((line) => Object.fromEntries(line.split(",").map((value, i) => [columns[i], value])));
  };
  return { files, rows, summary: JSON.parse(files["summary.json"]) };
}

// A pilot learner (not a @test.dev account) with a bit of everything, opted in to research or not.
async function pilotLearner(research: boolean) {
  const h = await createLearnerWithHistory();
  const person = { email: `${randomUUID()}@pilot.example`, displayName: `Learner ${randomUUID().slice(0, 8)}` };
  await db.update(users).set({ ...person, dateOfBirth: "2001-04-09" }).where(eq(users.id, h.userId));
  const kinds = ["data_processing", "terms", ...(research ? ["research_study" as const] : [])] as const;
  await db.insert(consents).values(kinds.map((kind) => ({ userId: h.userId, kind, policyVersion: "0.1" })));
  return { ...h, ...person };
}

describe("pilot data export (pnpm pilot:export)", () => {
  it("exports an opted-in learner's activity under an alias, and nothing that identifies anyone", async () => {
    const since = new Date(Date.now() - 1000);
    const opted = await pilotLearner(true);
    const other = await pilotLearner(false);
    const { files, rows, summary } = exportPilot(since, new Date(Date.now() + 60_000));

    const [submission] = rows("submissions");
    expect(rows("submissions")).toHaveLength(1); // the other learner's run isn't there
    expect(submission).toMatchObject({ verdict: "WA", rung: "3", context: "practice", hints_before: "0" }); // its hint came after
    expect(submission.learner).toMatch(/^L\d{3}$/);
    expect(rows("learners").map((l) => l.learner)).toContain(submission.learner);
    for (const name of ["placement", "evidence", "calibration", "hints", "sessions"]) {
      expect(rows(name).map((r) => r.learner)).toEqual([submission.learner]);
    }
    expect(rows("placement")[0]).toMatchObject({ answers: "2", correct: "1" });
    expect(rows("hints")[0]).toMatchObject({ level: "1", source: "generic" });

    const everything = Object.values(files).join("\n");
    for (const secret of [opted.userId, other.userId, opted.email, opted.displayName, "2001-04-09", LEARNER_CODE, "return 42", "Look at", "Watch the last digit", "Pass my placement interview", "10.0.0.1"]) {
      expect(everything).not.toContain(secret);
    }
    expect(summary.researchOptIn).toBeGreaterThanOrEqual(1);
    expect(summary.allLearners.signed_up).toBeGreaterThanOrEqual(2); // the other learner counts, as a total
    expect(summary.rows.submissions).toBe(1);
  }, 30_000); // it starts a second Node process, slow while the other test files run beside it
});
