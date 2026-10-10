"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { user, isLoading, login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to target
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirectTarget);
    }
  }, [user, isLoading, router, redirectTarget]);

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push(redirectTarget);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      router.push(redirectTarget);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Google sign-in was unsuccessful."
      );
    }
  }

  function fillDemoCredentials() {
    setEmail("man@acmeco.com");
    setPassword("password123");
    setErrorMessage(null);
  }

  if (isLoading) {
    return (
      <div className="auth-loading-state">
        <Loader2 size={24} className="auth-spinner" />
        <span>Loading session…</span>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      {errorMessage && (
        <div className="auth-alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <GoogleButton
        label="Continue with Google"
        onSignIn={handleGoogleLogin}
        disabled={isSubmitting}
      />

      <div className="auth-divider">
        <span />
        <span className="auth-divider-text">or continue with email</span>
        <span />
      </div>

      <form onSubmit={handleEmailLogin} className="auth-form" noValidate>
        <div className="auth-field">
          <div className="auth-field-header">
            <label htmlFor="login-email">Work Email</label>
          </div>
          <input
            id="login-email"
            type="email"
            name="email"
            autoFocus
            required
            autoComplete="email"
            placeholder="name@company.com"
            className="auth-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={isSubmitting}
          />
        </div>

        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          disabled={isSubmitting}
        />

        <div className="auth-row-options">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember this device</span>
          </label>
          <Link href="/forgot-password" className="auth-inline-link">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="button button-primary auth-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="auth-spinner" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in to AgentOS</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Helper Pill */}
      <div className="demo-credentials-card">
        <div className="demo-credentials-header">
          <Sparkles size={14} />
          <span>Need a demo account?</span>
        </div>
        <div className="demo-credentials-body">
          <span>
            Email: <code>man@acmeco.com</code>
          </span>
          <button
            type="button"
            className="demo-autofill-btn"
            onClick={fillDemoCredentials}
          >
            Auto-fill demo credentials
          </button>
        </div>
      </div>

      <div className="auth-switch-prompt">
        <span>Don&apos;t have an account yet?</span>
        <Link href={`/signup${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}>
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back to AgentOS"
      subtitle="Sign in to access your company's AI workforce control plane."
    >
      <Suspense
        fallback={
          <div className="auth-loading-state">
            <Loader2 size={24} className="auth-spinner" />
            <span>Loading…</span>
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </AuthLayout>
  );
}
