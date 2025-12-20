CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"city" text,
	"country" text,
	"flag" text,
	"latitude" numeric(8, 6),
	"longitude" numeric(9, 6),
	"browser" text,
	"os" text,
	"device" text,
	"screen" text,
	"language" text,
	"duration" integer
);
