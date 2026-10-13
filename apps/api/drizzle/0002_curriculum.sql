CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('article', 'video', 'docs', 'course');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."skill_type" AS ENUM('syntactic', 'conceptual');--> statement-breakpoint
CREATE TABLE "course_languages" (
	"course_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "course_languages_course_id_language_code_pk" PRIMARY KEY("course_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"code" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"toolchain" text NOT NULL,
	"toolchain_version" text NOT NULL,
	"compile_flags" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_prerequisites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"skill_id" uuid NOT NULL,
	"prerequisite_id" uuid NOT NULL,
	"language_code" text,
	"min_mastery" double precision DEFAULT 0.7 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_prerequisites_edge_unique" UNIQUE NULLS NOT DISTINCT("skill_id","prerequisite_id","language_code"),
	CONSTRAINT "skill_prerequisites_no_self_loop" CHECK ("skill_prerequisites"."skill_id" <> "skill_prerequisites"."prerequisite_id"),
	CONSTRAINT "skill_prerequisites_min_mastery_range" CHECK ("skill_prerequisites"."min_mastery" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "skill_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"skill_id" uuid NOT NULL,
	"language_code" text,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"kind" "resource_kind" NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"skill_type" "skill_type" NOT NULL,
	"decay_lambda" double precision NOT NULL,
	"difficulty" smallint NOT NULL,
	"source_url" text,
	"status" "skill_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_course_slug_unique" UNIQUE("course_id","slug"),
	CONSTRAINT "skills_decay_lambda_positive" CHECK ("skills"."decay_lambda" > 0),
	CONSTRAINT "skills_difficulty_range" CHECK ("skills"."difficulty" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "course_languages" ADD CONSTRAINT "course_languages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_languages" ADD CONSTRAINT "course_languages_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_id_skills_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_prerequisites_prerequisite_id_index" ON "skill_prerequisites" USING btree ("prerequisite_id");--> statement-breakpoint
CREATE INDEX "skill_resources_skill_id_index" ON "skill_resources" USING btree ("skill_id");