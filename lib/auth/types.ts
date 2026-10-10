export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  provider: "email" | "google";
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  credential?: string;
  isDevMode?: boolean;
  email?: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface ForgotPasswordInput {
  email: string;
}
