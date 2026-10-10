"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your account email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setSuccessMessage(res.message);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to request password reset. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email associated with your AgentOS account and we'll send you recovery instructions."
    >
      <div className="auth-form-container">
        {errorMessage && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="auth-alert-success" role="status">
            <CheckCircle2 size={20} />
            <div>
              <strong>Check your inbox</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <div className="auth-field-header">
                <label htmlFor="reset-email">Work Email</label>
              </div>
              <input
                id="reset-email"
                type="email"
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

            <button
              type="submit"
              className="button button-primary auth-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Sending instructions…</span>
                </>
              ) : (
                <>
                  <Mail size={16} />
                  <span>Send reset instructions</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-back-row">
          <Link href="/login" className="back-link">
            <ArrowLeft size={14} />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
