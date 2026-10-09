ALTER TABLE "agents" ADD COLUMN "external_id" varchar(120);
ALTER TABLE "agents" ADD CONSTRAINT "agents_external_id_unique" UNIQUE("external_id");
ALTER TABLE "agent_executions" ADD COLUMN "external_execution_id" varchar(120);
