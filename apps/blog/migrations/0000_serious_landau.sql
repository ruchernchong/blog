CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"browser" text,
	"os" text,
	"device" text,
	"screen" text,
	"language" text,
	"city" text,
	"country" text,
	"region" text,
	"latitude" text,
	"longitude" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration" integer
);
