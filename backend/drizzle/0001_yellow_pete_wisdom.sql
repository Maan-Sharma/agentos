CREATE TYPE "public"."agent_status" AS ENUM('active', 'inactive', 'paused');--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "status" SET DEFAULT 'inactive'::"public"."agent_status";--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "status" SET DATA TYPE "public"."agent_status" USING "status"::"public"."agent_status";
