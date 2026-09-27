ALTER TABLE "token_usage" DROP CONSTRAINT "token_usage_date_agent_provider_model_device_unique";--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "session" text;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_date_agent_provider_model_device_session_unique" UNIQUE NULLS NOT DISTINCT("date","agent","provider","model","device","session");