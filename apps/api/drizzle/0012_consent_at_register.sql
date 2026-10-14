ALTER TYPE "public"."user_status" ADD VALUE 'pending_parent';--> statement-breakpoint
ALTER TYPE "public"."consent_kind" ADD VALUE 'terms';--> statement-breakpoint
ALTER TYPE "public"."consent_kind" ADD VALUE 'parental';--> statement-breakpoint
ALTER TYPE "public"."consent_kind" ADD VALUE 'ai_training';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;