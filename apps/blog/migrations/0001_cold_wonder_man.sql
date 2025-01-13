CREATE INDEX "created_at_idx" ON "sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "path_idx" ON "sessions" USING btree ("path");--> statement-breakpoint
CREATE INDEX "country_idx" ON "sessions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "browser_idx" ON "sessions" USING btree ("browser");