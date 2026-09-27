ALTER TABLE "token_usage" DROP CONSTRAINT "token_usage_date_agent_provider_model_pk";--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "device" text;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_date_agent_provider_model_device_unique" UNIQUE NULLS NOT DISTINCT("date","agent","provider","model","device");