import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default async function middleware(req: Request & { nextUrl: URL }) {
  // Skip auth check during build/static generation
  if (process.env.NEXT_PHASE === "phase-production-build" || 
      process.env.NEXT_PHASE === "phase-development-build" ||
      process.env.CI === "true") {
    return NextResponse.next();
  }

  try {
    const session = await auth();
    const isLoggedIn = !!session;
    const isOnAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
    const isOnApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

    if (isOnApiAuth) {
      return NextResponse.next();
    }

    if (isOnAuthPage) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
      }
      return NextResponse.next();
    }

    if (!isLoggedIn) {
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl));
    }

    return NextResponse.next();
  } catch (error) {
    // If auth fails (e.g., database unavailable), allow request to proceed
    // The page will handle auth check server-side
    console.warn("Middleware auth check failed:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};