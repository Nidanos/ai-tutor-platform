CREATE TYPE "public"."diagnostic_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."dimension" AS ENUM('reading', 'writing');--> statement-breakpoint
CREATE TABLE "diagnostic_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"attempt_no" smallint NOT NULL,
	"status" "diagnostic_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "diagnostic_attempts_number_unique" UNIQUE("enrollment_id","attempt_no")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"dimension" "dimension" NOT NULL,
	"difficulty" smallint NOT NULL,
	"prompt_md" text NOT NULL,
	"payload" jsonb NOT NULL,
	"answer_key" jsonb,
	"exercise_id" uuid,
	"content_version" text NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	CONSTRAINT "diagnostic_items_difficulty_range" CHECK ("diagnostic_items"."difficulty" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "diagnostic_responses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"diagnostic_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"seq" smallint NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean,
	"submission_id" uuid,
	"time_taken_ms" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_responses_item_unique" UNIQUE("diagnostic_id","item_id"),
	CONSTRAINT "diagnostic_responses_seq_unique" UNIQUE("diagnostic_id","seq")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_results" (
	"diagnostic_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"est_reading" double precision NOT NULL,
	"est_writing" double precision NOT NULL,
	"confidence" double precision NOT NULL,
	CONSTRAINT "diagnostic_results_diagnostic_id_skill_id_pk" PRIMARY KEY("diagnostic_id","skill_id"),
	CONSTRAINT "diagnostic_results_reading_range" CHECK ("diagnostic_results"."est_reading" between 0 and 1),
	CONSTRAINT "diagnostic_results_writing_range" CHECK ("diagnostic_results"."est_writing" between 0 and 1),
	CONSTRAINT "diagnostic_results_confidence_range" CHECK ("diagnostic_results"."confidence" between 0 and 1)
);
--> statement-breakpoint
ALTER TABLE "diagnostic_attempts" ADD CONSTRAINT "diagnostic_attempts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_items" ADD CONSTRAINT "diagnostic_items_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_items" ADD CONSTRAINT "diagnostic_items_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_items" ADD CONSTRAINT "diagnostic_items_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_diagnostic_id_diagnostic_attempts_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostic_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_item_id_diagnostic_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."diagnostic_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_diagnostic_id_diagnostic_attempts_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostic_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "diagnostic_attempts_one_in_progress" ON "diagnostic_attempts" USING btree ("enrollment_id") WHERE "diagnostic_attempts"."status" = 'in_progress';--> statement-breakpoint
CREATE INDEX "diagnostic_items_pick_idx" ON "diagnostic_items" USING btree ("skill_id","language_code","dimension","difficulty") WHERE "diagnostic_items"."status" = 'published';