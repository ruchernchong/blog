ALTER TABLE "oauth_access_token" ALTER COLUMN "token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "created_at" DROP NOT NULL;