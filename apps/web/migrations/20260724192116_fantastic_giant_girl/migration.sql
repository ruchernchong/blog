CREATE TABLE "model" (
	"provider" text NOT NULL,
	"id" text NOT NULL,
	"display_name" text,
	"input_rate" numeric(14, 6),
	"output_rate" numeric(14, 6),
	"cache_read_rate" numeric(14, 6),
	"cache_write_rate" numeric(14, 6),
	"context_limit" integer,
	"release_date" date,
	"source" text NOT NULL,
	"is_override" boolean DEFAULT false NOT NULL,
	"alias_target" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_provider_id_pk" PRIMARY KEY("provider","id")
);
--> statement-breakpoint
CREATE INDEX "model_id_index" ON "model" USING btree ("id");