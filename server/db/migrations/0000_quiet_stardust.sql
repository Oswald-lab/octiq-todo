CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"auth_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_email" text,
	"auth_phone" text,
	"auth_password_hash" text,
	"auth_name" text,
	"auth_role" text DEFAULT 'user' NOT NULL,
	"auth_status" text DEFAULT 'active' NOT NULL,
	"auth_token_version" integer DEFAULT 0 NOT NULL,
	"auth_last_login_at" timestamp,
	"auth_created_at" timestamp DEFAULT now() NOT NULL,
	"auth_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_auth_email_unique" UNIQUE("auth_email"),
	CONSTRAINT "auth_users_auth_phone_unique" UNIQUE("auth_phone")
);
