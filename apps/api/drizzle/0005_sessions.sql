CREATE TYPE "public"."end_reason" AS ENUM('user', 'idle', 'completed');--> statement-breakpoint
CREATE TYPE "public"."rec_reason" AS ENUM('new_skill', 'review', 'remediation');--> statement-breakpoint
CREATE TYPE "public"."rec_status" AS ENUM('proposed', 'accepted', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."step_kind" AS ENUM('exercise', 'review', 'diagnostic');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'active', 'completed', 'skipped');--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"end_reason" "end_reason",
	"active_ms" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"rung" smallint NOT NULL,
	"reason" "rec_reason" NOT NULL,
	"total_score" double precision NOT NULL,
	"score_breakdown" jsonb NOT NULL,
	"candidates_snapshot" jsonb NOT NULL,
	"algorithm_version" text NOT NULL,
	"exercise_id" uuid,
	"status" "rec_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_rung_range" CHECK ("recommendations"."rung" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "session_steps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"seq" smallint NOT NULL,
	"kind" "step_kind" NOT NULL,
	"recommendation_id" uuid,
	"exercise_id" uuid,
	"status" "step_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "session_steps_seq_unique" UNIQUE("session_id","seq")
);
--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_session_id_learning_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_sessions_one_open_per_user" ON "learning_sessions" USING btree ("user_id") WHERE "learning_sessions"."status" <> 'ended';--> statement-breakpoint
CREATE INDEX "recommendations_enrollment_id_created_at_index" ON "recommendations" USING btree ("enrollment_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "session_steps_one_active" ON "session_steps" USING btree ("session_id") WHERE "session_steps"."status" = 'active';