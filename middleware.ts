import { NextRequest, NextResponse } from "next/server";

const mobileRoutes = [
  "/api/partner", "/api/driver", "/api/user", "/api/search",
  "/api/place-details", "/api/geocode", "/api/directions",
  "/api/vehicles", "/api/booking", "/api/mobile"
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const nextConfig = { request: { headers: requestHeaders } };

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(css|js|png|jpg|jpeg|svg|ico|gif|webp|avif)$/.test(pathname)
  ) {
    return NextResponse.next(nextConfig);
  }

  if (pathname === "/") return NextResponse.next(nextConfig);

  if (pathname.startsWith("/api/auth") || pathname === "/api/mobile/login") {
    return NextResponse.next(nextConfig);
  }

  if (
    pathname === "/api/payment/stripe/webhook" ||
    pathname === "/api/payment/cmi/callback"
  ) {
    return NextResponse.next();
  }

  const isMobileRoute = mobileRoutes.some(r => pathname.startsWith(r));
  if (isMobileRoute) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return NextResponse.next(nextConfig);
    }
  }

  return NextResponse.next(nextConfig);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
