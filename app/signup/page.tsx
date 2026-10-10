"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { user, isLoading, signup, loginWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirectTarget);
    }
  }, [user, isLoading, router, redirectTarget]);

  function validateForm(): boolean {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return false;
    }

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Please enter a valid work email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    return isValid;
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.push(redirectTarget);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An error occurred while creating your account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      router.push(redirectTarget);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Google sign-up failed."
      );
    }
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
        label="Sign up with Google"
        onSignIn={handleGoogleSignup}
        disabled={isSubmitting}
      />

      <div className="auth-divider">
        <span />
        <span className="auth-divider-text">or sign up with email</span>
        <span />
      </div>

      <form onSubmit={handleSignup} className="auth-form" noValidate>
        <div className="auth-field">
          <div className="auth-field-header">
            <label htmlFor="signup-name">Full Name</label>
          </div>
          <input
            id="signup-name"
            type="text"
            name="name"
            autoFocus
            required
            autoComplete="name"
            placeholder="e.g. Maya Patel"
            className="auth-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={isSubmitting}
          />
        </div>

        <div className={`auth-field ${emailError ? "has-error" : ""}`}>
          <div className="auth-field-header">
            <label htmlFor="signup-email">Work Email</label>
          </div>
          <input
            id="signup-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            className="auth-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
              if (errorMessage) setErrorMessage(null);
            }}
            onBlur={() => {
              if (email && !EMAIL_REGEX.test(email.trim())) {
                setEmailError("Please enter a valid work email address.");
              }
            }}
            disabled={isSubmitting}
          />
          {emailError && (
            <span className="auth-field-error" role="alert">
              {emailError}
            </span>
          )}
        </div>

        <PasswordInput
          id="signup-password"
          name="password"
          label="Create Password"
          placeholder="At least 8 characters"
          required
          error={passwordError || undefined}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
            if (errorMessage) setErrorMessage(null);
          }}
          disabled={isSubmitting}
        />

        <PasswordInput
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter password"
          required
          error={confirmPasswordError || undefined}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError(null);
            if (errorMessage) setErrorMessage(null);
          }}
          disabled={isSubmitting}
        />

        {/* Real-time Password Strength Meter */}
        <PasswordStrength
          password={password}
          confirmPassword={confirmPassword}
          showConfirmCheck={Boolean(confirmPassword)}
        />

        <div className="auth-terms-note">
          By creating an account, you agree to AgentOS&apos;s Terms of Service and Privacy Policy.
        </div>

        <button
          type="submit"
          className="button button-primary auth-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="auth-spinner" />
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Create AgentOS account</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="auth-switch-prompt">
        <span>Already have an account?</span>
        <Link href={`/login${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}>
          Log in
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your AgentOS workspace"
      subtitle="Start deploying, orchestrating and managing AI agents in minutes."
    >
      <Suspense
        fallback={
          <div className="auth-loading-state">
            <Loader2 size={24} className="auth-spinner" />
            <span>Loading…</span>
          </div>
        }
      >
        <SignupFormContent />
      </Suspense>
    </AuthLayout>
  );
}
