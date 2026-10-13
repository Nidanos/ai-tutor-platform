CREATE TYPE "public"."llm_purpose" AS ENUM('exercise_generation', 'hint', 'explanation', 'embedding');--> statement-breakpoint
CREATE TYPE "public"."llm_status" AS ENUM('ok', 'error', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."exercise_purpose" AS ENUM('practice', 'holdout', 'diagnostic');--> statement-breakpoint
CREATE TYPE "public"."exercise_source" AS ENUM('generated', 'template');--> statement-breakpoint
CREATE TYPE "public"."exercise_status" AS ENUM('draft', 'verifying', 'verified', 'rejected', 'retired');--> statement-breakpoint
CREATE TYPE "public"."gen_stage" AS ENUM('llm', 'schema', 'compile', 'reference', 'brute_force', 'tests_too_weak', 'sandbox');--> statement-breakpoint
CREATE TYPE "public"."gen_status" AS ENUM('queued', 'generating', 'verifying', 'succeeded', 'fell_back');--> statement-breakpoint
CREATE TYPE "public"."gen_trigger" AS ENUM('pregen', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."hint_source" AS ENUM('pregenerated', 'reference');--> statement-breakpoint
CREATE TYPE "public"."test_size" AS ENUM('small', 'large');--> statement-breakpoint
CREATE TYPE "public"."test_visibility" AS ENUM('sample', 'hidden');--> statement-breakpoint
CREATE TABLE "llm_calls" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "llm_calls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"purpose" "llm_purpose" NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"latency_ms" integer NOT NULL,
	"status" "llm_status" NOT NULL,
	"est_cost_inr" numeric(10, 4) NOT NULL,
	"ref_type" text,
	"ref_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_hints" (
	"id" uuid PRIMARY KEY NOT NULL,
	"exercise_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"body_md" text NOT NULL,
	"source" "hint_source" NOT NULL,
	"filter_passed" boolean NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_hints_level_unique" UNIQUE("exercise_id","level"),
	CONSTRAINT "exercise_hints_level_range" CHECK ("exercise_hints"."level" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "exercise_secrets" (
	"exercise_id" uuid PRIMARY KEY NOT NULL,
	"harness_code" text,
	"reference_solution" text NOT NULL,
	"brute_force_solution" text,
	"test_generator_code" text,
	"generator_seed" integer
);
--> statement-breakpoint
CREATE TABLE "exercise_tests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"exercise_id" uuid NOT NULL,
	"seq" smallint NOT NULL,
	"name" text NOT NULL,
	"size" "test_size" NOT NULL,
	"visibility" "test_visibility" NOT NULL,
	"input" text,
	"expected_output" text,
	CONSTRAINT "exercise_tests_seq_unique" UNIQUE("exercise_id","seq")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"rung" smallint NOT NULL,
	"variant_seed" integer NOT NULL,
	"content_version" text NOT NULL,
	"purpose" "exercise_purpose" DEFAULT 'practice' NOT NULL,
	"source" "exercise_source" NOT NULL,
	"status" "exercise_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"prompt_md" text NOT NULL,
	"starter_code" text NOT NULL,
	"function_signature" text,
	"time_limit_ms" integer NOT NULL,
	"memory_limit_mb" integer NOT NULL,
	"created_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_content_key_unique" UNIQUE("skill_id","language_code","rung","variant_seed","content_version"),
	CONSTRAINT "exercises_rung_range" CHECK ("exercises"."rung" between 1 and 5),
	CONSTRAINT "exercises_time_limit_range" CHECK ("exercises"."time_limit_ms" between 50 and 10000),
	CONSTRAINT "exercises_memory_limit_range" CHECK ("exercises"."memory_limit_mb" between 16 and 1024)
);
--> statement-breakpoint
CREATE TABLE "generation_failures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"generation_job_id" uuid NOT NULL,
	"try_no" smallint NOT NULL,
	"stage" "gen_stage" NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"rung" smallint NOT NULL,
	"variant_seed" integer NOT NULL,
	"trigger" "gen_trigger" NOT NULL,
	"requested_by" uuid,
	"status" "gen_status" DEFAULT 'queued' NOT NULL,
	"tries" smallint DEFAULT 0 NOT NULL,
	"exercise_id" uuid,
	"fallback_exercise_id" uuid,
	"queue_job_id" text,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "generation_jobs_rung_range" CHECK ("generation_jobs"."rung" between 1 and 5),
	CONSTRAINT "generation_jobs_tries_range" CHECK ("generation_jobs"."tries" between 0 and 3)
);
--> statement-breakpoint
ALTER TABLE "exercise_hints" ADD CONSTRAINT "exercise_hints_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_secrets" ADD CONSTRAINT "exercise_secrets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_tests" ADD CONSTRAINT "exercise_tests_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_failures" ADD CONSTRAINT "generation_failures_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_fallback_exercise_id_exercises_id_fk" FOREIGN KEY ("fallback_exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "llm_calls_created_at_index" ON "llm_calls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_calls_purpose_created_at_index" ON "llm_calls" USING btree ("purpose","created_at");--> statement-breakpoint
CREATE INDEX "exercises_servable_idx" ON "exercises" USING btree ("skill_id","language_code","rung","purpose") WHERE "exercises"."status" = 'verified';--> statement-breakpoint
CREATE UNIQUE INDEX "generation_jobs_one_active_per_key" ON "generation_jobs" USING btree ("skill_id","language_code","rung","variant_seed") WHERE "generation_jobs"."status" in ('queued', 'generating', 'verifying');--> statement-breakpoint
CREATE INDEX "generation_jobs_status_created_at_index" ON "generation_jobs" USING btree ("status","created_at");