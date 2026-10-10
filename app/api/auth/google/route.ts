import { NextResponse } from "next/server";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import {
  createUser,
  createSession,
  getUserByEmail,
} from "@/lib/auth/server-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credential = body?.credential;

    if (typeof credential !== "string" || !credential) {
      return NextResponse.json(
        { error: "Missing Firebase authentication token." },
        { status: 400 }
      );
    }

    // Verify the token's signature, issuer, audience and expiry.
    const decoded = await firebaseAdminAuth.verifyIdToken(credential);

    if (!decoded.email || decoded.email_verified !== true) {
      return NextResponse.json(
        { error: "Please use a Google account with a verified email." },
        { status: 401 }
      );
    }

    const email = decoded.email.trim().toLowerCase();
    const name = decoded.name || email.split("@")[0];

    let user = getUserByEmail(email);

    if (!user) {
      user = createUser({
        name,
        email,
        provider: "google",
      });
    }

    const session = createSession(user.id);

    const response = NextResponse.json(session);

    response.cookies.set("agentos_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Google authentication failed:", error);

    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 401 }
    );
  }
}