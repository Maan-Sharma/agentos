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
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
}).superRefine((env, context) => {
  const googleVars = [
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  ];
  if (googleVars.some(Boolean) && googleVars.some((value) => !value)) {
    context.addIssue({
      code: "custom",
      message: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI together",
      path: ["GOOGLE_CLIENT_ID"],
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid backend environment configuration: ${issues}`);
}

export const config = parsedEnv.data;
if (config.NODE_ENV === "test" && !config.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must be set when NODE_ENV=test.");
}

export const databaseUrl = config.NODE_ENV === "test"
  ? config.TEST_DATABASE_URL!
  : config.DATABASE_URL;
