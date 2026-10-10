
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import type {
  AuthUser,
  AuthSession,
  LoginInput,
  SignupInput,
  GoogleAuthInput,
} from "./types";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  signup: (input: SignupInput) => Promise<AuthSession>;
  loginWithGoogle: (input?: GoogleAuthInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "agentos_auth_session";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore and verify the saved session
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let tokenToVerify: string | null = null;

        if (stored) {
          try {
            const parsedSession: AuthSession = JSON.parse(stored);

            if (
              parsedSession &&
              parsedSession.expiresAt > Date.now()
            ) {
              if (!cancelled) {
                setSession(parsedSession);
                setUser(parsedSession.user);
              }

              tokenToVerify = parsedSession.token;
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        const headers: Record<string, string> = {};

        if (tokenToVerify) {
          headers.Authorization = `Bearer ${tokenToVerify}`;
        }

        if (!tokenToVerify) { if (!cancelled) setIsLoading(false); return; }; const res = await fetch("/api/auth/me", {
          credentials: "same-origin",
          headers,
        });

        if (res.ok) {
          const verifiedSession: AuthSession = await res.json();

          if (!cancelled) {
            setSession(verifiedSession);
            setUser(verifiedSession.user);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(verifiedSession)
            );
          }
        } else if (res.status === 401) {
          if (!cancelled) {
            setUser(null);
            setSession(null);
          }

          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        // Keep a previously restored session if the request fails.
        console.error("Session verification failed:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Email/password login
  const login = useCallback(
    async (input: LoginInput): Promise<AuthSession> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Login failed. Please check your credentials."
        );
      }

      const newSession: AuthSession = data;

      setUser(newSession.user);
      setSession(newSession);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newSession)
      );

      return newSession;
    },
    []
  );

  // Create an account
  const signup = useCallback(
    async (input: SignupInput): Promise<AuthSession> => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      const newSession: AuthSession = data;

      setUser(newSession.user);
      setSession(newSession);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newSession)
      );

      return newSession;
    },
    []
  );

  // Google sign-in using Firebase Authentication
  const loginWithGoogle = useCallback(
    async (): Promise<AuthSession> => {
      const result = await signInWithPopup(
        firebaseAuth,
        googleProvider
      );

      const credential = await result.user.getIdToken();

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed.");
      }

      const newSession: AuthSession = data;

      setUser(newSession.user);
      setSession(newSession);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newSession)
      );

      return newSession;
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};

      if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
      }

      await fetch("/api/auth/logout", {
        method: "POST",
        headers,
        credentials: "same-origin",
      });
    } catch {
      // Clear the local session even if the request fails.
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  // Password reset
  const requestPasswordReset = useCallback(
    async (
      email: string
    ): Promise<{ success: boolean; message: string }> => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to send reset instructions."
        );
      }

      return {
        success: true,
        message: data.message || "Password reset instructions sent.",
      };
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
