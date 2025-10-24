ALTER TABLE "posts" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "posts_deleted_at_index" ON "posts" USING btree ("deleted_at");