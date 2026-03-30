CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"username" varchar(254) NOT NULL,
	"password" varchar(20) NOT NULL,
	"text" text,
	"is_verified" boolean DEFAULT false,
	"password_reset_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
