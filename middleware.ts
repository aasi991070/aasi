import { type NextRequest, NextResponse } from "next/server";
import { CART_SESSION_COOKIE } from "@/lib/cart/constants";
import { cartSessionCookieOptions } from "@/lib/cart/session";
import { updateSession } from "@/lib/supabase/middleware";

function shouldEnsureCartSession(pathname: string): boolean {
  return (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next")
  );
}

function needsSupabaseAuth(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/account");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  let response: NextResponse;
  let user = null;

  if (needsSupabaseAuth(pathname)) {
    const session = await updateSession(request);
    response = session.supabaseResponse;
    user = session.user;

    const isAdminDashboard = pathname.startsWith("/admin/dashboard");
    const isAdminLogin = pathname === "/admin/login";

    if (isAdminDashboard && !user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminLogin && user) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  } else {
    response = NextResponse.next({ request });
  }

  if (
    shouldEnsureCartSession(pathname) &&
    !request.cookies.get(CART_SESSION_COOKIE)?.value
  ) {
    response.cookies.set(
      CART_SESSION_COOKIE,
      crypto.randomUUID(),
      cartSessionCookieOptions()
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
