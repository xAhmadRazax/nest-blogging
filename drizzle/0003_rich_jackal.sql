CREATE TABLE "publications_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publication_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"version" integer NOT NULL,
	"changed_by" uuid,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "publications_history" ADD CONSTRAINT "publications_history_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications_history" ADD CONSTRAINT "publications_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;