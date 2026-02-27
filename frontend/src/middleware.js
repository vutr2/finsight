import { authMiddleware } from "@descope/nextjs-sdk/server";
import { NextResponse } from "next/server";
import { rateLimit, getIp } from "@/lib/rateLimit";

// Routes that bypass Descope auth
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/api/auth/(.*)",
  "/api/stocks(.*)",
  "/api/news(.*)",
  "/api/vnpay/ipn",
  "/api/vnpay/callback",
];

// Per-route rate limit configs  [limit, windowSeconds]
const RATE_LIMITS = {
  "/api/chat":           [20,  60],   // 20 req/min — AI is expensive
  "/api/vnpay/create":   [5,   60],   // 5 req/min — prevent payment spam
  "/api/portfolio":      [60,  60],   // 60 req/min
  "/api/user/sync":      [10,  60],   // 10 req/min
  "/api/news/analyze":   [20,  60],   // 20 req/min
  "/api/stocks":         [120, 60],   // 120 req/min — high-frequency polling
};

function getSecurityHeaders() {
  return {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    // Prevent MIME sniffing
    "X-Content-Type-Options": "nosniff",
    // XSS protection for older browsers
    "X-XSS-Protection": "1; mode=block",
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Permissions policy — disable unnecessary browser features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    // HSTS — force HTTPS (only in production)
    ...(process.env.NODE_ENV === "production" && {
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    }),
  };
}

const descopeMiddleware = authMiddleware({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
  redirectUrl: "/login",
  publicRoutes: PUBLIC_ROUTES,
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  // 1. Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    // Find matching rate limit config
    const limitKey = Object.keys(RATE_LIMITS).find((k) => pathname.startsWith(k));
    const [limit, window] = limitKey ? RATE_LIMITS[limitKey] : [100, 60];

    const result = rateLimit(`${ip}:${limitKey ?? pathname}`, { limit, window });

    if (!result.ok) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            ...getSecurityHeaders(),
          },
        }
      );
    }
  }

  // 2. Run Descope auth middleware
  const response = await descopeMiddleware(request);

  // 3. Attach security headers to every response
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
