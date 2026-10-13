CREATE TYPE "public"."review_reason" AS ENUM('decay', 'manual', 'failed_prereq');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "evidence_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "evidence_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"dimension" "dimension" NOT NULL,
	"submission_id" uuid,
	"diagnostic_id" uuid,
	"verdict" "verdict",
	"rung" smallint,
	"hints_used" smallint DEFAULT 0 NOT NULL,
	"time_taken_ms" integer,
	"weight" double precision NOT NULL,
	"score_before" double precision NOT NULL,
	"score_after" double precision NOT NULL,
	"formula_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_events_submission_unique" UNIQUE("submission_id","dimension"),
	CONSTRAINT "evidence_events_diagnostic_unique" UNIQUE("diagnostic_id","skill_id","dimension"),
	CONSTRAINT "evidence_events_one_source" CHECK (num_nonnulls("evidence_events"."submission_id", "evidence_events"."diagnostic_id") = 1),
	CONSTRAINT "evidence_events_before_range" CHECK ("evidence_events"."score_before" between 0 and 1),
	CONSTRAINT "evidence_events_after_range" CHECK ("evidence_events"."score_after" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "mastery_records" (
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"reading_score" double precision DEFAULT 0 NOT NULL,
	"writing_score" double precision DEFAULT 0 NOT NULL,
	"reading_evidence_at" timestamp with time zone,
	"writing_evidence_at" timestamp with time zone,
	"cleared_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"decay_lambda" double precision NOT NULL,
	"limit_streak" smallint DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mastery_records_user_id_skill_id_language_code_pk" PRIMARY KEY("user_id","skill_id","language_code"),
	CONSTRAINT "mastery_records_reading_range" CHECK ("mastery_records"."reading_score" between 0 and 1),
	CONSTRAINT "mastery_records_writing_range" CHECK ("mastery_records"."writing_score" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"status" "review_status" DEFAULT 'scheduled' NOT NULL,
	"reason" "review_reason" NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"interval_days" double precision NOT NULL,
	"ease" double precision DEFAULT 2.5 NOT NULL,
	"last_outcome" "verdict",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "evidence_events" ADD CONSTRAINT "evidence_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_events" ADD CONSTRAINT "evidence_events_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_events" ADD CONSTRAINT "evidence_events_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_events" ADD CONSTRAINT "evidence_events_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_events" ADD CONSTRAINT "evidence_events_diagnostic_id_diagnostic_attempts_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostic_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD CONSTRAINT "mastery_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD CONSTRAINT "mastery_records_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD CONSTRAINT "mastery_records_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_events_user_id_skill_id_created_at_index" ON "evidence_events" USING btree ("user_id","skill_id","created_at");--> statement-breakpoint
CREATE INDEX "mastery_records_user_id_language_code_index" ON "mastery_records" USING btree ("user_id","language_code");--> statement-breakpoint
CREATE UNIQUE INDEX "review_items_one_open" ON "review_items" USING btree ("user_id","skill_id","language_code") WHERE "review_items"."status" = 'scheduled';--> statement-breakpoint
CREATE INDEX "review_items_due_idx" ON "review_items" USING btree ("due_at") WHERE "review_items"."status" = 'scheduled';