ALTER TYPE "public"."user_status" ADD VALUE 'deleted';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletion_requested_at" timestamp with time zone;