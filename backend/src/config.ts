import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol), {
      message: "DATABASE_URL must use the postgres:// or postgresql:// protocol",
    }),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid backend environment configuration: ${issues}`);
}

export const config = parsedEnv.data;
