import { NextResponse } from "next/server";
import { verifyUserCredentials, createSession } from "@/lib/auth/server-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = verifyUserCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials and try again." },
        { status: 401 }
      );
    }

    const session = createSession(user.id);

    const response = NextResponse.json(session, { status: 200 });
    response.cookies.set("agentos_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
