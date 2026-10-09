"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { getMe, logout as logoutRequest, type AuthMeResponse } from "@/lib/api/auth";

type AuthContextValue = {
  user: AuthMeResponse["user"] | null;
  workspace: AuthMeResponse["workspace"] | null;
  role: AuthMeResponse["role"] | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => router.replace("/login");
    window.addEventListener("agentos:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("agentos:unauthorized", handleUnauthorized);
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      setAuth(await getMe());
    } catch {
      setAuth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getMe()
      .then((result) => {
        if (active) setAuth(result);
      })
      .catch(() => {
        if (active) setAuth(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAuth(null);
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(() => ({
    user: auth?.user ?? null,
    workspace: auth?.workspace ?? null,
    role: auth?.role ?? null,
    loading,
    logout,
    refresh,
  }), [auth, loading, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
