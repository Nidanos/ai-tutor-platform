CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'paused', 'completed', 'dropped');--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"goal_skill_id" uuid,
	"goal_text" text,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_track_unique" UNIQUE("user_id","course_id","language_code"),
	CONSTRAINT "enrollments_goal_text_length" CHECK (char_length("enrollments"."goal_text") <= 300)
);
--> statement-breakpoint
CREATE TABLE "fade_schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" uuid,
	"course_id" uuid,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fade_stages" (
	"schedule_id" uuid NOT NULL,
	"stage_no" smallint NOT NULL,
	"min_rung" smallint NOT NULL,
	"max_hint_level" smallint NOT NULL,
	"advance_rung" smallint NOT NULL,
	"advance_max_hints" smallint DEFAULT 1 NOT NULL,
	"description" text,
	CONSTRAINT "fade_stages_schedule_id_stage_no_pk" PRIMARY KEY("schedule_id","stage_no"),
	CONSTRAINT "fade_stages_min_rung_range" CHECK ("fade_stages"."min_rung" between 1 and 5),
	CONSTRAINT "fade_stages_max_hint_level_range" CHECK ("fade_stages"."max_hint_level" between 0 and 5),
	CONSTRAINT "fade_stages_advance_rung_range" CHECK ("fade_stages"."advance_rung" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "skill_scaffolding" (
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"schedule_id" uuid NOT NULL,
	"current_stage" smallint NOT NULL,
	"stage_entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_scaffolding_user_id_skill_id_language_code_pk" PRIMARY KEY("user_id","skill_id","language_code")
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_goal_skill_id_skills_id_fk" FOREIGN KEY ("goal_skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_language_fk" FOREIGN KEY ("course_id","language_code") REFERENCES "public"."course_languages"("course_id","language_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_schedules" ADD CONSTRAINT "fade_schedules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_schedules" ADD CONSTRAINT "fade_schedules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_schedules" ADD CONSTRAINT "fade_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fade_stages" ADD CONSTRAINT "fade_stages_schedule_id_fade_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."fade_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scaffolding" ADD CONSTRAINT "skill_scaffolding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scaffolding" ADD CONSTRAINT "skill_scaffolding_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scaffolding" ADD CONSTRAINT "skill_scaffolding_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scaffolding" ADD CONSTRAINT "skill_scaffolding_stage_fk" FOREIGN KEY ("schedule_id","current_stage") REFERENCES "public"."fade_stages"("schedule_id","stage_no") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fade_schedules_one_default_per_course" ON "fade_schedules" USING btree ("course_id") WHERE "fade_schedules"."is_default";