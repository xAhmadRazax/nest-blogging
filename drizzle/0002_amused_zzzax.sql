ALTER TABLE "publications" ALTER COLUMN "deleted_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "version" integer DEFAULT 1;