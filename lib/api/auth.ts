import { apiRequest } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type AuthWorkspace = {
  id: string;
  name: string;
  slug: string;
};

export type AuthMeResponse = {
  user: AuthUser;
  workspace: AuthWorkspace;
  role: "owner" | "admin" | "member";
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function signup(input: SignupInput) {
  return apiRequest<{ user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return apiRequest<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}

export function getMe() {
  return apiRequest<AuthMeResponse>("/auth/me");
}

export function getGoogleSignInUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  return `${apiBaseUrl.replace(/\/$/, "")}/auth/google`;
}
