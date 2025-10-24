ALTER TABLE "posts"
    ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "posts"
    ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_author_id_index" ON "posts" USING btree ("author_id");
