"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Bot, Eye, EyeOff, LoaderCircle, Sparkles } from "lucide-react";

import { getGoogleSignInUrl, login, signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useOptionalAuth } from "@/lib/auth/auth-context";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useOptionalAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isSignup) {
        await signup({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }
      await auth?.refresh();
      const next = searchParams.get("next");
      const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : submitError instanceof Error
            ? submitError.message
            : "We couldn't complete your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand-panel" aria-label="About AgentOS">
          <Link href="/" className="auth-brand">
            <span className="brand-mark"><Bot size={20} strokeWidth={2.3} /></span>
            <span>AgentOS</span>
          </Link>
          <div className="auth-brand-copy">
            <span className="auth-eyebrow"><Sparkles size={14} /> YOUR AI WORKFORCE, IN FOCUS</span>
            <h1>A calmer way to manage your AI team.</h1>
            <p>Bring your agents, workflows and insights together in one thoughtful workspace.</p>
          </div>
          <div className="auth-brand-foot"><span className="auth-brand-dot" /> Your workspace is ready when you are.</div>
          <span className="auth-decoration auth-decoration-one" />
          <span className="auth-decoration auth-decoration-two" />
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand">
              <span className="brand-mark"><Bot size={19} strokeWidth={2.3} /></span>
              <strong>AgentOS</strong>
            </div>
            <div className="auth-heading">
              <span className="auth-eyebrow">{isSignup ? "GET STARTED" : "WELCOME BACK"}</span>
              <h2>{isSignup ? "Create your account" : "Sign in to AgentOS"}</h2>
              <p>{isSignup ? "Create a workspace for your AI team." : "Pick up where your team left off."}</p>
            </div>

            <a className="auth-google-button" href={getGoogleSignInUrl()}>
              <GoogleGlyph />
              <span>Continue with Google</span>
              <ArrowRight size={16} />
            </a>

            <div className="auth-divider"><span>or continue with email</span></div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="auth-field">
                  <span>Your name</span>
                  <input
                    autoComplete="name"
                    autoFocus
                    maxLength={120}
                    minLength={1}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Alex Morgan"
                    required
                    value={name}
                  />
                </label>
              )}
              <label className="auth-field">
                <span>Email address</span>
                <input
                  autoComplete="email"
                  autoFocus={!isSignup}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <span className="auth-password-wrap">
                  <input
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={isSignup ? 10 : 1}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isSignup ? "At least 10 characters" : "Enter your password"}
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" disabled={submitting} type="submit">
                {submitting ? <><LoaderCircle className="auth-spinner" size={17} />{isSignup ? "Creating account…" : "Signing in…"}</> : <>{isSignup ? "Create account" : "Sign in"}<ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="auth-switch">
              {isSignup ? "Already have an account?" : "New to AgentOS?"}{" "}
              <Link href={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
            <p className="auth-terms">By continuing, you agree to AgentOS&apos; terms and privacy policy.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return <svg aria-hidden="true" className="google-glyph" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.46-4.12 7.13-10.2 7.13-17.58Z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.94 23.94 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 5)" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.64-5.93c-2.12 1.42-4.83 2.26-8.26 2.26-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
  </svg>;
}
