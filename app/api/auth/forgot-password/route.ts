import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/auth/server-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check if user exists (without revealing exact existence for security best practices)
    const user = getUserByEmail(email);

    return NextResponse.json({
      success: true,
      message: user
        ? "Password reset instructions have been sent to your email address."
        : "If an account exists for that email, password reset instructions have been sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
