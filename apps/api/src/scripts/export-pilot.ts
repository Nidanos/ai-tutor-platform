import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type SQL, sql } from "drizzle-orm";
import { db } from "../infrastructure/database/index.js";

// De-identified pilot data for the final report, as CSV files and a summary (privacy policy §3).
// Rows only for adults with a live research opt-in: no name, email, birth date, IP, code, hint text or
// note leaves the database, and learners become L001, L002… in order of sign-up, with no key kept.
// Read-only. On the server:
//   docker compose exec api pnpm pilot:export --since=2026-11-08 --until=2026-11-11 --out=/tmp/pilot
//   docker compose cp api:/tmp/pilot ./pilot
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const date = (value: string | undefined, fallback: Date) => {
  const d = value ? new Date(value) : fallback;
  if (Number.isNaN(d.getTime())) throw new Error(`Not a date: ${value}`);
  return d;
};
const since = date(arg("since"), new Date(0));
const until = date(arg("until"), new Date());
const out = arg("out") ?? `pilot-export-${until.toISOString().slice(0, 10)}`;

// Real learners: no staff, no deleted accounts, no demo or smoke-test accounts (@test.dev).
const realLearner = sql`u.role = 'LEARNER' and u.status = 'active' and u.email not like '%@test.dev'`;
const researchOptIn = sql`exists (select 1 from consents c where c.user_id = u.id and c.kind = 'research_study' and c.revoked_at is null)`;
const cohort = sql`select u.id from users u where ${realLearner} and ${researchOptIn}`;
const inWindow = (column: SQL) => sql`${column} >= ${since} and ${column} < ${until}`;

const QUERIES: Record<string, SQL> = {
  placement: sql`
    select e.user_id, c.slug as course, d.attempt_no, d.status, d.started_at, d.completed_at,
      count(r.id)::int as answers, (count(*) filter (where r.is_correct))::int as correct
    from diagnostic_attempts d join enrollments e on e.id = d.enrollment_id join courses c on c.id = e.course_id
    left join diagnostic_responses r on r.diagnostic_id = d.id
    where e.user_id in (${cohort}) and ${inWindow(sql`d.started_at`)}
    group by d.id, e.user_id, c.slug order by d.started_at`,
  submissions: sql`
    select s.user_id, c.slug as course, k.slug as skill, x.rung, x.id as exercise, a.context, s.created_at as submitted_at,
      s.verdict, s.counts_as_attempt, s.tests_passed, s.tests_total,
      (select count(*)::int from hint_events h where h.attempt_id = s.attempt_id and h.kind = 'delivered' and h.created_at <= s.created_at) as hints_before
    from submissions s join exercise_attempts a on a.id = s.attempt_id join exercises x on x.id = s.exercise_id
    join skills k on k.id = x.skill_id join courses c on c.id = k.course_id
    where s.user_id in (${cohort}) and ${inWindow(sql`s.created_at`)} order by s.created_at`,
  evidence: sql`
    select ev.user_id, k.slug as skill, ev.dimension, case when ev.diagnostic_id is null then 'practice' else 'placement' end as source,
      ev.verdict, ev.rung, ev.hints_used, ev.time_taken_ms, ev.weight, ev.score_before, ev.score_after, ev.formula_version, ev.created_at
    from evidence_events ev join skills k on k.id = ev.skill_id
    where ev.user_id in (${cohort}) and ${inWindow(sql`ev.created_at`)} order by ev.created_at`,
  calibration: sql`
    select cr.user_id, c.slug as course, k.slug as skill, cr.rung, cr.predicted_reading, cr.predicted_writing,
      cr.observed_verdict, ev.hints_used, cr.created_at
    from calibration_records cr join skills k on k.id = cr.skill_id join courses c on c.id = k.course_id
    left join evidence_events ev on ev.submission_id = cr.submission_id
    where cr.user_id in (${cohort}) and ${inWindow(sql`cr.created_at`)} order by cr.created_at`,
  hints: sql`
    select a.user_id, k.slug as skill, x.rung, h.level, h.kind,
      case when h.llm_call_id is not null then 'live' when h.hint_id is not null then 'frozen' else 'generic' end as source, h.created_at
    from hint_events h join exercise_attempts a on a.id = h.attempt_id join exercises x on x.id = a.exercise_id
    join skills k on k.id = x.skill_id
    where a.user_id in (${cohort}) and ${inWindow(sql`h.created_at`)} order by h.created_at`,
  sessions: sql`
    select ls.user_id, c.slug as course, ls.status, ls.started_at, ls.ended_at, ls.end_reason, ls.active_ms,
      (select count(*)::int from session_steps st where st.session_id = ls.id) as steps,
      (select count(*)::int from session_steps st where st.session_id = ls.id and st.status = 'completed') as steps_completed
    from learning_sessions ls join enrollments e on e.id = ls.enrollment_id join courses c on c.id = e.course_id
    where ls.user_id in (${cohort}) and ${inWindow(sql`ls.started_at`)} order by ls.started_at`,
};

const cell = (v: unknown) => {
  const text = v instanceof Date ? v.toISOString() : v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (columns: string[], rows: Record<string, unknown>[]) =>
  [columns, ...rows.map((r) => columns.map((c) => r[c]))].map((line) => line.map(cell).join(",")).join("\n") + "\n";

await db.transaction(async (tx) => {
  await tx.execute(sql`set transaction read only`);
  const learners = (await tx.execute<{ id: string; joined_on: string }>(sql`select u.id, u.created_at::date::text as joined_on from users u where u.id in (${cohort}) order by u.created_at`)).rows;
  const alias = new Map(learners.map((l, i) => [l.id, `L${String(i + 1).padStart(3, "0")}`]));
  const pseudonymous = (rows: Record<string, unknown>[]) => rows.map(({ user_id, ...r }) => ({ learner: alias.get(user_id as string), ...r }));

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "learners.csv"), csv(["learner", "joined_on"], pseudonymous(learners.map(({ id, joined_on }) => ({ user_id: id, joined_on })))));
  const rowCounts: Record<string, number> = { learners: learners.length };
  for (const [name, query] of Object.entries(QUERIES)) {
    const result = await tx.execute(query);
    const columns = ["learner", ...result.fields.map((f) => f.name).filter((n) => n !== "user_id")];
    writeFileSync(join(out, `${name}.csv`), csv(columns, pseudonymous(result.rows)));
    rowCounts[name] = result.rows.length;
  }

  // Everyone, as totals only (privacy policy §4): how many real learners there were and how many opted in.
  const [totals] = (
    await tx.execute<{ signed_up: number; ran_code: number }>(sql`
      select count(*)::int as signed_up,
        (count(*) filter (where exists (select 1 from submissions s where s.user_id = u.id and ${inWindow(sql`s.created_at`)})))::int as ran_code
      from users u where ${realLearner} and u.created_at < ${until}`)
  ).rows;
  const summary = { window: { since, until }, exportedAt: new Date(), allLearners: totals, researchOptIn: learners.length, rows: rowCounts };
  writeFileSync(join(out, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(`Wrote ${out}: ${learners.length} of ${totals.signed_up} learners opted in to research.`, rowCounts);
});
await db.$client.end();
