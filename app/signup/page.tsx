import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return <Suspense fallback={<main className="auth-page"><div className="auth-loading">Loading sign up…</div></main>}>
    <AuthForm mode="signup" />
  </Suspense>;
}
