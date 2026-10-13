CREATE TYPE "public"."attempt_context" AS ENUM('practice', 'review', 'diagnostic', 'holdout');--> statement-breakpoint
CREATE TYPE "public"."attempt_status" AS ENUM('active', 'solved', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."hint_kind" AS ENUM('offered', 'declined', 'requested', 'delivered', 'blocked', 'denied_ceiling', 'bottomed_out');--> statement-breakpoint
CREATE TYPE "public"."run_purpose" AS ENUM('submission', 'verification', 'timing');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'completed', 'sandbox_error');--> statement-breakpoint
CREATE TYPE "public"."solution_kind" AS ENUM('learner', 'reference', 'brute_force', 'empty_main');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('queued', 'running', 'completed');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('AC', 'WA', 'CE', 'RE', 'TLE', 'MLE', 'SE');--> statement-breakpoint
CREATE TABLE "exercise_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"session_step_id" uuid,
	"context" "attempt_context" DEFAULT 'practice' NOT NULL,
	"status" "attempt_status" DEFAULT 'active' NOT NULL,
	"hint_level" smallint DEFAULT 0 NOT NULL,
	"hint_ceiling" smallint NOT NULL,
	"ce_count" smallint DEFAULT 0 NOT NULL,
	"submission_count" smallint DEFAULT 0 NOT NULL,
	"bottomed_out" boolean DEFAULT false NOT NULL,
	"active_ms" integer DEFAULT 0 NOT NULL,
	"solved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_attempts_hint_level_range" CHECK ("exercise_attempts"."hint_level" between 0 and 5),
	CONSTRAINT "exercise_attempts_hint_ceiling_range" CHECK ("exercise_attempts"."hint_ceiling" between 0 and 5),
	CONSTRAINT "exercise_attempts_hint_within_ceiling" CHECK ("exercise_attempts"."hint_level" <= "exercise_attempts"."hint_ceiling")
);
--> statement-breakpoint
CREATE TABLE "hint_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hint_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"attempt_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"kind" "hint_kind" NOT NULL,
	"hint_id" uuid,
	"body_md" text,
	"filter_result" jsonb,
	"llm_call_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hint_events_level_range" CHECK ("hint_events"."level" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "run_test_results" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "run_test_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"run_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"verdict" "verdict" NOT NULL,
	"time_ms" integer,
	"memory_kb" integer,
	"stdout_excerpt" text,
	"stderr_excerpt" text,
	CONSTRAINT "run_test_results_run_test_unique" UNIQUE("run_id","test_id")
);
--> statement-breakpoint
CREATE TABLE "sandbox_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"purpose" "run_purpose" NOT NULL,
	"submission_id" uuid,
	"exercise_id" uuid NOT NULL,
	"solution_kind" "solution_kind" NOT NULL,
	"language_code" text NOT NULL,
	"toolchain_version" text NOT NULL,
	"e2b_sandbox_id" text,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"verdict" "verdict",
	"compile_output" text,
	"exit_code" integer,
	"signal" text,
	"wall_ms" integer,
	"peak_memory_kb" integer,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "sandbox_runs_submission_iff_purpose" CHECK (("sandbox_runs"."purpose" = 'submission') = ("sandbox_runs"."submission_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"answer" text,
	"answer_sha256" text NOT NULL,
	"answer_purged_at" timestamp with time zone,
	"idempotency_key" text NOT NULL,
	"status" "submission_status" DEFAULT 'queued' NOT NULL,
	"verdict" "verdict",
	"tests_passed" smallint,
	"tests_total" smallint,
	"counts_as_attempt" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "submissions_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "submissions_answer_size" CHECK (octet_length("submissions"."answer") <= 65536)
);
--> statement-breakpoint
CREATE TABLE "fade_stage_changes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"from_stage" smallint,
	"to_stage" smallint NOT NULL,
	"submission_id" uuid,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_session_step_id_session_steps_id_fk" FOREIGN KEY ("session_step_id") REFERENCES "public"."session_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hint_events" ADD CONSTRAINT "hint_events_attempt_id_exercise_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exercise_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hint_events" ADD CONSTRAINT "hint_events_hint_id_exercise_hints_id_fk" FOREIGN KEY ("hint_id") REFERENCES "public"."exercise_hints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hint_events" ADD CONSTRAINT "hint_events_llm_call_id_llm_calls_id_fk" FOREIGN KEY ("llm_call_id") REFERENCES "public"."llm_calls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_test_results" ADD CONSTRAINT "run_test_results_run_id_sandbox_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."sandbox_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_test_results" ADD CONSTRAINT "run_test_results_test_id_exercise_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."exercise_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_runs" ADD CONSTRAINT "sandbox_runs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_runs" ADD CONSTRAINT "sandbox_runs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_runs" ADD CONSTRAINT "sandbox_runs_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_attempt_id_exercise_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exercise_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_stage_changes" ADD CONSTRAINT "fade_stage_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_stage_changes" ADD CONSTRAINT "fade_stage_changes_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_stage_changes" ADD CONSTRAINT "fade_stage_changes_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_stage_changes" ADD CONSTRAINT "fade_stage_changes_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_attempts_one_active" ON "exercise_attempts" USING btree ("user_id","exercise_id") WHERE "exercise_attempts"."status" = 'active';--> statement-breakpoint
CREATE INDEX "exercise_attempts_user_id_exercise_id_index" ON "exercise_attempts" USING btree ("user_id","exercise_id");--> statement-breakpoint
CREATE INDEX "exercise_attempts_session_step_id_index" ON "exercise_attempts" USING btree ("session_step_id");--> statement-breakpoint
CREATE INDEX "hint_events_attempt_id_created_at_index" ON "hint_events" USING btree ("attempt_id","created_at");--> statement-breakpoint
CREATE INDEX "sandbox_runs_submission_id_index" ON "sandbox_runs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "sandbox_runs_exercise_id_purpose_index" ON "sandbox_runs" USING btree ("exercise_id","purpose");--> statement-breakpoint
CREATE INDEX "submissions_attempt_id_created_at_index" ON "submissions" USING btree ("attempt_id","created_at");--> statement-breakpoint
CREATE INDEX "submissions_user_id_created_at_index" ON "submissions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "fade_stage_changes_user_id_skill_id_index" ON "fade_stage_changes" USING btree ("user_id","skill_id");