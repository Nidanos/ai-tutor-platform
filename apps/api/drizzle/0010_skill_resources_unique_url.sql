DROP INDEX "skill_resources_skill_id_index";--> statement-breakpoint
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_url_unique" UNIQUE("skill_id","url");