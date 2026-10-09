import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320).transform((email) => email.toLowerCase()),
  password: z.string().min(10).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(320).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const googleCallbackSchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().regex(/^[a-f0-9]{64}$/),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
