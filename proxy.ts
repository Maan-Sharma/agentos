import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "agentos_session";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  let isSignedIn = false;
  if (sessionCookie) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/auth/me`, {
        headers: { Cookie: `${SESSION_COOKIE}=${sessionCookie}` },
        cache: "no-store",
      });
      isSignedIn = response.ok;
    } catch {
      isSignedIn = false;
    }
  }
  const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

  if (isAuthPage && isSignedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthPage && !isSignedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
