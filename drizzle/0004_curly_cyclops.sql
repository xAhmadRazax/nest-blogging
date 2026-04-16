ALTER TABLE "publications_history" RENAME TO "publication_versions";--> statement-breakpoint
ALTER TABLE "publication_versions" DROP CONSTRAINT "publications_history_publication_id_publications_id_fk";
--> statement-breakpoint
ALTER TABLE "publication_versions" DROP CONSTRAINT "publications_history_changed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "publication_versions" ADD CONSTRAINT "publication_versions_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_versions" ADD CONSTRAINT "publication_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;