ALTER TYPE "public"."action" ADD VALUE 'rollback';--> statement-breakpoint
ALTER TABLE "publications" ALTER COLUMN "version" SET NOT NULL;