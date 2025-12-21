CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"cover_image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "series_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "series_order" integer;--> statement-breakpoint
CREATE INDEX "series_slug_index" ON "series" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "series_status_index" ON "series" USING btree ("status");--> statement-breakpoint
CREATE INDEX "series_deleted_at_index" ON "series" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_series_id_index" ON "posts" USING btree ("series_id");