CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"metadata" jsonb NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"cover_image" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP INDEX "created_at_idx";--> statement-breakpoint
DROP INDEX "path_idx";--> statement-breakpoint
DROP INDEX "country_idx";--> statement-breakpoint
DROP INDEX "browser_idx";--> statement-breakpoint
CREATE INDEX "posts_slug_index" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_index" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "posts_featured_index" ON "posts" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "posts_published_at_index" ON "posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "sessions_created_at_index" ON "sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_path_index" ON "sessions" USING btree ("path");--> statement-breakpoint
CREATE INDEX "sessions_country_index" ON "sessions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "sessions_browser_index" ON "sessions" USING btree ("browser");