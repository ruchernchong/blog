CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text,
	"caption" text,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "media_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX "media_key_index" ON "media" USING btree ("key");--> statement-breakpoint
CREATE INDEX "media_filename_index" ON "media" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "media_mime_type_index" ON "media" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "media_created_at_index" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_deleted_at_index" ON "media" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "media_uploaded_by_id_index" ON "media" USING btree ("uploaded_by_id");