-- Videos and courses are no longer offered (commercial licensing); remove them before shrinking the enum.
DELETE FROM "skill_resources" WHERE "kind" IN ('video', 'course');--> statement-breakpoint
ALTER TABLE "skill_resources" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."resource_kind";--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('article', 'docs');--> statement-breakpoint
ALTER TABLE "skill_resources" ALTER COLUMN "kind" SET DATA TYPE "public"."resource_kind" USING "kind"::"public"."resource_kind";--> statement-breakpoint
ALTER TABLE "skills" DROP COLUMN "source_url";