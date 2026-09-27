CREATE TABLE "token_effort_usage" (
	"date" date NOT NULL,
	"agent" text NOT NULL,
	"levels" jsonb NOT NULL,
	"classified_session_count" integer DEFAULT 0 NOT NULL,
	"unclassified_session_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_effort_usage_date_agent_pk" PRIMARY KEY("date","agent")
);
--> statement-breakpoint
CREATE INDEX "token_effort_usage_date_index" ON "token_effort_usage" USING btree ("date");--> statement-breakpoint
CREATE INDEX "token_effort_usage_agent_index" ON "token_effort_usage" USING btree ("agent");