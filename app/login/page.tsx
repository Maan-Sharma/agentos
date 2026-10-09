import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page"><div className="auth-loading">Loading sign in…</div></main>}>
    <AuthForm mode="login" />
  </Suspense>;
}
