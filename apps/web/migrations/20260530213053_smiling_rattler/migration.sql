CREATE TABLE "token_usage" (
	"date" date NOT NULL,
	"agent" text NOT NULL,
	"provider" text DEFAULT 'unknown' NOT NULL,
	"model" text NOT NULL,
	"input_tokens" bigint DEFAULT 0 NOT NULL,
	"output_tokens" bigint DEFAULT 0 NOT NULL,
	"cache_read_tokens" bigint DEFAULT 0 NOT NULL,
	"cache_write_tokens" bigint DEFAULT 0 NOT NULL,
	"reasoning_tokens" bigint DEFAULT 0 NOT NULL,
	"total_tokens" bigint DEFAULT 0 NOT NULL,
	"cost_usd" numeric(14, 6),
	"messages" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_usage_date_agent_provider_model_pk" PRIMARY KEY("date","agent","provider","model")
);
--> statement-breakpoint
CREATE INDEX "token_usage_date_index" ON "token_usage" USING btree ("date");--> statement-breakpoint
CREATE INDEX "token_usage_agent_index" ON "token_usage" USING btree ("agent");--> statement-breakpoint
CREATE INDEX "token_usage_provider_index" ON "token_usage" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "token_usage_model_index" ON "token_usage" USING btree ("model");