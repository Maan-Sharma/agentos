CREATE TYPE "public"."agent_provider" AS ENUM('anthropic', 'openai', 'google', 'other');--> statement-breakpoint
CREATE TYPE "public"."agent_role" AS ENUM('sales', 'health', 'support', 'coding', 'research', 'other');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(40) NOT NULL,
	"entity" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "provider" "agent_provider" DEFAULT 'openai' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "role" "agent_role" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "temperature" real DEFAULT 0.2 NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "max_tokens_per_run" integer DEFAULT 4000 NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "monthly_budget_usd" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "last_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;