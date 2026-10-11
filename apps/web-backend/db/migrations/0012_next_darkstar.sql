ALTER TABLE "projects" ADD COLUMN "widget_last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "widget_last_seen_origin" text;