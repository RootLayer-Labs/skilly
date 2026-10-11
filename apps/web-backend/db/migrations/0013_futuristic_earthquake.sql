ALTER TABLE "mac_entitlements" ADD COLUMN "checkout_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "checkout_started_at" timestamp with time zone;