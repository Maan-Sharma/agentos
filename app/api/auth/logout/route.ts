import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/server-store";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/agentos_session=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }
    }

    if (token) {
      deleteSession(token);
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("agentos_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
